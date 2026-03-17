# -*- coding: utf-8 -*-
"""
AI 核心分析模块

包含:
- AIAnalyzer: 需求分析器
- ContentGenerator: 内容生成器
"""

from .ai_analyzer import (
    AIAnalyzer,
    ContentGenerator,
    RequirementAnalysis,
    SlideTask,
    SceneType,
    StyleType,
    create_analyzer,
    create_content_generator
)

__all__ = [
    "AIAnalyzer",
    "ContentGenerator", 
    "RequirementAnalysis",
    "SlideTask",
    "SceneType",
    "StyleType",
    "create_analyzer",
    "create_content_generator"
]
