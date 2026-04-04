"""
Template Marketplace Service
包含评分、点评、精选、订阅、捆绑等功能
"""
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

REVIEWS_FILE = DATA_DIR / "template_reviews.json"
FEATURED_FILE = DATA_DIR / "featured_templates.json"
SUBSCRIPTIONS_FILE = DATA_DIR / "template_subscriptions.json"
BUNDLES_FILE = DATA_DIR / "template_bundles.json"
BUNDLE_PURCHASES_FILE = DATA_DIR / "bundle_purchases.json"


def _load_json(path: Path) -> Any:
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return None


def _save_json(path: Path, data: Any):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


@dataclass
class Review:
    id: str
    template_id: str
    user_id: str
    user_name: str
    rating: int  # 1-5
    content: str
    created_at: str


@dataclass
class Subscription:
    id: str
    user_id: str
    category: str  # 订阅的分类
    created_at: str
    active: bool = True


@dataclass
class Bundle:
    id: str
    name: str
    description: str
    template_ids: List[str]
    discount_percent: int  # e.g. 20 = 8折
    created_at: str
    active: bool = True


@dataclass
class BundlePurchase:
    id: str
    bundle_id: str
    user_id: str
    purchased_at: str


class MarketplaceService:
    """模板市场服务"""

    def __init__(self):
        self.reviews: Dict[str, List[dict]] = self._load_reviews()
        self.featured_ids: List[str] = self._load_featured()
        self.subscriptions: List[dict] = self._load_subscriptions()
        self.bundles: List[dict] = self._load_bundles()
        self.bundle_purchases: List[dict] = self._load_bundle_purchases()

    # ─── Reviews ────────────────────────────────────────────────

    def _load_reviews(self) -> Dict[str, List[dict]]:
        data = _load_json(REVIEWS_FILE)
        return data or {}

    def _save_reviews(self):
        _save_json(REVIEWS_FILE, self.reviews)

    def add_review(self, template_id: str, user_id: str, user_name: str, rating: int, content: str) -> dict:
        """添加或更新点评"""
        if template_id not in self.reviews:
            self.reviews[template_id] = []
        
        # 检查是否已点评
        for r in self.reviews[template_id]:
            if r["user_id"] == user_id:
                r["rating"] = rating
                r["content"] = content
                r["created_at"] = datetime.now().isoformat()
                self._save_reviews()
                return r
        
        review = {
            "id": f"rev_{int(time.time())}_{user_id[:6]}",
            "template_id": template_id,
            "user_id": user_id,
            "user_name": user_name,
            "rating": min(5, max(1, rating)),
            "content": content,
            "created_at": datetime.now().isoformat()
        }
        self.reviews[template_id].append(review)
        self._save_reviews()
        return review

    def get_reviews(self, template_id: str) -> dict:
        """获取模板的所有点评"""
        reviews = self.reviews.get(template_id, [])
        if not reviews:
            return {"reviews": [], "count": 0, "average_rating": 0.0}
        
        total = sum(r["rating"] for r in reviews)
        avg = total / len(reviews)
        return {
            "reviews": sorted(reviews, key=lambda x: x["created_at"], reverse=True),
            "count": len(reviews),
            "average_rating": round(avg, 1)
        }

    def delete_review(self, template_id: str, review_id: str, user_id: str) -> bool:
        """删除点评"""
        if template_id not in self.reviews:
            return False
        original_len = len(self.reviews[template_id])
        self.reviews[template_id] = [
            r for r in self.reviews[template_id]
            if not (r["id"] == review_id and r["user_id"] == user_id)
        ]
        if len(self.reviews[template_id]) < original_len:
            self._save_reviews()
            return True
        return False

    # ─── Featured Templates ──────────────────────────────────────

    def _load_featured(self) -> List[str]:
        data = _load_json(FEATURED_FILE)
        return data or []

    def _save_featured(self):
        _save_json(FEATURED_FILE, self.featured_ids)

    def get_featured_templates(self) -> List[str]:
        return self.featured_ids

    def add_featured(self, template_id: str) -> bool:
        if template_id not in self.featured_ids:
            self.featured_ids.append(template_id)
            self._save_featured()
        return True

    def remove_featured(self, template_id: str) -> bool:
        if template_id in self.featured_ids:
            self.featured_ids.remove(template_id)
            self._save_featured()
            return True
        return False

    def is_featured(self, template_id: str) -> bool:
        return template_id in self.featured_ids

    # ─── Subscriptions ──────────────────────────────────────────

    def _load_subscriptions(self) -> List[dict]:
        data = _load_json(SUBSCRIPTIONS_FILE)
        return data or []

    def _save_subscriptions(self):
        _save_json(SUBSCRIPTIONS_FILE, self.subscriptions)

    def subscribe(self, user_id: str, category: str) -> Subscription:
        """订阅某分类的新模板通知"""
        # 检查是否已订阅
        for s in self.subscriptions:
            if s["user_id"] == user_id and s["category"] == category:
                s["active"] = True
                self._save_subscriptions()
                return Subscription(**s)
        
        sub = Subscription(
            id=f"sub_{int(time.time())}_{user_id[:6]}",
            user_id=user_id,
            category=category,
            created_at=datetime.now().isoformat(),
            active=True
        )
        self.subscriptions.append(asdict(sub))
        self._save_subscriptions()
        return sub

    def unsubscribe(self, user_id: str, category: str) -> bool:
        for s in self.subscriptions:
            if s["user_id"] == user_id and s["category"] == category:
                s["active"] = False
                self._save_subscriptions()
                return True
        return False

    def get_user_subscriptions(self, user_id: str) -> List[str]:
        """获取用户订阅的分类列表"""
        return [s["category"] for s in self.subscriptions if s["user_id"] == user_id and s["active"]]

    def is_subscribed(self, user_id: str, category: str) -> bool:
        return category in self.get_user_subscriptions(user_id)

    # ─── Bundles ─────────────────────────────────────────────────

    def _load_bundles(self) -> List[dict]:
        data = _load_json(BUNDLES_FILE)
        if data is None:
            # 初始化默认捆绑包
            return [
                {
                    "id": "bundle_business_pack",
                    "name": "商务套装",
                    "description": "包含5个精选商务模板，原价750元，套餐价499元",
                    "template_ids": ["default", "modern", "business", "corporate", "report"],
                    "discount_percent": 33,
                    "created_at": datetime.now().isoformat(),
                    "active": True
                },
                {
                    "id": "bundle_creative_pack",
                    "name": "创意套装",
                    "description": "包含5个创意风格模板，创意人士首选",
                    "template_ids": ["creative", "modern", "design", "presentation", "marketing"],
                    "discount_percent": 30,
                    "created_at": datetime.now().isoformat(),
                    "active": True
                },
                {
                    "id": "bundle_tech_pack",
                    "name": "科技套装",
                    "description": "包含5个科技风格模板，适合技术分享和产品发布",
                    "template_ids": ["tech", "modern", "ai", "startup", "innovation"],
                    "discount_percent": 25,
                    "created_at": datetime.now().isoformat(),
                    "active": True
                }
            ]
        return data

    def _save_bundles(self):
        _save_json(BUNDLES_FILE, self.bundles)

    def _load_bundle_purchases(self) -> List[dict]:
        data = _load_json(BUNDLE_PURCHASES_FILE)
        return data or []

    def _save_bundle_purchases(self):
        _save_json(BUNDLE_PURCHASES_FILE, self.bundle_purchases)

    def get_bundles(self) -> List[dict]:
        return [b for b in self.bundles if b.get("active", True)]

    def get_bundle(self, bundle_id: str) -> Optional[dict]:
        for b in self.bundles:
            if b["id"] == bundle_id and b.get("active", True):
                return b
        return None

    def purchase_bundle(self, bundle_id: str, user_id: str) -> dict:
        """购买捆绑包"""
        bundle = self.get_bundle(bundle_id)
        if not bundle:
            raise ValueError(f"捆绑包 {bundle_id} 不存在")
        
        purchase = {
            "id": f"bp_{int(time.time())}_{user_id[:6]}",
            "bundle_id": bundle_id,
            "user_id": user_id,
            "purchased_at": datetime.now().isoformat(),
            "template_ids": bundle["template_ids"]
        }
        self.bundle_purchases.append(purchase)
        self._save_bundle_purchases()
        return purchase

    def get_user_bundle_purchases(self, user_id: str) -> List[dict]:
        return [p for p in self.bundle_purchases if p["user_id"] == user_id]


_marketplace_service: Optional[MarketplaceService] = None


def get_marketplace_service() -> MarketplaceService:
    global _marketplace_service
    if _marketplace_service is None:
        _marketplace_service = MarketplaceService()
    return _marketplace_service
