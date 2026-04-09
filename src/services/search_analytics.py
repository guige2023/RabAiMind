"""
搜索分析服务
跟踪用户搜索、模板使用、推荐效果
"""
import json
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

ANALYTICS_DIR = Path("data")
SEARCHES_FILE = ANALYTICS_DIR / "search_analytics.json"
TEMPLATE_USAGE_FILE = ANALYTICS_DIR / "template_usage.json"
USER_HISTORY_FILE = ANALYTICS_DIR / "user_history.json"


def _load_json(path: Path) -> dict:
    if path.exists():
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            pass
    return {
        "searches": [],  # list of {"query": str, "timestamp": str, "results_count": int}
        "search_count": {},  # query -> count
        "clicked_templates": [],  # list of {"template_id": str, "timestamp": str, "query": str}
        "template_clicks": {},  # template_id -> click_count
    }


def _save_json(path: Path, data: dict):
    ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class SearchAnalytics:
    """搜索分析"""

    def __init__(self):
        self.data = _load_json(SEARCHES_FILE)

    def _persist(self):
        _save_json(SEARCHES_FILE, self.data)

    def track_search(self, query: str, results_count: int = 0):
        """记录一次搜索"""
        now = datetime.now().isoformat()
        # 添加到搜索历史
        self.data["searches"].append({
            "query": query.lower().strip(),
            "timestamp": now,
            "results_count": results_count,
        })
        # 保留最近1000条
        self.data["searches"] = self.data["searches"][-1000:]
        # 计数
        q = query.lower().strip()
        self.data["search_count"][q] = self.data["search_count"].get(q, 0) + 1
        self._persist()

    def track_template_click(self, template_id: str, query: str = ""):
        """记录模板点击/使用"""
        now = datetime.now().isoformat()
        self.data["clicked_templates"].append({
            "template_id": template_id,
            "timestamp": now,
            "query": query,
        })
        self.data["clicked_templates"] = self.data["clicked_templates"][-1000:]
        self.data["template_clicks"][template_id] = \
            self.data["template_clicks"].get(template_id, 0) + 1
        self._persist()

    def get_trending_queries(self, limit: int = 10, days: int = 7) -> list[dict[str, Any]]:
        """获取热门搜索词"""
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        # 统计最近 days 天的搜索
        recent = [s for s in self.data["searches"] if s["timestamp"] >= cutoff]
        counts = Counter(s["query"] for s in recent)
        return [
            {"query": q, "count": c}
            for q, c in counts.most_common(limit)
        ]

    def get_trending_templates(self, limit: int = 6, days: int = 7) -> list[dict[str, Any]]:
        """获取热门模板（按点击量）"""
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        recent = [t for t in self.data["clicked_templates"] if t["timestamp"] >= cutoff]
        counts = Counter(t["template_id"] for t in recent)
        # 也考虑历史总点击
        for tid, cnt in self.data["template_clicks"].items():
            counts[tid] = counts.get(tid, 0) + cnt * 0.3  # 历史权重0.3
        return [
            {"template_id": tid, "click_count": round(cnt)}
            for tid, cnt in counts.most_common(limit)
        ]

    def get_template_similarity(self, template_id: str, limit: int = 5) -> list[str]:
        """基于共现计算相似模板ID"""
        # 查找使用过该模板的用户同时还使用了哪些模板
        user_templates: dict[str, set] = {}
        for entry in self.data["clicked_templates"]:
            uid = entry["timestamp"].split("T")[0]  # 简化：按天分组
            if entry["template_id"] == template_id:
                continue
            if uid not in user_templates:
                user_templates[uid] = set()
            user_templates[uid].add(entry["template_id"])
        # 统计共现次数
        cooccur = Counter()
        for templates in user_templates.values():
            if template_id in templates:  # 该用户也点击过目标模板
                for t in templates:
                    if t != template_id:
                        cooccur[t] += 1
        return [t for t, _ in cooccur.most_common(5)]


class TemplateUsage:
    """模板使用追踪"""

    def __init__(self):
        self.data = _load_json(TEMPLATE_USAGE_FILE)

    def _persist(self):
        _save_json(TEMPLATE_USAGE_FILE, self.data)

    def track_usage(self, template_id: str, user_id: str = "anonymous",
                    scene: str = "", style: str = "", request_text: str = ""):
        """记录模板使用"""
        now = datetime.now().isoformat()
        entry = {
            "template_id": template_id,
            "user_id": user_id,
            "scene": scene,
            "style": style,
            "request_text": request_text[:200] if request_text else "",
            "timestamp": now,
        }
        self.data["usages"] = self.data.get("usages", [])
        self.data["usages"].append(entry)
        self.data["usages"] = self.data["usages"][-5000:]
        # 统计
        self.data["usage_count"] = self.data.get("usage_count", {})
        self.data["usage_count"][template_id] = \
            self.data["usage_count"].get(template_id, 0) + 1
        # 按场景统计
        if scene:
            self.data["scene_usage"] = self.data.get("scene_usage", {})
            if scene not in self.data["scene_usage"]:
                self.data["scene_usage"][scene] = {}
            self.data["scene_usage"][scene][template_id] = \
                self.data["scene_usage"][scene].get(template_id, 0) + 1
        # 按风格统计
        if style:
            self.data["style_usage"] = self.data.get("style_usage", {})
            if style not in self.data["style_usage"]:
                self.data["style_usage"][style] = {}
            self.data["style_usage"][style][template_id] = \
                self.data["style_usage"][style].get(template_id, 0) + 1
        self._persist()

    def get_most_used(self, limit: int = 6) -> list[dict[str, Any]]:
        counts = self.data.get("usage_count", {})
        return [
            {"template_id": tid, "usage_count": cnt}
            for tid, cnt in sorted(counts.items(), key=lambda x: -x[1])[:limit]
        ]

    def get_for_scene(self, scene: str, limit: int = 4) -> list[str]:
        scene_data = self.data.get("scene_usage", {}).get(scene, {})
        return [tid for tid, _ in sorted(scene_data.items(), key=lambda x: -x[1])[:limit]]

    def get_for_style(self, style: str, limit: int = 4) -> list[str]:
        style_data = self.data.get("style_usage", {}).get(style, {})
        return [tid for tid, _ in sorted(style_data.items(), key=lambda x: -x[1])[:limit]]


