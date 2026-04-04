# -*- coding: utf-8 -*-
"""
模板API路由
"""
import time
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, UploadFile, File
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from pathlib import Path
from dataclasses import asdict

from ...services.template_manager import get_template_manager, Template

TMPLATES_DIR = Path("static/templates")
TMPLATES_DIR.mkdir(parents=True, exist_ok=True)


router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    style: str
    thumbnail: str
    colors: List[str]
    fonts: List[str]


@router.get("/list", response_model=List[TemplateResponse])
async def list_templates(
    category: Optional[str] = None,
    style: Optional[str] = None
):
    """获取模板列表"""
    manager = get_template_manager()
    templates = manager.list_templates(category=category, style=style)
    
    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            style=t.style,
            thumbnail=t.thumbnail,
            colors=t.colors,
            fonts=t.fonts
        )
        for t in templates
    ]


@router.get("/categories")
async def get_categories():
    """获取所有模板分类"""
    manager = get_template_manager()
    return {"categories": manager.get_categories()}


@router.get("/styles")
async def get_styles():
    """获取所有模板风格"""
    manager = get_template_manager()
    return {"styles": manager.get_styles()}


@router.get("/search", response_model=List[TemplateResponse])
async def search_templates(
    q: str = "",
    category: Optional[str] = None,
    style: Optional[str] = None,
    limit: int = 20
):
    """
    搜索模板

    Args:
        q: 搜索关键词（匹配名称和描述）
        category: 可选，按分类筛选
        style: 可选，按风格筛选
        limit: 返回数量限制，默认20
    """
    manager = get_template_manager()
    templates = manager.search_templates(query=q, category=category, style=style, limit=limit)

    return [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            style=t.style,
            thumbnail=t.thumbnail,
            colors=t.colors,
            fonts=t.fonts
        )
        for t in templates
    ]


# ─── UGC 用户模板接口 ────────────────────────────────────────────────

@router.get("/my")
async def list_my_templates():
    """列出当前用户的私人模板"""
    manager = get_template_manager()
    return {"success": True, "templates": manager.get_user_templates()}


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: str):
    """获取指定模板"""
    manager = get_template_manager()
    template = manager.get_template(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"模板 {template_id} 不存在"
        )

    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        category=template.category,
        style=template.style,
        thumbnail=template.thumbnail,
        colors=template.colors,
        fonts=template.fonts
    )


@router.post("/upload")
async def upload_template(
    name: str,
    description: str,
    scene: str = "business",
    style: str = "professional",
    visibility: str = "private",
    file: UploadFile = File(None),
):
    """用户上传自己的模板"""
    manager = get_template_manager()
    template_id = f"user_{int(time.time())}"

    thumbnail_path = ""
    if file:
        ext = Path(file.filename).suffix.lower() if file.filename else ".pptx"
        saved_path = TMPLATES_DIR / f"{template_id}{ext}"
        content = await file.read()
        saved_path.write_bytes(content)
        thumbnail_path = f"/static/templates/{template_id}_thumb.png"

    user_template = {
        "id": template_id,
        "name": name,
        "description": description,
        "scene": scene,
        "style": style,
        "visibility": visibility,
        "author": "current_user",
        "thumbnail": thumbnail_path,
        "applicable_scenes": [scene],
        "example": description,
        "colors": ["#165DFF", "#FFFFFF", "#F5F5F5"],
        "is_ugc": True,
        "created_at": datetime.now().isoformat()
    }

    manager.add_user_template(user_template)

    return {"success": True, "template_id": template_id, "template": user_template}


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """删除私人模板"""
    manager = get_template_manager()
    manager.remove_user_template(template_id)
    return {"success": True}


class BatchRenameItem(BaseModel):
    template_id: str
    new_name: str


class BatchRenameRequest(BaseModel):
    renames: List[BatchRenameItem]


@router.post("/batch/rename")
async def batch_rename_templates(request: BatchRenameRequest):
    """批量重命名模板"""
    from pydantic import BaseModel
    manager = get_template_manager()
    renamed = []
    errors = []

    for item in request.renames:
        try:
            if not item.new_name.strip():
                errors.append({"template_id": item.template_id, "error": "名称不能为空"})
                continue
            manager.rename_user_template(item.template_id, item.new_name.strip())
            renamed.append({"template_id": item.template_id, "new_name": item.new_name})
        except Exception as e:
            errors.append({"template_id": item.template_id, "error": str(e)})

    return {
        "success": True,
        "renamed": renamed,
        "errors": errors,
        "summary": f"成功重命名 {len(renamed)} 个模板，{len(errors)} 个失败"
    }


