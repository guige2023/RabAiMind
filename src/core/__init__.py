"""
AI 核心分析模块

包含:
- AIAnalyzer: 需求分析器
- ContentGenerator: 内容生成器
"""

from .ai_analyzer import (
    AIAnalyzer,
    AnalysisResult,
    PromptTemplate,
)

# ContentGenerator lives in services, not in ai_analyzer
try:
    from ...services.content_generator import ContentGenerator, get_content_generator
    _has_content_gen = True
except ImportError:
    ContentGenerator = None
    get_content_generator = None
    _has_content_gen = False

__all__ = [
    "AIAnalyzer",
    "AnalysisResult",
    "PromptTemplate",
]
if _has_content_gen:
    __all__ += ["ContentGenerator", "get_content_generator"]
