# -*- coding: utf-8 -*-
"""
API 路由初始化

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter
from src.api.routes.ppt import router

# 创建主路由
api_router = APIRouter()

# 注册子路由
api_router.include_router(router)