# ─── 推荐和搜索分析接口 ────────────────────────────────────────────────

@router.get("/trending")
async def get_trending_templates(limit: int = 6, days: int = 7):
    """
    获取热门模板（基于使用频率）
    
    Args:
        limit: 返回数量，默认6
        days: 统计最近天数，默认7
    """
    from ...services.search_analytics import get_analytics, get_template_usage, get_template_manager
    
    manager = get_template_manager()
    
    # 优先用真实使用数据，否则用点击数据
    usage = get_template_usage()
    usage_trending = usage.get_most_used(limit=limit)
    
    analytics = get_analytics()
    click_trending = analytics.get_trending_templates(limit=limit, days=days)
    
    # 合并两个数据源
    template_scores: dict = {}
    for entry in usage_trending:
        template_scores[entry["template_id"]] = entry["usage_count"] * 10
    for entry in click_trending:
        tid = entry["template_id"]
        template_scores[tid] = template_scores.get(tid, 0) + entry["click_count"]
    
    # 按分数排序
    sorted_ids = sorted(template_scores.keys(), key=lambda x: -template_scores[x])[:limit]
    
    result = []
    for tid in sorted_ids:
        t = manager.get_template(tid)
        if t:
            result.append({
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "style": t.style,
                "thumbnail": t.thumbnail,
                "colors": t.colors,
                "fonts": t.fonts,
                "score": template_scores[tid],
            })
    
    return {"success": True, "templates": result, "period_days": days}


@router.get("/similar/{template_id}")
async def get_similar_templates(template_id: str, limit: int = 5):
    """
    获取相似模板
    
    基于共现分析：使用过本模板的用户同时也使用了哪些模板
    """
    from ...services.search_analytics import get_analytics, get_template_manager
    
    manager = get_template_manager()
    analytics = get_analytics()
    
    similar_ids = analytics.get_template_similarity(template_id, limit=limit)
    
    # 如果共现数据不够，用分类/风格相似来补充
    base = manager.get_template(template_id)
    if not base and similar_ids:
        # 找不到原模板，直接返回
        return {"success": True, "templates": [], "template_id": template_id}
    
    result = []
    for sid in similar_ids:
        t = manager.get_template(sid)
        if t:
            result.append({
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "style": t.style,
                "thumbnail": t.thumbnail,
                "colors": t.colors,
                "fonts": t.fonts,
            })
    
    # 如果共现数据不足，补充同分类同风格的模板
    if len(result) < limit and base:
        all_templates = manager.list_templates()
        for t in all_templates:
            if t.id == template_id or any(r["id"] == t.id for r in result):
                continue
            if t.category == base.category or t.style == base.style:
                result.append({
                    "id": t.id,
                    "name": t.name,
                    "description": t.description,
                    "category": t.category,
                    "style": t.style,
                    "thumbnail": t.thumbnail,
                    "colors": t.colors,
                    "fonts": t.fonts,
                })
                if len(result) >= limit:
                    break
    
    return {"success": True, "templates": result[:limit], "template_id": template_id}


@router.get("/recommend")
async def get_recommended_templates(
    user_id: str = "anonymous",
    scene: Optional[str] = None,
    style: Optional[str] = None,
    limit: int = 6,
):
    """
    为你推荐（基于用户历史和使用场景）
    """
    from ...services.search_analytics import get_user_history, get_template_usage, get_template_manager
    
    manager = get_template_manager()
    
    # 1. 先尝试基于用户历史的协同过滤推荐
    history = get_user_history()
    recommended_ids = history.get_recommendations(user_id, limit=limit)
    
    # 2. 如果历史数据不够，用场景+风格推荐
    if len(recommended_ids) < limit:
        usage = get_template_usage()
        if scene:
            scene_recs = usage.get_for_scene(scene, limit=limit)
            recommended_ids.extend(scene_recs)
        if style:
            style_recs = usage.get_for_style(style, limit=limit)
            recommended_ids.extend(style_recs)
        # 去重
        seen = set()
        unique = []
        for rid in recommended_ids:
            if rid not in seen:
                seen.add(rid)
                unique.append(rid)
        recommended_ids = unique
    
    # 3. 兜底：用默认热门模板
    if len(recommended_ids) < limit:
        all_templates = manager.list_templates()
        default_order = ["default", "modern", "tech", "creative", "business", "education"]
        for did in default_order:
            if did not in seen:
                recommended_ids.append(did)
                if len(recommended_ids) >= limit:
                    break
    
    result = []
    for rid in recommended_ids[:limit]:
        t = manager.get_template(rid)
        if t:
            result.append({
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "style": t.style,
                "thumbnail": t.thumbnail,
                "colors": t.colors,
                "fonts": t.fonts,
            })
    
    return {"success": True, "templates": result, "user_id": user_id}


