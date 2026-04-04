# -*- coding: utf-8 -*-
"""
API 路由初始化

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter
from .routes.ppt import router as ppt_router
from .routes.template import router as template_router
from .routes.favorites import router as favorites_router
from .routes.images import router as images_router
from .routes.brand import router as brand_router
from .routes.status import router as status_router
from .routes.ai import router as ai_router
from .routes.user import router as user_router
from .routes.analytics import router as analytics_router
from .routes.security import router as security_router
from .routes.gdpr import router as gdpr_router
from .routes.sso import router as sso_router
from .routes.tiers import router as tiers_router
from .routes.webhook import router as webhook_router
from .routes.zapier import router as zapier_router
from .routes.engagement import router as engagement_router
from .routes.scheduler import router as scheduler_router

# 创建主路由
api_router = APIRouter()

# 注册子路由
api_router.include_router(ppt_router)
api_router.include_router(template_router)
api_router.include_router(favorites_router)
api_router.include_router(images_router)
api_router.include_router(brand_router)
api_router.include_router(status_router)
api_router.include_router(ai_router)
api_router.include_router(user_router)
api_router.include_router(analytics_router)
api_router.include_router(security_router)
api_router.include_router(gdpr_router)
api_router.include_router(sso_router)
api_router.include_router(tiers_router)
api_router.include_router(webhook_router)
api_router.include_router(zapier_router)
api_router.include_router(engagement_router)
api_router.include_router(scheduler_router)
