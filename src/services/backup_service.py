# -*- coding: utf-8 -*-
"""
备份服务 - Presentation Backup & Restore

R125: Presentation Backup & Restore
- Cloud backup - automatic backup to cloud storage
- Local backup - export presentations as backup files
- One-click restore - restore from any backup point
- Backup history - view all backup points with timestamps
- Selective restore - restore specific slides from backup
"""

import json
import os
import shutil
import uuid
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

from ..config import settings
from ..utils import get_timestamp, ensure_dir

BACKUP_DIR = Path(__file__).parent.parent / "data" / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


class BackupService:
    """备份服务"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._backups: Dict[str, Dict] = {}
            cls._instance._load_backups_index()
        return cls._instance
    
    def _load_backups_index(self):
        """从磁盘加载备份索引"""
        index_file = BACKUP_DIR / "backups_index.json"
        if index_file.exists():
            try:
                with open(index_file, "r", encoding="utf-8") as f:
                    self._backups = json.load(f)
            except Exception:
                self._backups = {}
    
    def _save_backups_index(self):
        """保存备份索引到磁盘"""
        ensure_dir(BACKUP_DIR)
        index_file = BACKUP_DIR / "backups_index.json"
        with open(index_file, "w", encoding="utf-8") as f:
            json.dump(self._backups, f, ensure_ascii=False, indent=2)
    
    def _ensure_task_dir(self, task_id: str) -> Path:
        """确保任务的备份目录存在"""
        task_dir = BACKUP_DIR / task_id
        ensure_dir(task_dir)
        return task_dir
    
    def create_backup(
        self,
        task_id: str,
        task_data: Dict[str, Any],
        backup_name: Optional[str] = None,
        include_pptx: bool = True,
        include_svg: bool = True,
        backup_type: str = "manual",  # manual | auto | cloud
    ) -> Dict[str, Any]:
        """
        创建任务备份
        Returns: {success, backup_id, backup_path, created_at}
        """
        backup_id = f"bk_{uuid.uuid4().hex[:12]}"
        timestamp = get_timestamp()
        
        # 创建备份目录
        task_dir = self._ensure_task_dir(task_id)
        backup_subdir = task_dir / backup_id
        ensure_dir(backup_subdir)
        
        # 准备备份数据
        backup_info = {
            "backup_id": backup_id,
            "task_id": task_id,
            "name": backup_name or f"备份 {timestamp}",
            "backup_type": backup_type,
            "created_at": timestamp,
            "include_pptx": include_pptx,
            "include_svg": include_svg,
            "files": {},
        }
        
        # 复制 PPTX 文件
        pptx_path = ""
        if include_pptx and task_data.get("result", {}).get("pptx_path"):
            src_pptx = Path(task_data["result"]["pptx_path"])
            if src_pptx.exists():
                dst_pptx = backup_subdir / f"{task_id}.pptx"
                shutil.copy2(src_pptx, dst_pptx)
                pptx_path = str(dst_pptx)
                backup_info["files"]["pptx"] = f"{task_id}.pptx"
        
        # 复制 SVG 文件
        svg_files = []
        if include_svg and task_data.get("result", {}).get("svg_paths"):
            svg_dir = backup_subdir / "svg"
            ensure_dir(svg_dir)
            for svg_path_str in task_data["result"]["svg_paths"]:
                svg_path = Path(svg_path_str)
                if svg_path.exists():
                    dst_svg = svg_dir / svg_path.name
                    shutil.copy2(svg_path, dst_svg)
                    svg_files.append(str(dst_svg))
            backup_info["files"]["svg"] = [str(p) for p in svg_files]
        
        # 保存任务数据（完整副本）
        task_backup_path = backup_subdir / "task_data.json"
        task_backup_data = {
            "task_id": task_id,
            "outline": task_data.get("outline", {}),
            "params": task_data.get("params", {}),
            "scene": task_data.get("scene", "business"),
            "style": task_data.get("style", "professional"),
            "template": task_data.get("template", "default"),
            "theme_color": task_data.get("theme_color", "#165DFF"),
            "layout_mode": task_data.get("layout_mode", "auto"),
            "result": task_data.get("result", {}),
            "versions": task_data.get("versions", []),
            "action_timeline": task_data.get("action_timeline", []),
            "undo_stack": task_data.get("undo_stack", []),
            "redo_stack": task_data.get("redo_stack", []),
        }
        with open(task_backup_path, "w", encoding="utf-8") as f:
            json.dump(task_backup_data, f, ensure_ascii=False, indent=2)
        backup_info["files"]["task_data"] = "task_data.json"
        
        # 保存元信息
        meta_path = backup_subdir / "backup_meta.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(backup_info, f, ensure_ascii=False, indent=2)
        
        # 计算备份大小
        total_size = sum(
            f.stat().st_size for f in backup_subdir.rglob("*") if f.is_file()
        )
        backup_info["size_bytes"] = total_size
        backup_info["size_str"] = self._format_size(total_size)
        backup_info["slide_count"] = len(task_data.get("result", {}).get("slides_summary", []))
        backup_info["pptx_path"] = pptx_path
        backup_info["svg_paths"] = svg_files
        
        # 更新索引
        if task_id not in self._backups:
            self._backups[task_id] = []
        self._backups[task_id].append(backup_info)
        self._save_backups_index()
        
        return {
            "success": True,
            "backup_id": backup_id,
            "backup_path": str(backup_subdir),
            "created_at": timestamp,
            "name": backup_info["name"],
            "backup_type": backup_type,
            "size_bytes": total_size,
            "size_str": backup_info["size_str"],
            "slide_count": backup_info["slide_count"],
        }
    
    def list_backups(self, task_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """列出备份历史"""
        if task_id:
            backups = self._backups.get(task_id, [])
            return sorted(backups, key=lambda x: x["created_at"], reverse=True)
        else:
            # 返回所有任务的最新备份摘要
            all_backups = []
            for tid, backups in self._backups.items():
                if backups:
                    latest = sorted(backups, key=lambda x: x["created_at"], reverse=True)[0]
                    all_backups.append({
                        "task_id": tid,
                        "backup_id": latest["backup_id"],
                        "name": latest["name"],
                        "backup_type": latest["backup_type"],
                        "created_at": latest["created_at"],
                        "size_str": latest.get("size_str", "0 B"),
                        "slide_count": latest.get("slide_count", 0),
                    })
            return sorted(all_backups, key=lambda x: x["created_at"], reverse=True)
    
    def get_backup(self, backup_id: str, task_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """获取备份详情"""
        if task_id:
            backups = self._backups.get(task_id, [])
        else:
            backups = []
            for t_backups in self._backups.values():
                backups.extend(t_backups)
        
        for backup in backups:
            if backup["backup_id"] == backup_id:
                # 补充完整信息
                backup_subdir = BACKUP_DIR / backup["task_id"] / backup_id
                task_data_path = backup_subdir / "task_data.json"
                if task_data_path.exists():
                    with open(task_data_path, "r", encoding="utf-8") as f:
                        full_data = json.load(f)
                    backup["full_task_data"] = full_data
                return backup
        return None
    
    def get_backup_slides(self, backup_id: str, task_id: str) -> Optional[List[Dict]]:
        """获取备份中的幻灯片数据（用于选择性恢复）"""
        backup = self.get_backup(backup_id, task_id)
        if not backup:
            return None
        full_data = backup.get("full_task_data", {})
        result = full_data.get("result", {})
        slides_summary = result.get("slides_summary", [])
        
        # 获取SVG路径
        svg_dir = BACKUP_DIR / task_id / backup_id / "svg"
        svg_files = {}
        if svg_dir.exists():
            for f in svg_dir.iterdir():
                if f.suffix == ".svg":
                    svg_files[f.stem] = str(f)
        
        # 构建带预览URL的幻灯片列表
        slides = []
        for i, summary in enumerate(slides_summary):
            slide_num = i + 1
            svg_path = svg_files.get(f"slide_{slide_num}", "")
            slides.append({
                "slide_num": slide_num,
                "title": summary.get("title", ""),
                "content": summary.get("content", "")[:200],
                "has_chart": summary.get("has_chart", False),
                "chart_type": summary.get("chart_type"),
                "svg_path": svg_path,
            })
        return slides
    
    def restore_backup(
        self,
        backup_id: str,
        task_id: str,
        restore_type: str = "full",  # full | slides | config
        selected_slide_nums: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """
        从备份恢复
        
        restore_type:
        - full: 恢复所有内容（覆盖当前）
        - slides: 只恢复选定的幻灯片
        - config: 只恢复配置（scene/style/template等）
        """
        backup = self.get_backup(backup_id, task_id)
        if not backup:
            raise ValueError(f"Backup {backup_id} not found")
        
        full_data = backup.get("full_task_data", {})
        if not full_data:
            raise ValueError(f"Backup data corrupted")
        
        task_backup_path = BACKUP_DIR / task_id / backup_id / "task_data.json"
        if task_backup_path.exists():
            with open(task_backup_path, "r", encoding="utf-8") as f:
                full_data = json.load(f)
        
        restore_result = {
            "backup_id": backup_id,
            "task_id": task_id,
            "restore_type": restore_type,
            "restored_at": get_timestamp(),
        }
        
        if restore_type == "full":
            restore_result["message"] = "全量恢复完成"
            restore_result["data"] = full_data
            restore_result["pptx_path"] = str(BACKUP_DIR / task_id / backup_id / f"{task_id}.pptx")
            
        elif restore_type == "slides":
            if not selected_slide_nums:
                raise ValueError("selected_slide_nums required for slides restore")
            restore_result["message"] = f"已恢复第 {', '.join(map(str, selected_slide_nums))} 页"
            restore_result["selected_slides"] = selected_slide_nums
            restore_result["data"] = full_data
            
        elif restore_type == "config":
            restore_result["message"] = "配置已恢复"
            restore_result["config"] = {
                "scene": full_data.get("scene"),
                "style": full_data.get("style"),
                "template": full_data.get("template"),
                "theme_color": full_data.get("theme_color"),
                "layout_mode": full_data.get("layout_mode"),
            }
        
        return restore_result
    
    def delete_backup(self, backup_id: str, task_id: str) -> Dict[str, Any]:
        """删除备份"""
        backup_dir = BACKUP_DIR / task_id / backup_id
        if backup_dir.exists():
            shutil.rmtree(backup_dir)
        
        if task_id in self._backups:
            self._backups[task_id] = [
                b for b in self._backups[task_id] if b["backup_id"] != backup_id
            ]
            if not self._backups[task_id]:
                del self._backups[task_id]
        self._save_backups_index()
        
        return {"success": True, "backup_id": backup_id}
    
    def export_backup_file(self, backup_id: str, task_id: str) -> str:
        """导出备份为单个压缩文件（.rabak）"""
        backup_subdir = BACKUP_DIR / task_id / backup_id
        if not backup_subdir.exists():
            raise ValueError(f"Backup {backup_id} not found")
        
        backup = self.get_backup(backup_id, task_id)
        backup_name = backup["name"] if backup else backup_id
        safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in backup_name)
        
        export_path = BACKUP_DIR / f"{safe_name}_{backup_id}.rabak"
        with zipfile.ZipFile(export_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path in backup_subdir.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(backup_subdir)
                    zf.write(file_path, arcname)
        
        return str(export_path)
    
    def import_backup_file(self, file_path: str) -> Dict[str, Any]:
        """从备份文件导入（.rabak）"""
        import tempfile
        
        if not os.path.exists(file_path):
            raise ValueError(f"File not found: {file_path}")
        
        with tempfile.TemporaryDirectory() as tmpdir:
            with zipfile.ZipFile(file_path, "r") as zf:
                zf.extractall(tmpdir)
            
            task_data_path = Path(tmpdir) / "task_data.json"
            if not task_data_path.exists():
                raise ValueError("Invalid backup file: missing task_data.json")
            
            with open(task_data_path, "r", encoding="utf-8") as f:
                task_data = json.load(f)
            
            task_id = task_data.get("task_id", "imported")
            
            meta_path = Path(tmpdir) / "backup_meta.json"
            meta = {}
            if meta_path.exists():
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
            
            result = self.create_backup(
                task_id=task_id,
                task_data=task_data,
                backup_name=f"导入: {meta.get('name', '未知备份')}",
                include_pptx=True,
                include_svg=True,
                backup_type="imported",
            )
            
            return result
    
    @staticmethod
    def _format_size(size_bytes: int) -> str:
        """格式化文件大小"""
        for unit in ["B", "KB", "MB", "GB"]:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} TB"


def get_backup_service() -> BackupService:
    return BackupService()