@router.get("/match")
async def match_templates(
    q: str = "",
    scene: Optional[str] = None,
    style: Optional[str] = None,
    limit: int = 6,
):
    """
    内容匹配：根据用户的需求文本（outline/request）推荐最合适的模板
    
    分析用户输入的关键词，匹配最佳模板
    """
    from ...services.search_analytics import get_analytics, get_template_manager
    
    manager = get_template_manager()
    
    # 关键词 → 模板分类/风格 映射
    scene_keywords = {
        "business": ["商业", "公司", "企业", "商务", "方案", "计划", "报告", "提案", "合作", "融资", "项目汇报", "年度总结", "工作"],
        "education": ["教育", "培训", "课程", "学生", "学校", "教学", "学习", "讲座", "学术", "课件", "培训"],
        "tech": ["科技", "技术", "AI", "人工智能", "软件", "互联网", "数字化", "产品发布", "技术分享"],
        "creative": ["创意", "设计", "艺术", "品牌", "营销", "活动", "策划", "广告", "宣传", "发布会", "年会"],
        "government": ["政府", "党建", "政务", "汇报", "规划", "政策"],
        "finance": ["金融", "银行", "投资", "理财", "基金", "财务", "审计", "财报", "路演"],
        "medical": ["医疗", "医药", "医院", "健康"],
    }
    
    style_keywords = {
        "professional": ["专业", "商务", "正式", "报告", "稳重", "可靠"],
        "minimal": ["简约", "简单", "干净", "清爽", "极简", "清新"],
        "modern": ["现代", "简洁", "当代"],
        "classic": ["经典", "传统", "正式", "古典"],
        "creative": ["创意", "独特", "艺术", "个性", "潮流"],
        "tech": ["科技", "未来", "智能", "数字", "赛博"],
        "elegant": ["优雅", "精致", "古典", "传统", "中国风", "水墨"],
    }
    
    q_lower = q.lower()
    matched_scenes: list = []
    matched_styles: list = []
    
    for sc, kws in scene_keywords.items():
        for kw in kws:
            if kw in q_lower:
                matched_scenes.append(sc)
                break
    
    for st, kws in style_keywords.items():
        for kw in kws:
            if kw in q_lower:
                matched_styles.append(st)
                break
    
    # 优先级：显式指定 > 内容分析 > 默认
    target_scene = scene or (matched_scenes[0] if matched_scenes else None)
    target_style = style or (matched_styles[0] if matched_styles else None)
    
    # 搜索匹配的模板
    all_templates = manager.list_templates()
    scored = []
    for t in all_templates:
        score = 0
        if target_scene and t.category == target_scene:
            score += 3
        if target_style and t.style == target_style:
            score += 2
        # 标题/描述关键词匹配
        if any(kw in t.name.lower() for kw in q_lower.split() if len(kw) > 2):
            score += 1
        if any(kw in t.description.lower() for kw in q_lower.split() if len(kw) > 2):
            score += 0.5
        scored.append((score, t))
    
    scored.sort(key=lambda x: -x[0])
    result = []
    for score, t in scored[:limit]:
        if score > 0:
            result.append({
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "style": t.style,
                "thumbnail": t.thumbnail,
                "colors": t.colors,
                "fonts": t.fonts,
                "match_score": score,
                "matched_scenes": matched_scenes,
                "matched_styles": matched_styles,
            })
    
    # 如果没有高匹配，返回默认推荐
    if not result:
        defaults = ["default", "modern", "business", "creative", "tech"]
        for did in defaults:
            t = manager.get_template(did)
            if t and len(result) < limit:
                result.append({
                    "id": t.id,
                    "name": t.name,
                    "description": t.description,
                    "category": t.category,
                    "style": t.style,
                    "thumbnail": t.thumbnail,
                    "colors": t.colors,
                    "fonts": t.fonts,
                    "match_score": 0,
                })
    
    # 记录搜索分析
    if q:
        analytics = get_analytics()
        analytics.track_search(q, results_count=len(result))
    
    return {
        "success": True,
        "templates": result,
        "query": q,
        "detected_scene": target_scene,
        "detected_style": target_style,
    }


