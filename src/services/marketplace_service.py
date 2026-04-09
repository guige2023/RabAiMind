"""
Template Marketplace Service
包含评分、点评、精选、订阅、捆绑等功能
"""
import json
import time
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

DATA_DIR = Path("data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

REVIEWS_FILE = DATA_DIR / "template_reviews.json"
FEATURED_FILE = DATA_DIR / "featured_templates.json"
SUBSCRIPTIONS_FILE = DATA_DIR / "template_subscriptions.json"
BUNDLES_FILE = DATA_DIR / "template_bundles.json"
BUNDLE_PURCHASES_FILE = DATA_DIR / "bundle_purchases.json"
RATINGS_FILE = DATA_DIR / "template_ratings_breakdown.json"
COLLECTIONS_FILE = DATA_DIR / "template_collections.json"


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
    template_ids: list[str]
    discount_percent: int  # e.g. 20 = 8折
    created_at: str
    active: bool = True


@dataclass
class BundlePurchase:
    id: str
    bundle_id: str
    user_id: str
    purchased_at: str


@dataclass
class RatingsBreakdownData:
    """R128: 评分细分数据"""
    template_id: str
    design_ratings: list[int]  # 各用户设计评分
    usability_ratings: list[int]  # 各用户易用性评分
    features_ratings: list[int]  # 各用户功能评分


@dataclass
class Collection:
    """R128: 精选合集"""
    id: str
    name: str
    description: str
    template_ids: list[str]
    cover_image: str
    tags: list[str]  # e.g. ["热门", "商务首选"]
    created_at: str
    active: bool = True


class MarketplaceService:
    """模板市场服务"""

    def __init__(self):
        self.reviews: dict[str, list[dict]] = self._load_reviews()
        self.featured_ids: list[str] = self._load_featured()
        self.subscriptions: list[dict] = self._load_subscriptions()
        self.bundles: list[dict] = self._load_bundles()
        self.bundle_purchases: list[dict] = self._load_bundle_purchases()

    # ─── Reviews ────────────────────────────────────────────────

    def _load_reviews(self) -> dict[str, list[dict]]:
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

    def _load_featured(self) -> list[str]:
        data = _load_json(FEATURED_FILE)
        return data or []

    def _save_featured(self):
        _save_json(FEATURED_FILE, self.featured_ids)

    def get_featured_templates(self) -> list[str]:
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

    def _load_subscriptions(self) -> list[dict]:
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

    def get_user_subscriptions(self, user_id: str) -> list[str]:
        """获取用户订阅的分类列表"""
        return [s["category"] for s in self.subscriptions if s["user_id"] == user_id and s["active"]]

    def is_subscribed(self, user_id: str, category: str) -> bool:
        return category in self.get_user_subscriptions(user_id)

    # ─── Bundles ─────────────────────────────────────────────────

    def _load_bundles(self) -> list[dict]:
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

    def _load_bundle_purchases(self) -> list[dict]:
        data = _load_json(BUNDLE_PURCHASES_FILE)
        return data or []

    def _save_bundle_purchases(self):
        _save_json(BUNDLE_PURCHASES_FILE, self.bundle_purchases)

    def get_bundles(self) -> list[dict]:
        return [b for b in self.bundles if b.get("active", True)]

    def get_bundle(self, bundle_id: str) -> dict | None:
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

    def get_user_bundle_purchases(self, user_id: str) -> list[dict]:
        return [p for p in self.bundle_purchases if p["user_id"] == user_id]

    # ─── R128: Ratings Breakdown ─────────────────────────────────

    def _load_ratings(self) -> dict[str, dict]:
        data = _load_json(RATINGS_FILE)
        return data or {}

    def _save_ratings(self):
        _save_json(RATINGS_FILE, self.ratings_data)

    def get_ratings_breakdown(self, template_id: str) -> dict:
        """R128: 获取模板评分细分（设计/易用性/功能）"""
        if not hasattr(self, 'ratings_data'):
            self.ratings_data = self._load_ratings()

        data = self.ratings_data.get(template_id, {
            "design_ratings": [],
            "usability_ratings": [],
            "features_ratings": [],
        })

        def avg(lst):
            return round(sum(lst) / len(lst), 1) if lst else 0.0

        design_avg = avg(data.get("design_ratings", []))
        usability_avg = avg(data.get("usability_ratings", []))
        features_avg = avg(data.get("features_ratings", []))
        total_count = len(data.get("design_ratings", []))

        # 综合评分 = 三项平均
        all_ratings = data.get("design_ratings", []) + data.get("usability_ratings", []) + data.get("features_ratings", [])
        total_avg = avg(all_ratings) if all_ratings else 0.0

        return {
            "design": design_avg,
            "usability": usability_avg,
            "features": features_avg,
            "total": total_avg,
            "count": total_count,
        }

    def submit_ratings_breakdown(
        self,
        template_id: str,
        user_id: str,
        user_name: str,
        design: int,
        usability: int,
        features: int,
        content: str = ""
    ) -> dict:
        """R128: 提交评分细分"""
        if not hasattr(self, 'ratings_data'):
            self.ratings_data = self._load_ratings()

        # 限制评分范围
        design = min(5, max(1, design))
        usability = min(5, max(1, usability))
        features = min(5, max(1, features))

        if template_id not in self.ratings_data:
            self.ratings_data[template_id] = {
                "design_ratings": [],
                "usability_ratings": [],
                "features_ratings": [],
            }

        # 更新评分（同一用户只保留最新评分，先移除旧评分）
        data = self.ratings_data[template_id]

        # 这里简化处理：直接追加（生产环境应去重）
        data["design_ratings"].append(design)
        data["usability_ratings"].append(usability)
        data["features_ratings"].append(features)

        self._save_ratings()

        # 同时添加一条文字点评
        if content:
            self.add_review(template_id, user_id, user_name, int(round((design + usability + features) / 3)), content)

        return self.get_ratings_breakdown(template_id)

    # ─── R128: Collections ────────────────────────────────────────

    def _load_collections(self) -> list[dict]:
        data = _load_json(COLLECTIONS_FILE)
        if data is None:
            # 初始化默认精选合集
            return [
                {
                    "id": "col_business_essentials",
                    "name": "商务办公必备",
                    "description": "职场人必看的商务模板套装，涵盖年度总结、项目提案、会议议程等场景",
                    "template_ids": ["annual", "proposal", "meeting", "quarterly", "team_intro", "data_report"],
                    "cover_image": "",
                    "tags": ["热门", "商务首选", "职场必备"],
                    "created_at": datetime.now().isoformat(),
                    "active": True
                },
                {
                    "id": "col_creative_tools",
                    "name": "创意设计工具箱",
                    "description": "设计师和创意人士的首选套装，包含中国风、科技未来、创意展示等",
                    "template_ids": ["creative", "chinese", "ai_future", "wedding", "modern"],
                    "cover_image": "",
                    "tags": ["创意", "设计师", "艺术感"],
                    "created_at": datetime.now().isoformat(),
                    "active": True
                },
                {
                    "id": "col_tech_conference",
                    "name": "科技大会套装",
                    "description": "科技发布会、技术分享、AI演示的专业套装，适合科技公司",
                    "template_ids": ["product", "tech", "ai_future", "internet", "proposal"],
                    "cover_image": "",
                    "tags": ["科技", "发布会", "AI"],
                    "created_at": datetime.now().isoformat(),
                    "active": True
                },
                {
                    "id": "col_edu_training",
                    "name": "教育培训套装",
                    "description": "教师和培训师必备，包含培训课件、学术答辩等多种场景",
                    "template_ids": ["training", "academic", "education", "meeting", "proposal"],
                    "cover_image": "",
                    "tags": ["教育", "培训", "教师"],
                    "created_at": datetime.now().isoformat(),
                    "active": True
                },
                {
                    "id": "col_data_analysis",
                    "name": "数据分析套装",
                    "description": "数据分析师必备，含财务分析、数据报告、市场研究等专业模板",
                    "template_ids": ["data_report", "finance_report", "quarterly", "annual", "proposal"],
                    "cover_image": "",
                    "tags": ["数据", "分析", "BI"],
                    "created_at": datetime.now().isoformat(),
                    "active": True
                },
            ]
        return data

    def _save_collections(self):
        _save_json(COLLECTIONS_FILE, self.collections)

    def __init__(self):
        self.reviews: dict[str, list[dict]] = self._load_reviews()
        self.featured_ids: list[str] = self._load_featured()
        self.subscriptions: list[dict] = self._load_subscriptions()
        self.bundles: list[dict] = self._load_bundles()
        self.bundle_purchases: list[dict] = self._load_bundle_purchases()
        self.ratings_data: dict[str, dict] = self._load_ratings()
        self.collections: list[dict] = self._load_collections()

    def get_collections(self) -> list[dict]:
        """R128: 获取所有精选合集"""
        return [c for c in self.collections if c.get("active", True)]

    def get_collection(self, collection_id: str) -> dict | None:
        """R128: 获取单个精选合集"""
        for c in self.collections:
            if c["id"] == collection_id and c.get("active", True):
                return c
        return None


_marketplace_service: MarketplaceService | None = None


def get_marketplace_service() -> MarketplaceService:
    global _marketplace_service
    if _marketplace_service is None:
        _marketplace_service = MarketplaceService()
    return _marketplace_service
