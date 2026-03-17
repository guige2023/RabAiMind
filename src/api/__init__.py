# -*- coding: utf-8 -*-
"""
API 路由初始化

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter
from src.api.routes.ppt import router as ppt_router
from src.api.routes.template import router as template_router

# 创建主路由
api_router = APIRouter()

# 注册子路由
api_router.include_router(ppt_router)
api_router.include_router(template_router)