@router.post("/track")
async def track_template_event(
    event_type: str,  # search, click, use
    template_id: Optional[str] = None,
    user_id: str = "anonymous",
    query: str = "",
    scene: str = "",
    style: str = "",
    request_text: str = "",
):
    """跟踪模板相关事件"""
    from ...services.search_analytics import get_analytics, get_template_usage, get_user_history
    
    analytics = get_analytics()
    
    if event_type == "search" and query:
        analytics.track_search(query)
    elif event_type == "click" and template_id:
        analytics.track_template_click(template_id, query=query)
    elif event_type == "use" and template_id:
        analytics.track_template_click(template_id, query=query)
        usage = get_template_usage()
        usage.track_usage(template_id, user_id=user_id, scene=scene, style=style, request_text=request_text)
    
    if user_id != "anonymous" and template_id:
        history = get_user_history()
        history.add_interaction(user_id, template_id, interaction_type=event_type)
    
    return {"success": True, "event_type": event_type}


@router.get("/search-analytics/trending-queries")
async def get_trending_queries(limit: int = 10, days: int = 7):
    """获取热门搜索词"""
    from ...services.search_analytics import get_analytics
    analytics = get_analytics()
    queries = analytics.get_trending_queries(limit=limit, days=days)
    return {"success": True, "queries": queries, "period_days": days}


# ─── Template Marketplace APIs ─────────────────────────────────────────────

# 1. Publish to marketplace
@router.post("/{template_id}/publish")
async def publish_template(template_id: str, visibility: str = "public"):
    """将用户模板发布到市场（设为 public）"""
    manager = get_template_manager()
    # 尝试修改用户模板的可见性
    for t in manager.user_templates:
        if t["id"] == template_id:
            t["visibility"] = visibility
            manager._save_user_templates()
            return {"success": True, "template_id": template_id, "visibility": visibility}
    raise HTTPException(status_code=404, detail=f"模板 {template_id} 不存在")


# 2. Template reviews & ratings
class ReviewRequest(BaseModel):
    user_id: str = "anonymous"
    user_name: str = "匿名用户"
    rating: int = 5
    content: str = ""


@router.get("/{template_id}/reviews")
async def get_template_reviews(template_id: str):
    """获取模板的所有点评"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    result = ms.get_reviews(template_id)
    return {"success": True, **result}


@router.post("/{template_id}/reviews")
async def add_template_review(template_id: str, request: ReviewRequest):
    """添加或更新模板点评"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    review = ms.add_review(
        template_id=template_id,
        user_id=request.user_id,
        user_name=request.user_name,
        rating=request.rating,
        content=request.content
    )
    # 更新点评后的统计
    result = ms.get_reviews(template_id)
    return {"success": True, "review": review, **result}


@router.delete("/{template_id}/reviews/{review_id}")
async def delete_template_review(template_id: str, review_id: str, user_id: str = "anonymous"):
    """删除模板点评"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    ok = ms.delete_review(template_id, review_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="点评不存在或无权删除")
    return {"success": True}


# 3. Featured templates
@router.get("/featured")
async def get_featured_templates(limit: int = 10):
    """获取精选模板列表（管理员精选）"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    manager = get_template_manager()
    featured_ids = ms.get_featured_templates()[:limit]
    templates = []
    for fid in featured_ids:
        t = manager.get_template(fid)
        if t:
            templates.append({
                "id": t.id, "name": t.name, "description": t.description,
                "category": t.category, "style": t.style, "thumbnail": t.thumbnail,
                "colors": t.colors, "fonts": t.fonts
            })
    return {"success": True, "templates": templates}


@router.post("/featured/{template_id}")
async def add_featured_template(template_id: str):
    """添加精选模板（管理员）"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    ms.add_featured(template_id)
    return {"success": True, "template_id": template_id}


@router.delete("/featured/{template_id}")
async def remove_featured_template(template_id: str):
    """移除精选模板（管理员）"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    ms.remove_featured(template_id)
    return {"success": True}


# 4. Template subscription
@router.post("/subscribe/{category}")
async def subscribe_category(category: str, user_id: str = "anonymous"):
    """订阅某分类，有新模板时通知用户"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    sub = ms.subscribe(user_id, category)
    return {"success": True, "subscription": asdict(sub)}


@router.delete("/subscribe/{category}")
async def unsubscribe_category(category: str, user_id: str = "anonymous"):
    """取消订阅"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    ms.unsubscribe(user_id, category)
    return {"success": True}


