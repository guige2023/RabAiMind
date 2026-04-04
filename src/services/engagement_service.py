# -*- coding: utf-8 -*-
"""
Social Engagement Service - 社交互动服务
管理PPT的反应、浏览量、分享链接等社交功能
"""

import json
import os
import threading
from typing import Dict, Optional
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'engagement')
os.makedirs(DATA_DIR, exist_ok=True)

LOCK = threading.Lock()


class EngagementService:
    """社交互动服务"""
    
    _instance: Optional['EngagementService'] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._lock = LOCK
        # In-memory cache for performance
        self._cache: Dict[str, dict] = {}
        self._load_all()
    
    def _data_file(self, task_id: str) -> str:
        return os.path.join(DATA_DIR, f"{task_id}.json")
    
    def _load_all(self):
        """Load all engagement data into memory"""
        try:
            for fname in os.listdir(DATA_DIR):
                if fname.endswith('.json'):
                    fpath = os.path.join(DATA_DIR, fname)
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        task_id = fname.replace('.json', '')
                        self._cache[task_id] = data
        except Exception:
            pass
    
    def _save(self, task_id: str, data: dict):
        """Persist data to disk"""
        with self._lock:
            fpath = self._data_file(task_id)
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self._cache[task_id] = data
    
    def _get_data(self, task_id: str) -> dict:
        """Get engagement data for a task"""
        if task_id in self._cache:
            return self._cache[task_id]
        
        fpath = self._data_file(task_id)
        if os.path.exists(fpath):
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._cache[task_id] = data
                    return data
            except Exception:
                pass
        
        # Default structure
        return {
            "task_id": task_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "is_public": False,
            "view_count": 0,
            "share_count": 0,
            "comment_count": 0,
            "reactions": {
                "like": 0,
                "fire": 0,
                "heart": 0
            },
            "user_reactions": {},  # user_id -> reaction_type
            "share_link": {
                "title": "",
                "description": "",
                "thumbnail": None
            }
        }
    
    # ==================== View Counter ====================
    
    def increment_view(self, task_id: str) -> int:
        """Increment view count and return new count"""
        data = self._get_data(task_id)
        data['view_count'] = data.get('view_count', 0) + 1
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return data['view_count']
    
    def get_view_count(self, task_id: str) -> int:
        """Get current view count"""
        return self._get_data(task_id).get('view_count', 0)
    
    def get_engagement_stats(self, task_id: str) -> dict:
        """Get all engagement stats"""
        data = self._get_data(task_id)
        return {
            "success": True,
            "task_id": task_id,
            "view_count": data.get('view_count', 0),
            "likes": data.get('reactions', {}).get('like', 0),
            "fires": data.get('reactions', {}).get('fire', 0),
            "hearts": data.get('reactions', {}).get('heart', 0),
            "comment_count": data.get('comment_count', 0),
            "share_count": data.get('share_count', 0),
            "is_public": data.get('is_public', False)
        }
    
    # ==================== Reactions ====================
    
    def add_reaction(self, task_id: str, user_id: str, reaction_type: str) -> dict:
        """Add or update a reaction from a user"""
        data = self._get_data(task_id)
        
        # Remove previous reaction count
        old_reaction = data['user_reactions'].get(user_id)
        if old_reaction:
            if old_reaction in data['reactions']:
                data['reactions'][old_reaction] = max(0, data['reactions'][old_reaction] - 1)
        
        # Add new reaction
        if reaction_type in data['reactions']:
            data['reactions'][reaction_type] = data['reactions'].get(reaction_type, 0) + 1
            data['user_reactions'][user_id] = reaction_type
        
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        
        return {
            "success": True,
            "task_id": task_id,
            "reaction_type": reaction_type,
            "total_likes": data['reactions'].get('like', 0),
            "total_fires": data['reactions'].get('fire', 0),
            "total_hearts": data['reactions'].get('heart', 0),
            "user_reaction": reaction_type
        }
    
    def remove_reaction(self, task_id: str, user_id: str) -> dict:
        """Remove a user's reaction"""
        data = self._get_data(task_id)
        
        old_reaction = data['user_reactions'].get(user_id)
        if old_reaction and old_reaction in data['reactions']:
            data['reactions'][old_reaction] = max(0, data['reactions'][old_reaction] - 1)
            del data['user_reactions'][user_id]
        
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        
        return {
            "success": True,
            "task_id": task_id,
            "reaction_type": None,
            "total_likes": data['reactions'].get('like', 0),
            "total_fires": data['reactions'].get('fire', 0),
            "total_hearts": data['reactions'].get('heart', 0),
            "user_reaction": None
        }
    
    def get_user_reaction(self, task_id: str, user_id: str) -> Optional[str]:
        """Get current user's reaction"""
        data = self._get_data(task_id)
        return data['user_reactions'].get(user_id)
    
    # ==================== Share Link ====================
    
    def set_share_link(self, task_id: str, title: str, description: str, thumbnail: Optional[str]) -> dict:
        """Set custom share link metadata"""
        data = self._get_data(task_id)
        data['share_link'] = {
            "title": title,
            "description": description,
            "thumbnail": thumbnail
        }
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        
        from ..config import settings
        base_url = getattr(settings, 'APP_BASE_URL', 'http://localhost:3000')
        share_url = f"{base_url}/result?taskId={task_id}"
        
        return {
            "success": True,
            "task_id": task_id,
            "share_url": share_url,
            "title": title,
            "description": description,
            "thumbnail": thumbnail
        }
    
    def get_share_link(self, task_id: str) -> dict:
        """Get share link metadata"""
        data = self._get_data(task_id)
        sl = data.get('share_link', {})
        
        from ..config import settings
        base_url = getattr(settings, 'APP_BASE_URL', 'http://localhost:3000')
        share_url = f"{base_url}/result?taskId={task_id}"
        
        return {
            "success": True,
            "task_id": task_id,
            "share_url": share_url,
            "title": sl.get('title', ''),
            "description": sl.get('description', ''),
            "thumbnail": sl.get('thumbnail')
        }
    
    def increment_share_count(self, task_id: str) -> int:
        """Increment share count"""
        data = self._get_data(task_id)
        data['share_count'] = data.get('share_count', 0) + 1
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return data['share_count']
    
    # ==================== Public/Private ====================
    
    def set_public(self, task_id: str, is_public: bool):
        """Set PPT as public or private"""
        data = self._get_data(task_id)
        data['is_public'] = is_public
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return {"success": True, "task_id": task_id, "is_public": is_public}


_engagement_service: Optional[EngagementService] = None

def get_engagement_service() -> EngagementService:
    global _engagement_service
    if _engagement_service is None:
        _engagement_service = EngagementService()
    return _engagement_service
