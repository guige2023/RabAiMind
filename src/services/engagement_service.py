# -*- coding: utf-8 -*-
"""
Social Engagement Service - 社交互动服务
管理PPT的反应、浏览量、分享链接等社交功能
"""

import json
import os
import threading
from typing import Dict, Optional, List
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
            },
            "polls": {},
            "qa_list": []
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


# ==================== Polls ====================

    def create_poll(self, task_id, question, options):
        import uuid
        data = self._get_data(task_id)
        poll_id = 'poll_' + uuid.uuid4().hex[:12]
        poll = {
            'poll_id': poll_id, 'question': question, 'options': options,
            'option_votes': {str(i): 0 for i in range(len(options))},
            'total_votes': 0, 'user_votes': {}, 'is_active': True,
            'created_at': datetime.now().isoformat()
        }
        data.setdefault('polls', {})[poll_id] = poll
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return {'success': True, 'poll_id': poll_id, 'question': question, 'options': options, 'is_active': True}

    def vote_poll(self, task_id, poll_id, user_id, option_index):
        data = self._get_data(task_id)
        polls = data.get('polls', {})
        if poll_id not in polls:
            return {'success': False, 'error': 'Poll not found'}
        poll = polls[poll_id]
        old = poll['user_votes'].get(user_id)
        if old is not None:
            poll['option_votes'][str(old)] = max(0, poll['option_votes'][str(old)] - 1)
            poll['total_votes'] = max(0, poll['total_votes'] - 1)
        poll['option_votes'][str(option_index)] = poll['option_votes'].get(str(option_index), 0) + 1
        poll['total_votes'] += 1
        poll['user_votes'][user_id] = option_index
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return {'success': True, 'poll_id': poll_id, 'total_votes': poll['total_votes'], 'option_results': poll['option_votes'], 'user_voted_option': option_index}

    def get_poll_results(self, task_id, poll_id):
        data = self._get_data(task_id)
        polls = data.get('polls', {})
        if poll_id not in polls:
            return {'success': False, 'error': 'Poll not found'}
        poll = polls[poll_id]
        total = poll['total_votes'] or 1
        pct = {k: round(v/total*100, 1) for k, v in poll['option_votes'].items()}
        return {'success': True, 'poll_id': poll_id, 'question': poll['question'], 'options': poll['options'], 'option_votes': poll['option_votes'], 'total_votes': poll['total_votes'], 'percentage': pct, 'is_active': poll['is_active']}

    def get_polls_for_task(self, task_id):
        data = self._get_data(task_id)
        polls = data.get('polls', {})
        return {'success': True, 'task_id': task_id, 'polls': [{'poll_id': pid, 'question': p['question'], 'options': p['options'], 'is_active': p['is_active'], 'total_votes': p['total_votes']} for pid, p in polls.items()]}

    def close_poll(self, task_id, poll_id):
        data = self._get_data(task_id)
        polls = data.get('polls', {})
        if poll_id in polls:
            polls[poll_id]['is_active'] = False
            data['updated_at'] = datetime.now().isoformat()
            self._save(task_id, data)
        return {'success': True, 'poll_id': poll_id, 'is_active': False}

# ==================== Q&A ====================

    def submit_qa(self, task_id, question, asker_name="\u533f\u540d\u7528\u6237"):
        import uuid
        data = self._get_data(task_id)
        qa_id = 'qa_' + uuid.uuid4().hex[:12]
        qa = {
            'qa_id': qa_id, 'question': question, 'asker': asker_name,
            'is_answered': False, 'upvotes': 0, 'upvoters': [],
            'created_at': datetime.now().isoformat(), 'answers': []
        }
        data.setdefault('qa_list', []).insert(0, qa)
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return {'success': True, 'qa_id': qa_id, 'question': question, 'asker': asker_name, 'created_at': qa['created_at']}

    def upvote_qa(self, task_id, qa_id, user_id):
        data = self._get_data(task_id)
        qa_list = data.get('qa_list', [])
        for qa in qa_list:
            if qa['qa_id'] == qa_id:
                if user_id not in qa['upvoters']:
                    qa['upvotes'] += 1
                    qa['upvoters'].append(user_id)
                break
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        qa = next((q for q in qa_list if q['qa_id'] == qa_id), None)
        return {'success': True, 'qa_id': qa_id, 'upvotes': qa['upvotes'] if qa else 0}

    def get_qa_list(self, task_id):
        data = self._get_data(task_id)
        qa_list = data.get('qa_list', [])
        sorted_qa = sorted(qa_list, key=lambda x: (-x.get('upvotes', 0), x.get('created_at', '')))
        return {'success': True, 'task_id': task_id, 'questions': [{'qa_id': q['qa_id'], 'question': q['question'], 'asker': q['asker'], 'is_answered': q['is_answered'], 'upvotes': q.get('upvotes', 0), 'created_at': q['created_at'], 'answer_count': len(q.get('answers', []))} for q in sorted_qa], 'total': len(sorted_qa)}

    def answer_qa(self, task_id, qa_id, answer, answerer='\u6f14\u8bb2\u8005'):
        data = self._get_data(task_id)
        qa_list = data.get('qa_list', [])
        for qa in qa_list:
            if qa['qa_id'] == qa_id:
                qa['is_answered'] = True
                qa['answers'].append({"text": answer, "answerer": answerer, "answered_at": datetime.now().isoformat()})
                break
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return {'success': True, 'qa_id': qa_id, 'is_answered': True}

# ==================== Lead Capture ====================

    def add_lead_capture(self, task_id, email, name="", company="", extra=None):
        import uuid, hashlib
        data = self._get_data(task_id)
        lead_id = 'lead_' + uuid.uuid4().hex[:12]
        email_hash = hashlib.sha256(email.lower().strip().encode()).hexdigest()[:16]
        lead = {
            'lead_id': lead_id, 'email': email.lower().strip(), 'email_hash': email_hash,
            'name': name.strip() if name else '', 'company': company.strip() if company else '',
            'extra': extra or {}, 'captured_at': datetime.now().isoformat(), 'source': 'embed_widget'
        }
        for ex in data.get('lead_captures', {}).values():
            if ex.get('email_hash') == email_hash:
                return {'success': False, 'error': 'Email already registered', 'lead_id': ex['lead_id']}
        data.setdefault('lead_captures', {})[lead_id] = lead
        data['updated_at'] = datetime.now().isoformat()
        self._save(task_id, data)
        return {'success': True, 'lead_id': lead_id, 'email': lead['email'], 'captured_at': lead['captured_at']}

    def get_lead_captures(self, task_id):
        data = self._get_data(task_id)
        leads = data.get('lead_captures', {})
        lead_list = [{'lead_id': lid, 'email': l['email'], 'name': l.get('name', ''), 'company': l.get('company', ''), 'captured_at': l['captured_at']} for lid, l in leads.items()]
        lead_list.sort(key=lambda x: x['captured_at'], reverse=True)
        return {'success': True, 'task_id': task_id, 'leads': lead_list, 'total': len(lead_list)}

    def get_lead_stats(self, task_id):
        data = self._get_data(task_id)
        leads = data.get('lead_captures', {})
        return {'success': True, 'task_id': task_id, 'total_leads': len(leads), 'companies': len(set(l.get('company', '') for l in leads.values() if l.get('company')))}

_engagement_service: Optional[EngagementService] = None

def get_engagement_service() -> EngagementService:
    global _engagement_service
    if _engagement_service is None:
        _engagement_service = EngagementService()
    return _engagement_service