@router.get("/subscriptions")
async def get_user_subscriptions(user_id: str = "anonymous"):
    """获取用户订阅的分类列表"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    categories = ms.get_user_subscriptions(user_id)
    return {"success": True, "categories": categories}


# 5. Template bundles
@router.get("/bundles")
async def get_bundles():
    """获取所有模板捆绑包"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    bundles = ms.get_bundles()
    # 附加模板详情
    manager = get_template_manager()
    result = []
    for b in bundles:
        template_list = []
        for tid in b.get("template_ids", []):
            t = manager.get_template(tid)
            if t:
                template_list.append({
                    "id": t.id, "name": t.name, "thumbnail": t.thumbnail,
                    "category": t.category, "style": t.style
                })
        result.append({**b, "templates": template_list})
    return {"success": True, "bundles": result}


@router.get("/bundles/{bundle_id}")
async def get_bundle(bundle_id: str):
    """获取单个捆绑包详情"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    bundle = ms.get_bundle(bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="捆绑包不存在")
    manager = get_template_manager()
    template_list = []
    for tid in bundle.get("template_ids", []):
        t = manager.get_template(tid)
        if t:
            template_list.append({
                "id": t.id, "name": t.name, "thumbnail": t.thumbnail,
                "category": t.category, "style": t.style
            })
    return {"success": True, "bundle": {**bundle, "templates": template_list}}


@router.post("/bundles/{bundle_id}/purchase")
async def purchase_bundle(bundle_id: str, user_id: str = "anonymous"):
    """购买捆绑包（领取模板）"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    try:
        purchase = ms.purchase_bundle(bundle_id, user_id)
        bundle = ms.get_bundle(bundle_id)
        return {"success": True, "purchase": purchase, "bundle": bundle}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Template of the Day ────────────────────────────────────────────────────

@router.get("/daily")
async def get_template_of_the_day():
    """
    获取今日推荐的模板
    每天根据日期自动选择，保持一天内一致
    """
    from ...services.marketplace_service import get_marketplace_service, get_template_manager
    import hashlib

    manager = get_template_manager()
    ms = get_marketplace_service()

    # 获取所有可用模板
    all_templates = manager.list_templates()
    if not all_templates:
        return {"success": True, "template": None, "date": datetime.now().date().isoformat()}

    # 基于今天的日期 hash 选择一个模板（每天不同）
    today = datetime.now().strftime("%Y-%m-%d")
    hash_input = f"rabaimind_daily_{today}"
    hash_val = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
    idx = hash_val % len(all_templates)

    selected = all_templates[idx]
    return {
        "success": True,
        "template": {
            "id": selected.id,
            "name": selected.name,
            "description": selected.description,
            "category": selected.category,
            "style": selected.style,
            "thumbnail": selected.thumbnail,
            "colors": selected.colors,
            "fonts": selected.fonts,
        },
        "date": today,
        "reason": "基于今日日期的自动推荐"
    }


@router.get("/daily/history")
async def get_daily_history(limit: int = 7):
    """获取最近N天的每日推荐历史"""
    import hashlib

    manager = get_template_manager()
    all_templates = manager.list_templates()
    if not all_templates:
        return {"success": True, "history": []}

    history = []
    for i in range(limit):
        d = datetime.now() - timedelta(days=i)
        date_str = d.strftime("%Y-%m-%d")
        hash_input = f"rabaimind_daily_{date_str}"
        hash_val = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        idx = hash_val % len(all_templates)
        t = all_templates[idx]
        history.append({
            "date": date_str,
            "template_id": t.id,
            "name": t.name,
            "category": t.category,
        })

    return {"success": True, "history": history}



# ==================== Advanced Search APIs ====================

class AdvancedSearchRequest(BaseModel):
    query: str = ""
    category: Optional[str] = None
    style: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    template_type: Optional[str] = None
    sort_by: str = "relevance"
    page: int = 1
    limit: int = 20
    use_semantic: bool = True


class AdvancedSearchResponseModel(BaseModel):
    success: bool
    results: List[TemplateResponse]
    total: int
    page: int
    total_pages: int
    query: str
    applied_filters: Dict[str, Any]
    highlighted_fields: Dict[str, Any]


