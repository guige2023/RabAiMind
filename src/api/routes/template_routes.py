# -*- coding: utf-8 -*-
"""
Template, layout, theme, and slide annotation related API routes.

Handles template management, layout suggestions, theme recommendations,
slide notes, sticky notes, and notes templates.
"""

from fastapi import APIRouter, HTTPException, Request, Query, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import logging

from ._base_routes import (
    _check_rate_limit_middleware,
    create_router,
)

logger = logging.getLogger(__name__)

router = create_router(prefix="/api/v1/ppt", tags=["ppt-template"])


# ==================== Search Analytics Helper ====================

def _record_search(query: str, results_count: int, filters: Optional[Dict[str, Any]] = None) -> None:
    """Record a search for analytics."""
    from pathlib import Path
    import json
    import os

    analytics_file = Path("data/search_analytics.json")
    data = {"searches": [], "search_count": {}, "clicked_templates": [], "template_clicks": {}}

    if analytics_file.exists():
        try:
            with open(analytics_file, encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    # Ensure structure
    if "searches" not in data:
        data["searches"] = []
    if "search_count" not in data:
        data["search_count"] = {}
    if "template_clicks" not in data:
        data["template_clicks"] = {}

    # Record search
    data["searches"].append({
        "query": query,
        "timestamp": datetime.now().isoformat(),
        "results_count": results_count,
        "filters": filters or {}
    })

    # Update count
    if query:
        data["search_count"][query] = data["search_count"].get(query, 0) + 1

    # Keep only last 10000 searches to avoid file bloat
    if len(data["searches"]) > 10000:
        data["searches"] = data["searches"][-10000:]

    try:
        os.makedirs(os.path.dirname(analytics_file), exist_ok=True)
        with open(analytics_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except IOError as e:
        logger.warning(f"Failed to record search analytics: {e}")


def _record_template_click(template_id: str) -> None:
    """Record a template click for analytics."""
    from pathlib import Path
    import json
    import os

    analytics_file = Path("data/search_analytics.json")
    data = {"searches": [], "search_count": {}, "clicked_templates": [], "template_clicks": {}}

    if analytics_file.exists():
        try:
            with open(analytics_file, encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    if "template_clicks" not in data:
        data["template_clicks"] = {}

    data["template_clicks"][template_id] = data["template_clicks"].get(template_id, 0) + 1

    try:
        os.makedirs(os.path.dirname(analytics_file), exist_ok=True)
        with open(analytics_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except IOError as e:
        logger.warning(f"Failed to record template click: {e}")


# ==================== Template Management ====================

@router.get("/templates")
async def get_templates():
    """
    获取模板列表

    从TemplateManager获取所有可用模板列表。

    Returns:
        模板列表（id, name, description, category, style, thumbnail, colors, fonts）
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    templates = manager.list_templates()
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "style": t.style,
            "thumbnail": t.thumbnail,
            "colors": t.colors,
            "fonts": t.fonts,
        }
        for t in templates
    ]


@router.post("/templates")
async def create_template(request: dict):
    """
    创建并保存用户模板

    将用户创建的PPT模板保存到个人模板库。

    Args:
        request: 模板数据字典（name, description, scene, style等）

    Returns:
        success: 是否成功
        template_id: 模板ID
        template: 模板详情
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()

    # 生成模板ID
    template_id = f"user_{uuid.uuid4().hex[:12]}"

    # 构建模板数据
    template_data = {
        "id": template_id,
        "name": request.get("name", "未命名模板"),
        "description": request.get("description", ""),
        "category": request.get("scene", "business"),
        "style": request.get("style", "professional"),
        "thumbnail": request.get("thumbnail", ""),
        "colors": request.get("colors", ["#165DFF", "#FFFFFF"]),
        "fonts": request.get("fonts", ["思源黑体", "Arial"]),
        "is_ugc": True,
        "author": "current_user",
        "visibility": request.get("visibility", "private"),
        "created_at": datetime.now().isoformat(),
        "layout": request.get("layout", {}),
        "applicable_scenes": request.get("applicable_scenes", []),
        "example": request.get("description", ""),
    }

    manager.add_user_template(template_data)

    return {"success": True, "template_id": template_id, "template": template_data}


@router.get("/templates/my")
async def get_my_templates():
    """
    获取当前用户的模板列表

    返回当前用户创建的所有私人模板。

    Returns:
        success: 是否成功
        templates: 用户模板列表
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    templates = manager.get_user_templates("current_user")
    return {
        "success": True,
        "templates": templates
    }


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """
    删除用户模板

    删除指定ID的用户私人模板。

    Args:
        template_id: 要删除的模板ID

    Returns:
        success: 是否成功
    """
    """删除用户模板"""
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()

    # 检查是否是用户模板
    user_templates = manager.get_user_templates("current_user")
    if not any(t.get("id") == template_id for t in user_templates):
        return {"success": False, "error": "模板不存在或无权删除"}

    manager.remove_user_template(template_id)
    return {"success": True}


@router.patch("/templates/{template_id}")
async def update_template(template_id: str, request: dict):
    """
    更新/重命名用户模板

    更新指定ID的模板名称或其他属性。

    Args:
        template_id: 模板ID
        request: 更新数据

    Returns:
        success: 是否成功
        error: 错误信息（如有）
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()

    # 检查是否是用户模板
    user_templates = manager.get_user_templates("current_user")
    if not any(t.get("id") == template_id for t in user_templates):
        return {"success": False, "error": "模板不存在或无权修改"}

    # 更新用户模板
    for i, t in enumerate(manager.user_templates):
        if t.get("id") == template_id:
            if "name" in request:
                manager.user_templates[i]["name"] = request["name"]
            if "description" in request:
                manager.user_templates[i]["description"] = request["description"]
            manager._save_user_templates()
            return {"success": True, "template": manager.user_templates[i]}

    return {"success": False, "error": "模板不存在"}


# ==================== Template Tags ====================

class TagSearchRequest(BaseModel):
    """标签搜索请求"""
    query: str = Field(default="", max_length=200, description="搜索关键词")
    category: Optional[str] = Field(default=None, max_length=50, description="分类过滤")
    style: Optional[str] = Field(default=None, max_length=50, description="风格过滤")
    tags: Optional[List[str]] = Field(default_factory=list, description="标签列表（AND过滤）")
    limit: int = Field(default=20, ge=1, le=100, description="返回数量")


@router.get("/templates/tags")
async def get_all_template_tags():
    """
    获取所有模板标签

    返回系统中的所有可用标签及其使用次数统计。

    Returns:
        所有标签列表及统计信息
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    tags = manager.get_all_tags()
    # Built-in popular tags with metadata
    POPULAR_TAGS = [
        {"name": "免费", "icon": "🆓", "color": "#34C759"},
        {"name": "热门", "icon": "🔥", "color": "#FF9500"},
        {"name": "新品", "icon": "✨", "color": "#AF52DE"},
        {"name": "推荐", "icon": "⭐", "color": "#FFD60A"},
        {"name": "商务", "icon": "💼", "color": "#165DFF"},
        {"name": "简约", "icon": "📐", "color": "#8E8E93"},
        {"name": "创意", "icon": "🎨", "color": "#FF2D55"},
        {"name": "科技", "icon": "🚀", "color": "#00C7BE"},
        {"name": "教育", "icon": "📚", "color": "#5AC8FA"},
        {"name": "中国风", "icon": "🏮", "color": "#FF3B30"},
    ]
    all_tags = []
    for tag_name in tags:
        # Find matching popular tag or create generic entry
        known = next((t for t in POPULAR_TAGS if t["name"] == tag_name), None)
        all_tags.append({
            "name": tag_name,
            "icon": known["icon"] if known else "🏷️",
            "color": known["color"] if known else "#8E8E93",
            "count": 1
        })
    return {"success": True, "tags": all_tags}


@router.post("/templates/search-with-tags")
async def search_templates_with_tags(req: TagSearchRequest):
    """搜索模板（支持标签过滤）"""
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    templates = manager.search_templates(
        query=req.query,
        category=req.category,
        style=req.style,
        tags=req.tags,
        limit=req.limit
    )
    # Record search analytics
    _record_search(req.query, len(templates), {
        "category": req.category,
        "style": req.style,
        "tags": req.tags
    })
    return {
        "success": True,
        "total": len(templates),
        "templates": [t.to_dict() for t in templates]
    }


@router.post("/templates/{template_id}/tags")
async def add_template_tags(template_id: str, request: dict):
    """为模板添加标签（仅限用户模板）"""
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    tags_to_add = request.get("tags", [])
    # Check user template
    for i, t in enumerate(manager.user_templates):
        if t.get("id") == template_id:
            existing = set(t.get("tags", []))
            existing.update(tags_to_add)
            manager.user_templates[i]["tags"] = list(existing)
            manager._save_user_templates()
            return {"success": True, "tags": list(existing)}
    raise HTTPException(status_code=404, detail="模板不存在或无权修改")


@router.delete("/templates/{template_id}/tags")
async def remove_template_tags(template_id: str, request: dict):
    """从模板移除标签（仅限用户模板）"""
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    tags_to_remove = set(request.get("tags", []))
    for i, t in enumerate(manager.user_templates):
        if t.get("id") == template_id:
            existing = set(t.get("tags", []))
            existing -= tags_to_remove
            manager.user_templates[i]["tags"] = list(existing)
            manager._save_user_templates()
            return {"success": True, "tags": list(existing)}
    raise HTTPException(status_code=404, detail="模板不存在或无权修改")


# ==================== Advanced Template Search ====================

class AdvancedSearchRequest(BaseModel):
    """高级搜索请求"""
    query: Optional[str] = Field(default="", max_length=200, description="搜索关键词")
    category: Optional[str] = Field(default=None, max_length=50, description="分类过滤")
    style: Optional[str] = Field(default=None, max_length=50, description="风格过滤")
    author: Optional[str] = Field(default=None, max_length=100, description="作者过滤")
    tags: Optional[List[str]] = Field(default_factory=list, description="标签列表（AND过滤）")
    date_from: Optional[str] = Field(default=None, description="开始日期 YYYY-MM-DD")
    date_to: Optional[str] = Field(default=None, description="结束日期 YYYY-MM-DD")
    template_type: Optional[str] = Field(default="all", description="模板类型: all/ugc/system")
    sort_by: Optional[str] = Field(default="relevance", description="排序: relevance/newest/popularity/name")
    page: int = Field(default=1, ge=1, le=100, description="页码")
    limit: int = Field(default=20, ge=1, le=100, description="每页数量")
    use_semantic: bool = Field(default=False, description="是否使用AI语义搜索")


@router.post("/templates/advanced-search")
async def advanced_template_search(req: AdvancedSearchRequest):
    """高级模板搜索 - 支持多条件过滤和AI语义搜索"""
    from ...services.template_manager import get_template_manager
    from datetime import datetime

    manager = get_template_manager()

    # Get all templates and filter manually (since built-in templates don't have all fields)
    all_templates = list(manager._templates.values())

    # Apply filters
    result = all_templates

    if req.query:
        query_lower = req.query.lower()
        result = [
            t for t in result
            if query_lower in t.name.lower() or query_lower in t.description.lower()
        ]

    if req.category:
        result = [t for t in result if t.category == req.category]

    if req.style:
        result = [t for t in result if t.style == req.style]

    if req.author:
        author_lower = req.author.lower()
        result = [t for t in result if author_lower in t.author.lower()]

    if req.tags:
        result = [t for t in result if all(tag in t.tags for tag in req.tags)]

    if req.template_type == "ugc":
        result = [t for t in result if t.is_ugc]
    elif req.template_type == "system":
        result = [t for t in result if not t.is_ugc]

    # Date filtering
    if req.date_from:
        try:
            date_from = datetime.fromisoformat(req.date_from)
            result = [t for t in result if t.created_at and datetime.fromisoformat(t.created_at) >= date_from]
        except ValueError:
            pass

    if req.date_to:
        try:
            date_to = datetime.fromisoformat(req.date_to)
            result = [t for t in result if t.created_at and datetime.fromisoformat(t.created_at) <= date_to]
        except ValueError:
            pass

    # Sorting
    if req.sort_by == "newest":
        result.sort(key=lambda t: t.created_at or "", reverse=True)
    elif req.sort_by == "popularity":
        result.sort(key=lambda t: t.download_count, reverse=True)
    elif req.sort_by == "name":
        result.sort(key=lambda t: t.name)
    # relevance: keep default order (by search score)

    # Pagination
    total = len(result)
    total_pages = (total + req.limit - 1) // req.limit
    start = (req.page - 1) * req.limit
    end = start + req.limit
    paginated = result[start:end]

    # Record search analytics
    _record_search(req.query, total, {
        "category": req.category,
        "style": req.style,
        "tags": req.tags,
        "author": req.author,
        "search_type": "advanced"
    })

    return {
        "success": True,
        "results": [t.to_dict() for t in paginated],
        "total": total,
        "page": req.page,
        "total_pages": total_pages,
        "query": req.query,
        "applied_filters": {
            "category": req.category,
            "style": req.style,
            "tags": req.tags,
            "author": req.author,
        }
    }


# ==================== AI Semantic Search ====================

@router.post("/templates/semantic-search")
async def semantic_template_search(req: AdvancedSearchRequest):
    """AI语义搜索模板 - 使用火山引擎大模型理解用户意图"""
    from ...services.template_manager import get_template_manager

    manager = get_template_manager()

    # If query is provided, use AI to enhance the search
    if req.query:
        # Use the same search logic but with AI-enhanced scoring
        # For now, fall back to keyword search (AI enhancement can be added later)
        all_templates = list(manager._templates.values())
        query_lower = req.query.lower()
        result = [
            t for t in all_templates
            if query_lower in t.name.lower() or query_lower in t.description.lower()
        ]
        if req.category:
            result = [t for t in result if t.category == req.category]
        if req.style:
            result = [t for t in result if t.style == req.style]
        if req.tags:
            result = [t for t in result if all(tag in t.tags for tag in req.tags)]
    else:
        # No query, return all templates
        result = list(manager._templates.values())[:req.limit]

    # Record search analytics
    _record_search(req.query, len(result), {
        "category": req.category,
        "style": req.style,
        "tags": req.tags,
        "search_type": "semantic"
    })

    return {
        "success": True,
        "query": req.query,
        "total": len(result),
        "results": [t.to_dict() for t in result[:req.limit]],
        "search_type": "semantic",
    }


# ==================== Template Click Tracking ====================

@router.post("/templates/{template_id}/click")
async def record_template_click(template_id: str):
    """Record a template click for analytics"""
    _record_template_click(template_id)
    return {"success": True}


# ==================== Search Analytics ====================

@router.get("/templates/search-analytics/dashboard")
async def get_search_analytics_dashboard(days: int = Query(default=30, ge=1, le=365)):
    """搜索分析仪表盘 - 返回热门搜索词、搜索趋势等"""
    from pathlib import Path
    import json
    from datetime import datetime, timedelta
    from collections import Counter

    analytics_file = Path("data/search_analytics.json")
    trending_queries = []
    search_volume_over_time = []
    no_result_queries = []
    total_searches = 0
    unique_queries = 0
    top_clicked_templates = []

    if analytics_file.exists():
        try:
            with open(analytics_file, encoding="utf-8") as f:
                data = json.load(f)

            # Get searches from the last N days
            cutoff_date = datetime.now() - timedelta(days=days)
            recent_searches = [
                s for s in data.get("searches", [])
                if datetime.fromisoformat(s.get("timestamp", "2000-01-01")) >= cutoff_date
            ]

            # Compute trending queries (most searched)
            search_counts = Counter(s.get("query", "") for s in recent_searches if s.get("query"))
            trending_queries = [
                {"query": q, "count": c}
                for q, c in search_counts.most_common(10)
            ]

            # Compute search volume over time (group by date)
            date_counts = Counter()
            for s in recent_searches:
                dt = datetime.fromisoformat(s.get("timestamp", "2000-01-01"))
                date_str = dt.strftime("%Y-%m-%d")
                date_counts[date_str] += 1
            search_volume_over_time = [
                {"date": d, "count": c}
                for d, c in sorted(date_counts.items())
            ]

            # Compute no-result queries
            no_result_searches = [s for s in recent_searches if s.get("results_count", 1) == 0]
            no_result_counts = Counter(s.get("query", "") for s in no_result_searches)
            no_result_queries = [
                {"query": q, "count": c}
                for q, c in no_result_counts.most_common(10)
            ]

            total_searches = len(recent_searches)
            unique_queries = len(search_counts)

            # Get top clicked templates
            template_clicks = data.get("template_clicks", {})
            top_clicked = sorted(
                template_clicks.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            top_clicked_templates = [
                {"id": tid, "click_count": c}
                for tid, c in top_clicked
            ]

        except (json.JSONDecodeError, IOError, ValueError) as e:
            logger.warning(f"Failed to parse search analytics: {e}")

    return {
        "success": True,
        "period_days": days,
        "trending_queries": trending_queries,
        "search_volume_over_time": search_volume_over_time,
        "no_result_queries": no_result_queries,
        "top_clicked_templates": top_clicked_templates,
        "popular_filter_combinations": [],
        "total_searches": total_searches,
        "unique_queries": unique_queries,
    }


# ==================== PPT Content Search ====================

class PPTSearchResult(BaseModel):
    task_id: str
    title: str
    slide_num: int
    matched_text: str
    context: str  # 前后文


class PPTSearchResponse(BaseModel):
    success: bool
    query: str
    total: int
    results: List[PPTSearchResult]


@router.post("/search", response_model=PPTSearchResponse)
async def search_ppt_content(
    http_request: Request,
    query: str = Body(..., embed=True),
    limit: int = Body(20, embed=True)
):
    """
    搜索 PPT 内容（在所有历史任务的幻灯片文本中搜索）

    Args:
        query: 搜索关键词
        limit: 最大返回结果数
    """
    from ...services.task_manager import get_task_manager

    if not query or len(query.strip()) < 2:
        return PPTSearchResponse(success=False, query=query, total=0, results=[])

    manager = get_task_manager()
    all_tasks = manager.get_history()

    results: List[PPTSearchResult] = []
    query_lower = query.lower().strip()

    for task_id, task in all_tasks.items():
        # 只搜索已完成的任务
        if task.get("status") != "completed":
            continue

        # 获取大纲中的幻灯片内容
        outline = task.get("outline")
        if not outline:
            continue

        slides = outline.get("slides", [])

        # 也检查 slides_summary
        if not slides:
            slides = task.get("result", {}).get("slides_summary", [])

        for idx, slide in enumerate(slides):
            title = slide.get("title", "") or ""
            content = slide.get("content", "") or ""
            combined = f"{title} {content}".lower()

            if query_lower in combined:
                # 提取匹配上下文
                idx_in_content = combined.find(query_lower)
                start = max(0, idx_in_content - 20)
                end = min(len(combined), idx_in_content + len(query) + 20)
                context = combined[start:end].strip()

                # 获取任务标题
                task_title = task.get("title", "") or task.get("request", "未命名PPT")[:50]

                results.append(PPTSearchResult(
                    task_id=task_id,
                    title=task_title,
                    slide_num=idx + 1,
                    matched_text=query,
                    context=f"...{context}..."
                ))

                if len(results) >= limit:
                    break

        if len(results) >= limit:
            break

    return PPTSearchResponse(
        success=True,
        query=query,
        total=len(results),
        results=results
    )


# ==================== Scenes and Styles ====================

@router.get("/scenes")
async def get_scenes():
    """
    获取所有适用场景

    返回系统支持的所有PPT适用场景类型。

    Returns:
        场景列表
    """
    """获取场景类型"""
    return [
        {"id": "business", "name": "商务", "description": "商业演示"},
        {"id": "education", "name": "教育", "description": "教学课件"},
        {"id": "tech", "name": "科技", "description": "技术分享"},
        {"id": "creative", "name": "创意", "description": "创意展示"},
        {"id": "marketing", "name": "营销", "description": "市场营销推广"},
        {"id": "finance", "name": "金融", "description": "金融财务报告"},
        {"id": "medical", "name": "医疗", "description": "医疗健康领域"},
        {"id": "government", "name": "政府", "description": "政府公文演示"}
    ]


@router.get("/styles")
async def get_styles():
    """
    获取所有风格类型

    返回系统支持的所有PPT风格类型。

    Returns:
        风格列表
    """
    """获取风格类型"""
    return [
        {"id": "professional", "name": "专业", "description": "商务专业风格"},
        {"id": "simple", "name": "简约", "description": "简洁大方风格"},
        {"id": "energetic", "name": "活力", "description": "充满活力风格"},
        {"id": "premium", "name": "高端", "description": "高端大气风格"},
        {"id": "creative", "name": "创意", "description": "创意无限风格"},
        {"id": "fresh", "name": "清新", "description": "小清新风格"},
        {"id": "tech", "name": "科技", "description": "科技感风格"},
        {"id": "elegant", "name": "优雅", "description": "优雅精致风格"},
        {"id": "playful", "name": "活泼", "description": "活泼可爱风格"},
        {"id": "minimalist", "name": "极简", "description": "极简主义风格"}
    ]


# ==================== Layout Suggestions ====================

@router.get("/layouts/suggest")
async def suggest_layouts(
    title: str = "",
    content: str = "",
):
    """
    智能布局推荐：根据幻灯片内容分析，推荐最佳布局

    分析内容类型（列表/对比/时间线/数据/金句等），返回多个布局建议
    """
    from ...services.smart_layout.content_analyzer import get_content_analyzer
    from ...services.smart_layout.layout_strategy import get_layout_strategy

    analyzer = get_content_analyzer()
    strategy = get_layout_strategy()

    # 分析内容
    analysis = analyzer.analyze(title, content)

    # 获取推荐布局
    primary_layout = strategy.select_layout({
        "type": analysis.type,
        "density": analysis.density,
        "element_count": analysis.element_count,
        "has_timeline": analysis.has_timeline,
        "has_comparison": analysis.has_comparison,
        "keywords": analysis.keywords,
    })

    # 获取备选布局
    suggestions = strategy.suggest_layouts_for_content({
        "type": analysis.type,
        "density": analysis.density,
        "element_count": analysis.element_count,
        "has_timeline": analysis.has_timeline,
        "has_comparison": analysis.has_comparison,
        "keywords": analysis.keywords,
    })

    # 构建布局详情
    layout_details = []
    all_layouts = strategy.get_all_layouts()
    for i, layout_type in enumerate(suggestions):
        layout_info = all_layouts.get(layout_type, all_layouts["content_card"])
        layout_details.append({
            "type": layout_type,
            "name": layout_info["name"],
            "description": layout_info["description"],
            "confidence": 1.0 - i * 0.2,  # 递减置信度
            "is_primary": i == 0,
        })

    return {
        "success": True,
        "content_type": analysis.type,
        "content_type_display": {
            "title_slide": "封面页",
            "content": "内容页",
            "quote": "金句页",
            "timeline": "时间线",
            "comparison": "对比页",
            "data": "数据页",
        }.get(analysis.type, "内容页"),
        "density": analysis.density,
        "element_count": analysis.element_count,
        "has_timeline": analysis.has_timeline,
        "has_comparison": analysis.has_comparison,
        "keywords": analysis.keywords,
        "primary_layout": primary_layout,
        "suggestions": layout_details,
    }


@router.get("/layouts/all")
async def get_all_layouts():
    """获取所有可用布局"""
    from ...services.smart_layout.layout_strategy import get_layout_strategy
    strategy = get_layout_strategy()
    all_layouts = strategy.get_all_layouts()

    layout_list = []
    for layout_type, info in all_layouts.items():
        layout_list.append({
            "type": layout_type,
            "name": info["name"],
            "description": info["description"],
            "typical_use": info.get("typical_use", []),
            "elements": info.get("elements", []),
        })

    return {"success": True, "layouts": layout_list}


# ==================== Layout Preference Tracking ====================

@router.post("/templates/preferences")
async def save_layout_preference(
    user_id: str = "anonymous",
    template_id: str = "",
    layout_type: str = "",
    content_type: str = "",
    scene: str = "",
    style: str = "",
    action: str = "apply",  # apply | dismiss | regenerate
):
    """
    记录用户的布局偏好（模板学习）

    当用户应用、忽略或重新生成布局时记录，帮助系统学习用户偏好
    """
    from ...services.search_analytics import get_user_history

    history = get_user_history()

    # 记录布局偏好
    history.record_layout_preference(
        user_id=user_id,
        template_id=template_id,
        layout_type=layout_type,
        content_type=content_type,
        scene=scene,
        style=style,
        action=action,
    )

    return {"success": True, "action": action}


@router.get("/templates/preferences")
async def get_layout_preferences(
    user_id: str = "anonymous",
    content_type: str = "",
    limit: int = 3,
):
    """
    获取用户的布局偏好（基于学习历史）
    """
    from ...services.search_analytics import get_user_history

    history = get_user_history()
    preferences = history.get_layout_preferences(
        user_id=user_id,
        content_type=content_type,
        limit=limit,
    )

    return {"success": True, "preferences": preferences, "user_id": user_id}


# ==================== Theme Suggestion ====================

@router.get("/theme/suggest")
async def suggest_theme(
    content: str = "",
    title: str = "",
    scene: str = "",
    style: str = "",
):
    """
    智能主题推荐：根据内容上下文自动推荐最佳主题配色

    分析内容类型、行业领域和情感基调，返回推荐的主题配色方案
    """
    from ...services.smart_layout.content_analyzer import get_content_analyzer
    from ...services.smart_layout.color_scheme import get_color_scheme_generator

    # 分析内容类型
    analyzer = get_content_analyzer()
    analysis = analyzer.analyze(title or "", content or "")

    # 行业/场景关键词映射到主题
    SCENE_THEME_MAP = {
        "科技": {"primary": "#165DFF", "secondary": "#0E42D2", "accent": "#64D2FF", "style": "tech"},
        "商务": {"primary": "#165DFF", "secondary": "#364FC7", "accent": "#FF7D00", "style": "professional"},
        "金融": {"primary": "#1A1A2E", "secondary": "#165DFF", "accent": "#C6A87C", "style": "premium"},
        "教育": {"primary": "#34C759", "secondary": "#248A3D", "accent": "#FF9500", "style": "nature"},
        "医疗": {"primary": "#00B96B", "secondary": "#00875A", "accent": "#64D2FF", "style": "simple"},
        "创意": {"primary": "#722ED1", "secondary": "#EB2F96", "accent": "#13C2C2", "style": "creative"},
        "时尚": {"primary": "#FF2D55", "secondary": "#C41E3A", "accent": "#FFD60A", "style": "elegant"},
        "餐饮": {"primary": "#FF9500", "secondary": "#CC7A00", "accent": "#FF3B30", "style": "energetic"},
        "旅游": {"primary": "#007AFF", "secondary": "#0055CC", "accent": "#5AC8FA", "style": "nature"},
        "地产": {"primary": "#C6A87C", "secondary": "#8B7355", "accent": "#D4AF37", "style": "premium"},
        "互联网": {"primary": "#165DFF", "secondary": "#00B96B", "accent": "#FF7D00", "style": "tech"},
        "人工智能": {"primary": "#5856D6", "secondary": "#3634A3", "accent": "#BF5AF2", "style": "tech"},
        "创业": {"primary": "#FF9500", "secondary": "#FF3B30", "accent": "#FFD60A", "style": "energetic"},
        "企业": {"primary": "#165DFF", "secondary": "#364FC7", "accent": "#00B96B", "style": "professional"},
        "政府": {"primary": "#165DFF", "secondary": "#1A1A2E", "accent": "#FF3B30", "style": "professional"},
        "公益": {"primary": "#34C759", "secondary": "#30D158", "accent": "#FFD60A", "style": "nature"},
    }

    # 内容类型关键词
    CONTENT_THEME_MAP = {
        "title_slide": {"primary": "#165DFF", "secondary": "#0E42D2", "accent": "#C6A87C", "style": "premium"},
        "quote": {"primary": "#AF52DE", "secondary": "#5E5CE6", "accent": "#BF5AF2", "style": "elegant"},
        "timeline": {"primary": "#5856D6", "secondary": "#3634A3", "accent": "#FF9500", "style": "tech"},
        "comparison": {"primary": "#165DFF", "secondary": "#00B96B", "accent": "#FF9500", "style": "professional"},
        "data": {"primary": "#165DFF", "secondary": "#364FC7", "accent": "#34C759", "style": "professional"},
        "content": {"primary": "#165DFF", "secondary": "#FFFFFF", "accent": "#FF7D00", "style": "professional"},
    }

    # 基于场景匹配主题
    matched_theme = None
    if scene:
        scene_keywords = {
            "科技": ["科技", "技术", "AI", "智能", "代码", "软件", "系统"],
            "商务": ["商务", "企业", "公司", "商业", "汇报", "会议"],
            "金融": ["金融", "银行", "投资", "财务", "基金", "股票"],
            "教育": ["教育", "培训", "学校", "课程", "教学", "学习"],
            "医疗": ["医疗", "健康", "医院", "医药", "生物"],
            "创意": ["创意", "设计", "艺术", "品牌", "策划"],
            "时尚": ["时尚", "服装", "美容", "生活"],
            "餐饮": ["餐饮", "美食", "餐厅", "食品"],
            "旅游": ["旅游", "旅行", "酒店", "度假"],
            "地产": ["地产", "房产", "建筑", "装修"],
        }
        for theme_name, keywords in scene_keywords.items():
            if any(kw in content for kw in keywords):
                matched_theme = SCENE_THEME_MAP.get(theme_name)
                break

    # 基于内容类型兜底
    if not matched_theme:
        matched_theme = CONTENT_THEME_MAP.get(
            analysis.type,
            CONTENT_THEME_MAP["content"]
        )

    # 用户指定风格优先
    if style and style != "auto":
        color_gen = get_color_scheme_generator()
        palette = color_gen.get_palette(style)
        matched_theme = {
            "primary": palette.primary,
            "secondary": palette.secondary,
            "accent": palette.accent,
            "style": style,
        }

    # 构建推荐理由
    reasons = []
    if analysis.type != "content":
        reasons.append(f"内容类型「{analysis.type}」适合此配色")
    if scene:
        reasons.append(f"场景「{scene}」推荐此配色")
    if analysis.keywords:
        reasons.append(f"关键词：{', '.join(analysis.keywords[:3])}")

    return {
        "success": True,
        "theme": {
            "primary": matched_theme["primary"],
            "secondary": matched_theme["secondary"],
            "accent": matched_theme["accent"],
            "style": matched_theme["style"],
            "name": _get_theme_style_name_api(matched_theme["style"]),
        },
        "content_analysis": {
            "type": analysis.type,
            "keywords": analysis.keywords[:5],
            "density": analysis.density,
        },
        "reasons": reasons,
    }


def _get_theme_style_name_api(style: str) -> str:
    """获取主题风格的中文名称"""
    names = {
        "professional": "专业商务",
        "creative": "创意活力",
        "simple": "简约现代",
        "tech": "科技未来",
        "premium": "高端大气",
        "nature": "自然清新",
        "energetic": "活力动感",
        "elegant": "优雅知性",
    }
    return names.get(style, style)


# ==================== Slide Notes ====================

class SlideNotesUpdate(BaseModel):
    """幻灯片备注更新"""
    slide_index: int
    notes: Optional[str] = None
    rich_notes: Optional[str] = None
    speaker_notes: Optional[str] = None
    sticky_notes: Optional[List[Dict[str, Any]]] = None
    annotations: List[Dict[str, Any]] = []


class StickyNoteItem(BaseModel):
    """便签数据"""
    id: str = Field(..., description="便签ID")
    slide_index: int = Field(..., ge=0, description="幻灯片索引")
    content: str = Field(..., max_length=1000, description="便签内容")
    author: str = Field(default="anonymous", max_length=100, description="作者")
    color: str = Field(default="#FFE066", description="便签颜色")
    position_x: float = Field(default=0, description="X坐标")
    position_y: float = Field(default=0, description="Y坐标")
    created_at: Optional[str] = Field(default=None, description="创建时间")


class StickyNoteCreate(BaseModel):
    """创建便签请求"""
    slide_index: int = Field(..., ge=0, description="幻灯片索引")
    content: str = Field(..., min_length=1, max_length=1000, description="便签内容")
    author: str = Field(default="anonymous", max_length=100, description="作者")
    color: str = "#FFE066"
    position_x: float = 0
    position_y: float = 0


@router.patch("/slides/{task_id}/notes")
async def update_slide_notes(task_id: str, update: SlideNotesUpdate):
    """R152: 更新幻灯片备注（支持富文本和演讲者私有备注）"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if update.slide_index < 0 or update.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        slide = slides[update.slide_index]
        if update.notes is not None:
            slide["notes"] = update.notes
        if update.rich_notes is not None:
            slide["rich_notes"] = update.rich_notes
        if update.speaker_notes is not None:
            slide["speaker_notes"] = update.speaker_notes

        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": update.slide_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.patch("/slides/{task_id}/sticky-notes")
async def update_slide_sticky_notes(task_id: str, update: SlideNotesUpdate):
    """R152: 更新幻灯片便签数据"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if update.slide_index < 0 or update.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        if update.sticky_notes is not None:
            slides[update.slide_index]["sticky_notes"] = update.sticky_notes

        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": update.slide_index}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/annotations/{task_id}/{slide_index}")
async def save_slide_annotations(task_id: str, slide_index: int, annotations: List[Dict[str, Any]]):
    """R152: 保存幻灯片标注（演示模式涂鸦）"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if slide_index < 0 or slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        slides[slide_index]["annotations"] = annotations
        tm.save_outline(task_id, outline)
        return {"success": True, "slide_index": slide_index, "count": len(annotations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.get("/sticky-notes/{task_id}")
async def get_sticky_notes(task_id: str):
    """R152: 获取任务的所有便签"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        all_sticky = []
        for idx, slide in enumerate(slides):
            sticky = slide.get("sticky_notes", [])
            for s in sticky:
                all_sticky.append({**s, "slide_index": idx})

        return {"success": True, "sticky_notes": all_sticky}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/sticky-notes/{task_id}")
async def add_sticky_note(task_id: str, note: StickyNoteCreate):
    """R152: 添加便签"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        if note.slide_index < 0 or note.slide_index >= len(slides):
            raise HTTPException(status_code=404, detail="Slide not found")

        new_note = {
            "id": str(uuid.uuid4())[:8],
            "slide_index": note.slide_index,
            "content": note.content,
            "author": note.author,
            "color": note.color,
            "position_x": note.position_x,
            "position_y": note.position_y,
            "created_at": datetime.now().isoformat(),
        }

        if "sticky_notes" not in slides[note.slide_index]:
            slides[note.slide_index]["sticky_notes"] = []
        slides[note.slide_index]["sticky_notes"].append(new_note)

        tm.save_outline(task_id, outline)
        return {"success": True, "note": new_note}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.delete("/sticky-notes/{task_id}/{note_id}")
async def delete_sticky_note(task_id: str, note_id: str):
    """R152: 删除便签"""
    from ...services.task_manager import get_task_manager
    tm = get_task_manager()

    try:
        outline = tm.get_outline(task_id)
        slides = outline.get("slides", [])

        found = False
        for slide in slides:
            sticky = slide.get("sticky_notes", [])
            slide["sticky_notes"] = [s for s in sticky if s.get("id") != note_id]
            if len(slide["sticky_notes"]) < len(sticky):
                found = True

        if not found:
            raise HTTPException(status_code=404, detail="Note not found")

        tm.save_outline(task_id, outline)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


# ==================== Notes Templates ====================

# In-memory store for notes templates (in production, use database)
NOTES_TEMPLATES_STORE = [
    {
        "id": "tpl-business-1",
        "name": "商业汇报模板",
        "description": "适用于季度汇报、项目汇报",
        "template_type": "business",
        "content": "【背景】<br>本次汇报聚焦于...<br><br>【核心成果】<br>• 成果1：...<br>• 成果2：...<br><br>【关键数据】<br>- 指标1：...<br>- 指标2：...<br><br>【下一步计划】<br>1. ...<br>2. ...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-education-1",
        "name": "教学演示模板",
        "description": "适用于课堂教学、学术报告",
        "template_type": "education",
        "content": "【教学目标】<br>本节课我们将学习...<br><br>【重点难点】<br>• 重点：...<br>• 难点：...<br><br>【案例分析】<br>...<br><br>【思考题】<br>1. ...<br>2. ...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-tech-1",
        "name": "技术分享模板",
        "description": "适用于技术分享会、架构讲解",
        "template_type": "tech",
        "content": "【背景介绍】<br>今天分享的主题是...<br><br>【技术方案】<br>我们采用了以下方案：<br>• 方案A：...<br>• 方案B：...<br><br>【代码示例】<br>```<br>...<br>```<br><br>【Q&A】<br>",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-marketing-1",
        "name": "营销提案模板",
        "description": "适用于营销方案、客户提案",
        "template_type": "marketing",
        "content": "【市场洞察】<br>当前市场趋势显示...<br><br>【目标受众】<br>我们的目标用户是...<br><br>【核心策略】<br>• 策略1：...<br>• 策略2：...<br><br>【预期效果】<br>- 品牌提升：...<br>- 转化提升：...",
        "created_at": "2026-01-01T00:00:00",
    },
    {
        "id": "tpl-general-1",
        "name": "通用备注模板",
        "description": "适用于各类演示的通用备注",
        "template_type": "通用",
        "content": "【开场】<br>各位好，今天我将分享...<br><br>【要点1】<br>首先，...<br><br>【要点2】<br>其次，...<br><br>【总结】<br>综上所述，...<br><br>【问答】<br>",
        "created_at": "2026-01-01T00:00:00",
    },
]


class NotesTemplateItem(BaseModel):
    """备注模板"""
    id: str
    name: str
    description: str
    template_type: str  # business | education | tech | marketing |通用
    content: str
    created_at: Optional[str] = None


class NotesTemplateCreate(BaseModel):
    """创建备注模板"""
    name: str
    description: str = ""
    template_type: str = "通用"
    content: str


@router.get("/notes-templates")
async def get_notes_templates(template_type: Optional[str] = None):
    """R152: 获取备注模板列表"""
    if template_type:
        filtered = [t for t in NOTES_TEMPLATES_STORE if t["template_type"] == template_type]
        return {"success": True, "templates": filtered}
    return {"success": True, "templates": NOTES_TEMPLATES_STORE}


@router.post("/notes-templates")
async def create_notes_template(tpl: NotesTemplateCreate):
    """R152: 创建自定义备注模板"""
    global NOTES_TEMPLATES_STORE
    new_tpl = {
        "id": f"tpl-custom-{uuid.uuid4().hex[:8]}",
        "name": tpl.name,
        "description": tpl.description,
        "template_type": tpl.template_type,
        "content": tpl.content,
        "created_at": datetime.now().isoformat(),
    }
    NOTES_TEMPLATES_STORE.append(new_tpl)
    return {"success": True, "template": new_tpl}


@router.delete("/notes-templates/{template_id}")
async def delete_notes_template(template_id: str):
    """R152: 删除自定义备注模板"""
    global NOTES_TEMPLATES_STORE
    if template_id.startswith("tpl-custom-"):
        before = len(NOTES_TEMPLATES_STORE)
        NOTES_TEMPLATES_STORE = [t for t in NOTES_TEMPLATES_STORE if t["id"] != template_id]
        if len(NOTES_TEMPLATES_STORE) == before:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"success": True}
    raise HTTPException(status_code=403, detail="Cannot delete built-in templates")
