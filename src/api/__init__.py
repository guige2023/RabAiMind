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