@router.post("/advanced-search", response_model=AdvancedSearchResponseModel)
async def advanced_search_templates(request: AdvancedSearchRequest):
    from ...services.template_manager import get_template_manager
    from ...services.search_analytics import get_analytics

    manager = get_template_manager()
    analytics = get_analytics()

    if request.query:
        analytics.track_search(request.query)

    applied_filters = {
        "query": request.query,
        "category": request.category,
        "style": request.style,
        "author": request.author,
        "tags": request.tags or [],
        "date_from": request.date_from,
        "date_to": request.date_to,
        "template_type": request.template_type or "all",
        "sort_by": request.sort_by,
        "use_semantic": request.use_semantic,
    }

    all_templates = list(manager.list_templates())

    for ut in manager.user_templates:
        if ut.get("visibility") == "public" or ut.get("author") == "current_user":
            all_templates.append(type('Template', (), {
                "id": ut["id"],
                "name": ut["name"],
                "description": ut.get("description", ""),
                "category": ut.get("category", ut.get("scene", "business")),
                "style": ut.get("style", "professional"),
                "thumbnail": ut.get("thumbnail", ""),
                "colors": ut.get("colors", ["#165DFF", "#FFFFFF"]),
                "fonts": ut.get("fonts", ["思源黑体"]),
                "author": ut.get("author", "current_user"),
                "created_at": ut.get("created_at", ""),
                "is_ugc": True,
            })())

    filtered = []
    for t in all_templates:
        if request.category and t.category != request.category:
            continue
        if request.style and t.style != request.style:
            continue
        if request.author:
            t_author = getattr(t, "author", "system")
            if t_author != request.author:
                continue
        is_ugc = getattr(t, "is_ugc", False)
        if request.template_type == "ugc" and not is_ugc:
            continue
        if request.template_type == "system" and is_ugc:
            continue

        created_at = getattr(t, "created_at", "")
        if created_at and request.date_from:
            if created_at < request.date_from:
                continue
        if created_at and request.date_to:
            if created_at > request.date_to:
                continue

        if request.query:
            q = request.query.lower().strip()
            name_match = q in t.name.lower()
            desc_match = q in t.description.lower()
            relevance = 2 if name_match else (1 if desc_match else 0)
            if relevance == 0:
                continue
            t._relevance = relevance
        else:
            t._relevance = 1

        filtered.append(t)

    if request.sort_by == "newest":
        filtered.sort(key=lambda t: getattr(t, "created_at", ""), reverse=True)
    elif request.sort_by == "name":
        filtered.sort(key=lambda t: t.name)
    elif request.sort_by == "popularity":
        trending = analytics.get_trending_templates(limit=100)
        trend_map = {e["template_id"]: e["click_count"] for e in trending}
        filtered.sort(key=lambda t: trend_map.get(t.id, 0), reverse=True)
    else:
        filtered.sort(key=lambda t: getattr(t, "_relevance", 0), reverse=True)

    total = len(filtered)
    total_pages = max(1, (total + request.limit - 1) // request.limit)
    page = max(1, min(request.page, total_pages))
    start = (page - 1) * request.limit
    end = start + request.limit
    page_templates = filtered[start:end]

    highlighted: Dict[str, Dict[str, Any]] = {}
    for t in page_templates:
        q = (request.query or "").lower().strip()
        highlights: Dict[str, Any] = {}
        if q and q in t.name.lower():
            highlights["name"] = t.name
        if q and q in t.description.lower():
            idx = t.description.lower().find(q)
            start_h = max(0, idx - 20)
            end_h = min(len(t.description), idx + len(q) + 20)
            highlights["description"] = f"...{t.description[start_h:end_h]}..."
        highlighted[t.id] = highlights

    results = []
    for t in page_templates:
        results.append(TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            category=t.category,
            style=t.style,
            thumbnail=t.thumbnail,
            colors=t.colors,
            fonts=t.fonts,
        ))

    return AdvancedSearchResponseModel(
        success=True,
        results=results,
        total=total,
        page=page,
        total_pages=total_pages,
        query=request.query,
        applied_filters=applied_filters,
        highlighted_fields=highlighted,
    )


class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10
    category: Optional[str] = None
    style: Optional[str] = None


