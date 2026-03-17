# -*- coding: utf-8 -*-
"""
服务层初始化

作者: Claude
日期: 2026-03-17
"""

from .task_manager import TaskManager, get_task_manager
from .ppt_generator import PPTGenerator, get_ppt_generator
from .volc_api import VolcEngineAPI, get_volc_api
from .ai_analyzer import AIAnalyzer, get_ai_analyzer
from .content_generator import ContentGenerator, get_content_generator

__all__ = [
    "TaskManager",
    "get_task_manager",
    "PPTGenerator",
    "get_ppt_generator",
    "VolcEngineAPI",
    "get_volc_api",
    "AIAnalyzer",
    "get_ai_analyzer",
    "ContentGenerator",
    "get_content_generator"
]
