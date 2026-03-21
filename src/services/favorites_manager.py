# -*- coding: utf-8 -*-
"""
收藏服务
管理用户收藏的PPT模板和生成任务
"""
import threading
from typing import Dict, List, Optional, Set
from dataclasses import dataclass
from datetime import datetime


@dataclass
class FavoriteItem:
    """收藏项"""
    id: str
    type: str  # "template" or "task"
    name: str
    description: str
    thumbnail: Optional[str] = None
    added_at: Optional[datetime] = None


class FavoritesManager:
    """收藏管理器（线程安全）"""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, '_initialized'):
            # 使用Set存储收藏，按用户ID组织
            self._favorites: Dict[str, Set[str]] = {}
            self._favorite_data: Dict[str, Dict[str, FavoriteItem]] = {}
            self._fav_lock = threading.Lock()
            self._initialized = True

    def add_favorite(
        self,
        user_id: str,
        item_id: str,
        item_type: str,
        name: str,
        description: str = "",
        thumbnail: Optional[str] = None
    ) -> bool:
        """
        添加收藏

        Args:
            user_id: 用户ID
            item_id: 收藏项ID（模板ID或任务ID）
            item_type: 类型 ("template" 或 "task")
            name: 名称
            description: 描述
            thumbnail: 缩略图

        Returns:
            是否添加成功
        """
        with self._fav_lock:
            if user_id not in self._favorites:
                self._favorites[user_id] = set()
                self._favorite_data[user_id] = {}

            fav_key = f"{item_type}:{item_id}"
            if fav_key in self._favorites[user_id]:
                return False  # 已收藏

            self._favorites[user_id].add(fav_key)
            self._favorite_data[user_id][fav_key] = FavoriteItem(
                id=item_id,
                type=item_type,
                name=name,
                description=description,
                thumbnail=thumbnail,
                added_at=datetime.now()
            )
            return True

    def remove_favorite(
        self,
        user_id: str,
        item_id: str,
        item_type: str
    ) -> bool:
        """
        移除收藏

        Args:
            user_id: 用户ID
            item_id: 收藏项ID
            item_type: 类型

        Returns:
            是否移除成功
        """
        with self._fav_lock:
            if user_id not in self._favorites:
                return False

            fav_key = f"{item_type}:{item_id}"
            if fav_key not in self._favorites[user_id]:
                return False

            self._favorites[user_id].discard(fav_key)
            self._favorite_data[user_id].pop(fav_key, None)
            return True

    def is_favorite(
        self,
        user_id: str,
        item_id: str,
        item_type: str
    ) -> bool:
        """检查是否已收藏"""
        with self._fav_lock:
            if user_id not in self._favorites:
                return False
            fav_key = f"{item_type}:{item_id}"
            return fav_key in self._favorites[user_id]

    def get_favorites(
        self,
        user_id: str,
        item_type: Optional[str] = None
    ) -> List[FavoriteItem]:
        """
        获取用户收藏列表

        Args:
            user_id: 用户ID
            item_type: 可选，筛选类型

        Returns:
            收藏项列表
        """
        with self._fav_lock:
            if user_id not in self._favorites:
                return []

            favorites = []
            for fav_key in self._favorites[user_id]:
                item = self._favorite_data[user_id].get(fav_key)
                if item and (item_type is None or item.type == item_type):
                    favorites.append(item)

            # 按添加时间倒序
            favorites.sort(key=lambda x: x.added_at or datetime.min, reverse=True)
            return favorites

    def get_favorite_ids(
        self,
        user_id: str,
        item_type: str
    ) -> List[str]:
        """获取用户收藏的ID列表（用于前端选中状态）"""
        with self._fav_lock:
            if user_id not in self._favorites:
                return []

            result = []
            for fav_key in self._favorites[user_id]:
                if fav_key.startswith(f"{item_type}:"):
                    result.append(fav_key.split(":", 1)[1])
            return result


# 全局实例
_favorites_manager: Optional[FavoritesManager] = None
_manager_lock = threading.Lock()


def get_favorites_manager() -> FavoritesManager:
    """获取收藏管理器实例（线程安全）"""
    global _favorites_manager
    if _favorites_manager is None:
        with _manager_lock:
            if _favorites_manager is None:
                _favorites_manager = FavoritesManager()
    return _favorites_manager