class UserHistory:
    """用户历史追踪"""

    def __init__(self):
        self.data = _load_json(USER_HISTORY_FILE)

    def _persist(self):
        _save_json(USER_HISTORY_FILE, self.data)

    def add_interaction(self, user_id: str, template_id: str,
                        interaction_type: str = "view"):
        """记录用户与模板的交互"""
        if user_id == "anonymous":
            return
        if user_id not in self.data:
            self.data[user_id] = {"interactions": [], "viewed": [], "used": []}
        entry = {
            "template_id": template_id,
            "type": interaction_type,  # view, click, use
            "timestamp": datetime.now().isoformat(),
        }
        self.data[user_id]["interactions"].append(entry)
        self.data[user_id]["interactions"] = self.data[user_id]["interactions"][-200:]
        if interaction_type == "use":
            if template_id not in self.data[user_id].get("used", []):
                self.data[user_id].setdefault("used", []).insert(0, template_id)
                self.data[user_id]["used"] = self.data[user_id]["used"][:50]
        if interaction_type == "view":
            if template_id not in self.data[user_id].get("viewed", []):
                self.data[user_id].setdefault("viewed", []).insert(0, template_id)
                self.data[user_id]["viewed"] = self.data[user_id]["viewed"][:100]
        self._persist()

    def get_recommendations(self, user_id: str, limit: int = 6) -> list[str]:
        """基于用户历史的推荐"""
        if user_id == "anonymous" or user_id not in self.data:
            return []
        user_data = self.data[user_id]
        # 基于使用过的模板推荐相似模板
        used = user_data.get("used", [])
        if not used:
            return []
        # 简单策略：推荐同场景/同风格的其他热门模板
        analytics = SearchAnalytics()
        similar_ids: list[str] = []
        for tid in used[:5]:
            similar_ids.extend(analytics.get_template_similarity(tid, limit=5))
        # 去重，保持顺序
        seen = set(used)
        result = used.copy()
        for sid in similar_ids:
            if sid not in seen:
                seen.add(sid)
                result.append(sid)
                if len(result) >= limit:
                    break
        return result[:limit]

    def get_viewed_recently(self, user_id: str, limit: int = 10) -> list[str]:
        if user_id == "anonymous" or user_id not in self.data:
            return []
        return self.data[user_id].get("viewed", [])[:limit]

    def record_layout_preference(
        self,
        user_id: str,
        template_id: str = "",
        layout_type: str = "",
        content_type: str = "",
        scene: str = "",
        style: str = "",
        action: str = "apply",
    ):
        """记录用户对布局的偏好（模板学习）"""
        if user_id == "anonymous":
            return
        if user_id not in self.data:
            self.data[user_id] = {"interactions": [], "viewed": [], "used": [], "layout_preferences": []}
        self.data[user_id].setdefault("layout_preferences", [])

        entry = {
            "template_id": template_id,
            "layout_type": layout_type,
            "content_type": content_type,
            "scene": scene,
            "style": style,
            "action": action,  # apply, dismiss, regenerate
            "timestamp": datetime.now().isoformat(),
        }
        self.data[user_id]["layout_preferences"].append(entry)
        # 只保留最近200条
        self.data[user_id]["layout_preferences"] = self.data[user_id]["layout_preferences"][-200:]
        self._persist()

    def get_layout_preferences(
        self,
        user_id: str,
        content_type: str = "",
        limit: int = 3,
    ) -> list[dict[str, Any]]:
        """获取用户对特定内容类型的布局偏好"""
        if user_id == "anonymous" or user_id not in self.data:
            return []

        prefs = self.data[user_id].get("layout_preferences", [])

        # 筛选有效记录（action=apply）
        applied = [p for p in prefs if p.get("action") == "apply"]

        if not applied:
            return []

        # 如果指定了内容类型，优先返回该类型的偏好
        if content_type:
            type_prefs = [p for p in applied if p.get("content_type") == content_type]
            if type_prefs:
                # 统计最常用的布局
                layout_counts: dict[str, int] = {}
                for p in type_prefs:
                    lt = p.get("layout_type", "")
                    layout_counts[lt] = layout_counts.get(lt, 0) + 1
                sorted_layouts = sorted(layout_counts.items(), key=lambda x: -x[1])
                return [
                    {"layout_type": lt, "count": cnt, "content_type": content_type}
                    for lt, cnt in sorted_layouts[:limit]
                ]

        # 通用统计
        layout_counts: dict[str, int] = {}
        for p in applied:
            lt = p.get("layout_type", "")
            layout_counts[lt] = layout_counts.get(lt, 0) + 1
        sorted_layouts = sorted(layout_counts.items(), key=lambda x: -x[1])
        return [
            {"layout_type": lt, "count": cnt}
            for lt, cnt in sorted_layouts[:limit]
        ]


# 全局实例
_analytics = SearchAnalytics()
_template_usage = TemplateUsage()
_user_history = UserHistory()


def get_analytics() -> SearchAnalytics:
    return _analytics


def get_template_usage() -> TemplateUsage:
    return _template_usage


def get_user_history() -> UserHistory:
    return _user_history