@router.post("/semantic-search")
async def semantic_search_templates(request: SemanticSearchRequest):
    from ...services.semantic_search import get_semantic_search
    from ...services.template_manager import get_template_manager

    if not request.query or not request.query.strip():
        return {"success": False, "error": "query is required", "results": []}

    ss = get_semantic_search()
    results = await ss.semantic_search_templates(
        query=request.query,
        limit=request.limit,
        category=request.category,
        style=request.style
    )

    manager = get_template_manager()
    enriched = []
    for r in results:
        t = manager.get_template(r["template_id"])
        if not t:
            for ut in manager.user_templates:
                if ut["id"] == r["template_id"]:
                    t = type('Template', (), {
                        "id": ut["id"],
                        "name": ut["name"],
                        "description": ut.get("description", ""),
                        "category": ut.get("category", "business"),
                        "style": ut.get("style", "professional"),
                        "thumbnail": ut.get("thumbnail", ""),
                        "colors": ut.get("colors", ["#165DFF"]),
                        "fonts": ut.get("fonts", ["思源黑体"]),
                    })()
                    break
        if t:
            enriched.append({
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "style": t.style,
                "thumbnail": t.thumbnail,
                "colors": t.colors,
                "fonts": t.fonts,
                "similarity_score": r["similarity_score"],
            })

    return {
        "success": True,
        "query": request.query,
        "total": len(enriched),
        "results": enriched,
        "search_type": "semantic"
    }


@router.get("/search-analytics/dashboard")
async def get_search_analytics_dashboard(days: int = 30):
    from ...services.search_analytics import get_analytics
    from ...services.template_manager import get_template_manager
    from collections import Counter

    analytics = get_analytics()
    manager = get_template_manager()

    trending_queries = analytics.get_trending_queries(limit=20, days=days)

    all_searches = analytics.data.get("searches", [])
    from datetime import datetime, timedelta
    if days > 0:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        all_searches = [s for s in all_searches if s["timestamp"] >= cutoff]

    volume_by_day: Dict[str, int] = {}
    for s in all_searches:
        day = s["timestamp"].split("T")[0]
        volume_by_day[day] = volume_by_day.get(day, 0) + 1

    volume_over_time = [
        {"date": d, "count": c}
        for d, c in sorted(volume_by_day.items())
    ]

    no_result_queries = [
        s["query"] for s in all_searches if s.get("results_count", -1) == 0
    ]
    no_result_counter = Counter(no_result_queries)
    no_result_top = [
        {"query": q, "count": c}
        for q, c in no_result_counter.most_common(10)
    ]

    trending_templates = analytics.get_trending_templates(limit=10, days=days)
    enriched_templates = []
    for entry in trending_templates:
        t = manager.get_template(entry["template_id"])
        if t:
            enriched_templates.append({
                "id": t.id,
                "name": t.name,
                "category": t.category,
                "style": t.style,
                "thumbnail": t.thumbnail,
                "click_count": entry["click_count"],
            })

    popular_filters: List[Dict[str, Any]] = []
    for s in all_searches:
        q = s.get("query", "")
        if not q or len(q) <= 1:
            continue
        combos = []
        if "图表" in q or "chart" in q.lower(): combos.append("图表")
        if "商务" in q or "business" in q.lower(): combos.append("商务")
        if "创意" in q or "creative" in q.lower(): combos.append("创意")
        if "科技" in q or "tech" in q.lower(): combos.append("科技")
        if combos:
            popular_filters.append({"filters": "+".join(combos), "count": 1})

    filter_counter = Counter(p["filters"] for p in popular_filters)
    popular_filter_combinations = [
        {"filters": f, "count": c}
        for f, c in filter_counter.most_common(10)
    ]

    return {
        "success": True,
        "period_days": days,
        "trending_queries": trending_queries,
        "search_volume_over_time": volume_over_time,
        "no_result_queries": no_result_top,
        "top_clicked_templates": enriched_templates,
        "popular_filter_combinations": popular_filter_combinations,
        "total_searches": len(all_searches),
        "unique_queries": len(set(s["query"] for s in all_searches)),
    }


# ─── R128: Template Subcategories ────────────────────────────────────────────

@router.get("/subcategories")
async def get_subcategories(category: Optional[str] = None):
    """
    获取模板子分类
    R128: 支持按分类获取子分类
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    
    if category:
        subcats = manager.get_subcategories(category)
        return {"success": True, "category": category, "subcategories": subcats.get(category, [])}
    
    return {"success": True, "subcategories": manager.get_subcategories()}


# ─── R128: Template Download Counter ─────────────────────────────────────────

@router.post("/{template_id}/download")
async def track_template_download(
    template_id: str,
    user_id: str = "anonymous",
):
    """
    记录模板下载（增加下载计数）
    R128: 新增下载计数追踪
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    
    count = manager.increment_download_count(template_id)
    
    # 记录下载分析事件
    from ...services.search_analytics import get_analytics
    analytics = get_analytics()
    analytics.track_template_click(template_id, query="download")
    
    return {"success": True, "template_id": template_id, "download_count": count}


