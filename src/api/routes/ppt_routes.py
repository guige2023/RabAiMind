"""
PPT Routes - 主路由聚合器

将 PPT 相关路由拆分为多个子模块：
- ppt_generation: 生成、任务状态、预览、SVG获取
- ppt_outline: 大纲操作、规划、导入导出
- ppt_history: 历史记录、版本管理、协作、撤销重做
- ppt_advanced: AI功能、布局、主题、嵌入、教练、A/B测试、智能建议
- ppt_backup: 备份管理、备注模板

作者: Claude
日期: 2026-03-17
"""

from fastapi import APIRouter

from .ppt_advanced import router as advanced_router
from .ppt_backup import router as backup_router

# 导入子路由
from .ppt_generation import router as generation_router
from .ppt_history import router as history_router
from .ppt_outline import router as outline_router

# 创建主路由
router = APIRouter(prefix="/api/v1/ppt", tags=["ppt"])

# 注册子路由
router.include_router(generation_router)
router.include_router(outline_router)
router.include_router(history_router)
router.include_router(advanced_router)
router.include_router(backup_router)
