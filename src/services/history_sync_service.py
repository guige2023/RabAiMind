# -*- coding: utf-8 -*-
"""
历史记录云端同步服务

将 PPT 生成任务历史同步到 OSS，支持多端同步和冲突处理。
使用 last-write-wins 策略：以 updated_at 时间戳判断最新版本。

存储结构 (OSS):
  history/
    manifest.json          # 所有任务的索引 + 版本信息
    tasks/
      {task_id}.json        # 单个任务的完整数据

作者: Claude
日期: 2026-03-29
"""

import json
import logging
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

from ..config import settings
from ..utils import ensure_dir

logger = logging.getLogger(__name__)


class HistorySyncService:
    """
    历史记录云端同步服务
    
    功能:
    - 上传任务到 OSS
    - 从 OSS 拉取任务列表
    - 多端冲突处理 (last-write-wins)
    - 本地缓存加速
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized"):
            return
        self._initialized = True

        self._oss_enabled = (
            settings.OSS_ENABLED
            and settings.OSS_ENDPOINT
            and settings.OSS_ACCESS_KEY
            and settings.OSS_SECRET_KEY
            and settings.OSS_BUCKET
        )

        self._oss_client = None
        self._oss_bucket = None
        self._local_cache: Dict[str, Dict] = {}  # task_id -> task data
        self._cache_lock = threading.Lock()

        # 本地缓存目录（fallback / 加速用）
        self._cache_dir = "./.history_cache"
        ensure_dir(self._cache_dir)

        if self._oss_enabled:
            self._init_oss()
        else:
            logger.warning(
                "[HistorySync] OSS 未启用，历史记录将仅保存在本地。 "
                "请设置 OSS_ENABLED=true 及相关环境变量实现云端同步。"
            )

    def _init_oss(self) -> None:
        """初始化 OSS 客户端"""
        try:
            import oss2

            auth = oss2.Auth(settings.OSS_ACCESS_KEY, settings.OSS_SECRET_KEY)
            self._oss_bucket = oss2.Bucket(auth, settings.OSS_ENDPOINT, settings.OSS_BUCKET)
            self._oss_client = oss2
            logger.info(
                f"[HistorySync] OSS 初始化成功: {settings.OSS_ENDPOINT}/{settings.OSS_BUCKET}"
            )
        except Exception as e:
            logger.error(f"[HistorySync] OSS 初始化失败: {e}")
            self._oss_enabled = False

    # ─── 公共 API ────────────────────────────────────────────────

    def push_task(self, task_id: str, task_data: Dict[str, Any]) -> bool:
        """
        上传单个任务到 OSS
        
        Args:
            task_id: 任务ID
            task_data: 任务完整数据
            
        Returns:
            是否成功
        """
        if not self._oss_enabled:
            # 仅写本地缓存
            return self._cache_to_local(task_id, task_data)

        try:
            # 1. 写入任务文件
            task_key = f"history/tasks/{task_id}.json"
            task_json = json.dumps(task_data, ensure_ascii=False, indent=2)
            self._oss_bucket.put_object(task_key, task_json.encode("utf-8"))

            # 2. 更新 manifest（获取远程版本，比对时间戳）
            manifest = self._get_manifest()
            
            local_updated = task_data.get("updated_at", "")
            remote_updated = manifest.get(task_id, {}).get("updated_at", "")

            # last-write-wins: 仅当本地更新更新时，才更新 manifest
            if self._is_newer(local_updated, remote_updated):
                manifest[task_id] = {
                    "updated_at": local_updated,
                    "pushed_at": datetime.now().isoformat(),
                    "status": task_data.get("status", "unknown"),
                }
                self._put_manifest(manifest)

            # 3. 更新本地缓存
            with self._cache_lock:
                self._local_cache[task_id] = task_data

            # 4. 同步写本地文件（离线可用）
            self._cache_to_local(task_id, task_data)

            logger.debug(f"[HistorySync] 推送任务 {task_id} 到 OSS 成功")
            return True

        except Exception as e:
            logger.error(f"[HistorySync] 推送任务 {task_id} 失败: {e}")
            # OSS 失败时降级到本地缓存
            return self._cache_to_local(task_id, task_data)

    def pull_tasks(self, since_updated_at: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        从 OSS 拉取任务历史
        
        Args:
            since_updated_at: 可选，只拉取此时间之后更新的任务（增量同步）
            
        Returns:
            {task_id: task_data}
        """
        result: Dict[str, Dict[str, Any]] = {}

        # 1. 先尝试 OSS
        if self._oss_enabled:
            try:
                manifest = self._get_manifest()
                
                for task_id, meta in manifest.items():
                    updated_at = meta.get("updated_at", "")
                    
                    if since_updated_at and not self._is_newer(updated_at, since_updated_at):
                        continue  # 跳过旧任务

                    task_data = self._fetch_task_file(task_id)
                    if task_data:
                        result[task_id] = task_data

                logger.info(f"[HistorySync] 从 OSS 拉取 {len(result)} 个任务")
                return result

            except Exception as e:
                logger.warning(f"[HistorySync] OSS 拉取失败，降级到本地: {e}")

        # 2. Fallback: 从本地缓存加载
        return self._load_local_cache()

    def pull_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """拉取所有任务（不做时间过滤）"""
        return self.pull_tasks(since_updated_at=None)

    def resolve_and_merge(
        self,
        local_tasks: Dict[str, Dict[str, Any]],
        remote_tasks: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        合并本地和远程任务，解决冲突
        
        策略: last-write-wins
        - 比较 updated_at 时间戳
        - 保留最新版本
        - 记录合并来源（local/remote）
        
        Returns:
            合并后的任务字典
        """
        merged: Dict[str, Dict[str, Any]] = {}
        all_task_ids = set(local_tasks.keys()) | set(remote_tasks.keys())

        for task_id in all_task_ids:
            local = local_tasks.get(task_id)
            remote = remote_tasks.get(task_id)

            if local and not remote:
                merged[task_id] = {**local, "_source": "local"}
            elif remote and not local:
                merged[task_id] = {**remote, "_source": "remote"}
            else:
                # 两者都有 → last-write-wins
                local_ts = local.get("updated_at", "")
                remote_ts = remote.get("updated_at", "")

                if self._is_newer(local_ts, remote_ts):
                    merged[task_id] = {**local, "_source": "local"}
                    logger.debug(f"[HistorySync] 任务 {task_id} 使用本地版本（{local_ts}）")
                else:
                    merged[task_id] = {**remote, "_source": "remote"}
                    logger.debug(f"[HistorySync] 任务 {task_id} 使用远程版本（{remote_ts}）")

        return merged

    def get_last_sync_time(self) -> Optional[str]:
        """获取上次同步时间"""
        try:
            manifest = self._get_manifest()
            return manifest.get("_sync_meta", {}).get("last_sync_at")
        except Exception:
            return None

    # ─── Manifest 操作 ────────────────────────────────────────────

    def _get_manifest(self) -> Dict[str, Any]:
        """获取远程 manifest"""
        try:
            result = self._oss_bucket.get_object("history/manifest.json")
            content = result.read()
            return json.loads(content.decode("utf-8"))
        except oss2.exceptions.NoSuchKey:
            return {}
        except Exception as e:
            logger.warning(f"[HistorySync] 读取 manifest 失败: {e}")
            return {}

    def _put_manifest(self, manifest: Dict[str, Any]) -> None:
        """写入远程 manifest"""
        try:
            # 追加同步元信息
            manifest.setdefault("_sync_meta", {})
            manifest["_sync_meta"]["last_sync_at"] = datetime.now().isoformat()
            
            data = json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8")
            self._oss_bucket.put_object("history/manifest.json", data)
        except Exception as e:
            logger.error(f"[HistorySync] 写入 manifest 失败: {e}")

    # ─── 文件操作 ────────────────────────────────────────────────

    def _fetch_task_file(self, task_id: str) -> Optional[Dict[str, Any]]:
        """从 OSS 读取单个任务文件"""
        try:
            key = f"history/tasks/{task_id}.json"
            result = self._oss_bucket.get_object(key)
            content = result.read()
            return json.loads(content.decode("utf-8"))
        except oss2.exceptions.NoSuchKey:
            return None
        except Exception as e:
            logger.warning(f"[HistorySync] 读取任务文件 {task_id} 失败: {e}")
            return None

    # ─── 本地缓存（离线支持）──────────────────────────────────────

    def _cache_to_local(self, task_id: str, task_data: Dict[str, Any]) -> bool:
        """写本地缓存文件"""
        try:
            import os
            filepath = os.path.join(self._cache_dir, f"{task_id}.json")
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(task_data, f, ensure_ascii=False, indent=2)
            
            with self._cache_lock:
                self._local_cache[task_id] = task_data
            return True
        except Exception as e:
            logger.warning(f"[HistorySync] 本地缓存写入失败: {e}")
            return False

    def _load_local_cache(self) -> Dict[str, Dict[str, Any]]:
        """加载所有本地缓存文件"""
        result = {}
        try:
            import os
            if not os.path.exists(self._cache_dir):
                return result

            for filename in os.listdir(self._cache_dir):
                if filename.endswith(".json"):
                    filepath = os.path.join(self._cache_dir, filename)
                    task_id = filename[:-5]  # 去掉 .json
                    try:
                        with open(filepath, encoding="utf-8") as f:
                            result[task_id] = json.load(f)
                    except Exception:
                        pass
        except Exception as e:
            logger.warning(f"[HistorySync] 本地缓存读取失败: {e}")

        return result

    # ─── 工具方法 ────────────────────────────────────────────────

    @staticmethod
    def _is_newer(ts1: str, ts2: str) -> bool:
        """判断 ts1 是否比 ts2 更新"""
        if not ts1:
            return False
        if not ts2:
            return True
        try:
            dt1 = datetime.fromisoformat(ts1.replace("Z", "+00:00"))
            dt2 = datetime.fromisoformat(ts2.replace("Z", "+00:00"))
            return dt1 > dt2
        except Exception:
            # 解析失败时保守处理：两个都返回 False
            return ts1 > ts2

    def is_enabled(self) -> bool:
        """是否启用云端同步"""
        return self._oss_enabled


# 全局实例
_history_sync_service: Optional[HistorySyncService] = None
_service_lock = threading.Lock()


def get_history_sync_service() -> HistorySyncService:
    """获取历史同步服务实例"""
    global _history_sync_service
    if _history_sync_service is None:
        with _service_lock:
            if _history_sync_service is None:
                _history_sync_service = HistorySyncService()
    return _history_sync_service