@router.get("/{template_id}/download-count")
async def get_template_download_count(template_id: str):
    """获取模板下载次数"""
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    count = manager.get_download_count(template_id)
    return {"success": True, "template_id": template_id, "download_count": count}


# ─── R128: Template Collections ─────────────────────────────────────────────

@router.get("/collections")
async def get_template_collections():
    """
    获取模板精选合集列表
    R128: 精选合集（curated bundles）
    """
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    collections = ms.get_collections()
    return {"success": True, "collections": collections}


@router.get("/collections/{collection_id}")
async def get_collection(collection_id: str):
    """获取单个精选合集"""
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    collection = ms.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="合集不存在")
    return {"success": True, "collection": collection}


# ─── R128: Template Ratings Breakdown ───────────────────────────────────────

class RatingsBreakdownRequest(BaseModel):
    user_id: str = "anonymous"
    user_name: str = "匿名用户"
    design: int = 5  # 设计评分 1-5
    usability: int = 5  # 易用性评分 1-5
    features: int = 5  # 功能评分 1-5
    content: str = ""


@router.get("/{template_id}/ratings-breakdown")
async def get_ratings_breakdown(template_id: str):
    """
    获取模板评分细分（设计/易用性/功能）
    R128: 新增评分细分功能
    """
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    
    breakdown = ms.get_ratings_breakdown(template_id)
    return {"success": True, "template_id": template_id, "ratings_breakdown": breakdown}


@router.post("/{template_id}/ratings-breakdown")
async def submit_ratings_breakdown(template_id: str, request: RatingsBreakdownRequest):
    """
    提交模板评分细分
    R128: 新增评分细分提交
    """
    from ...services.marketplace_service import get_marketplace_service
    ms = get_marketplace_service()
    
    breakdown = ms.submit_ratings_breakdown(
        template_id=template_id,
        user_id=request.user_id,
        user_name=request.user_name,
        design=request.design,
        usability=request.usability,
        features=request.features,
        content=request.content
    )
    
    return {"success": True, "ratings_breakdown": breakdown}


# ─── R128: Template Preview Slides ──────────────────────────────────────────

@router.get("/{template_id}/preview-slides")
async def get_template_preview_slides(template_id: str):
    """
    获取模板预览幻灯片信息（用于交互式预览）
    R128: 新增模板预览幻灯片接口
    返回模板的幻灯片结构和布局信息
    """
    from ...services.template_manager import get_template_manager
    manager = get_template_manager()
    
    template = manager.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"模板 {template_id} 不存在")
    
    # 生成预览幻灯片列表
    preview_slides = _generate_preview_slides(template)
    
    return {
        "success": True,
        "template_id": template_id,
        "name": template.name,
        "description": template.description,
        "colors": template.colors,
        "fonts": template.fonts,
        "slides": preview_slides
    }


def _generate_preview_slides(template) -> List[dict]:
    """为模板生成预览幻灯片结构"""
    slides = []
    
    # 封面页
    slides.append({
        "index": 0,
        "type": "title",
        "title": template.name,
        "subtitle": template.description,
        "layout": "title_slide",
        "colors": template.colors,
    })
    
    # 目录页
    slides.append({
        "index": 1,
        "type": "toc",
        "title": "目录",
        "items": ["背景介绍", "核心内容", "数据分析", "总结展望"],
        "layout": "toc_slide",
        "colors": template.colors,
    })
    
    # 内容页示例
    content_sections = [
        ("背景介绍", "核心要点与行业分析"),
        ("核心内容", "关键发现与深度解读"),
        ("数据分析", "数据支撑与图表展示"),
        ("总结展望", "结论与未来方向"),
    ]
    
    for i, (title, subtitle) in enumerate(content_sections):
        slide_type = "content"
        if i % 2 == 1:
            slide_type = "two_column"
        elif i == 2:
            slide_type = "data_visualization"
        
        slides.append({
            "index": i + 2,
            "type": slide_type,
            "title": title,
            "subtitle": subtitle,
            "layout": f"content_slide_{i}",
            "colors": template.colors,
            "content_preview": f"这是第{i+1}页内容预览区域，可拖拽调整文字和图片位置。",
        })
    
    # 结尾页
    slides.append({
        "index": len(slides),
        "type": "ending",
        "title": "感谢观看",
        "subtitle": template.name,
        "layout": "ending_slide",
        "colors": template.colors,
    })
    
    return slides
