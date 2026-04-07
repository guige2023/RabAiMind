# -*- coding: utf-8 -*-
"""
AI Analysis Service - Phase 2.1 AI分析服务层

封装AIAnalyzer，提供更高级别的服务接口

作者: Claude
日期: 2026-04-07
"""

import logging
import os
import tempfile
from typing import Dict, Any, List, Optional, Union

from src.agents.ai_analyzer import (
    AIAnalyzer,
    Slide,
    KeyInfo,
    AudiencePersona,
    CompetitorAnalysis,
    get_ai_analyzer,
    extract_text_from_file
)

logger = logging.getLogger(__name__)


class AIAnalysisService:
    """
    AI分析服务

    提供文档分析、PPT大纲生成、竞品分析、受众画像等高级功能
    """

    def __init__(self, analyzer: Optional[AIAnalyzer] = None):
        """
        初始化AI分析服务

        Args:
            analyzer: AIAnalyzer实例，如果为None则使用全局单例
        """
        self._analyzer = analyzer

    @property
    def analyzer(self) -> AIAnalyzer:
        """获取AIAnalyzer实例（懒加载）"""
        if self._analyzer is None:
            self._analyzer = get_ai_analyzer()
        return self._analyzer

    def analyze_document(self, file_path: str) -> Dict[str, Any]:
        """
        分析文档

        Args:
            file_path: 文档路径

        Returns:
            文档分析结果
        """
        return self.analyzer.analyze_document(file_path)

    def analyze_document_from_upload(
        self,
        file_content: bytes,
        file_name: str
    ) -> Dict[str, Any]:
        """
        从上传的文件内容分析文档

        Args:
            file_content: 文件二进制内容
            file_name: 文件名

        Returns:
            文档分析结果
        """
        # 保存到临时文件
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=os.path.splitext(file_name)[1]
        ) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        try:
            return self.analyzer.analyze_document(tmp_path)
        finally:
            # 清理临时文件
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

    def generate_outline(
        self,
        key_info: Dict[str, Any],
        scene: str = "business"
    ) -> List[Dict[str, Any]]:
        """
        生成PPT大纲

        Args:
            key_info: 文档关键信息
            scene: 场景类型

        Returns:
            PPT大纲列表（字典格式）
        """
        slides = self.analyzer.generate_outline(key_info, scene)

        # 转换为字典格式
        return [
            {
                "slide_number": slide.slide_number,
                "title": slide.title,
                "content": slide.content,
                "bullet_points": slide.bullet_points,
                "layout_type": slide.layout_type,
                "notes": slide.notes
            }
            for slide in slides
        ]

    def generate_outline_from_document(
        self,
        file_path: str,
        scene: str = "business"
    ) -> Dict[str, Any]:
        """
        从文档直接生成PPT大纲（一步完成）

        Args:
            file_path: 文档路径
            scene: 场景类型

        Returns:
            包含key_info和outline的完整结果
        """
        # 1. 分析文档
        key_info = self.analyzer.analyze_document(file_path)
        if not key_info.get("success"):
            return {
                "success": False,
                "error": key_info.get("error", "文档分析失败")
            }

        # 2. 生成大纲
        outline = self.generate_outline(key_info, scene)

        return {
            "success": True,
            "key_info": key_info,
            "outline": outline
        }

    def competitor_analysis(self, url: str, name: Optional[str] = None) -> Dict[str, Any]:
        """
        竞品分析

        Args:
            url: 竞品URL
            name: 竞品名称（可选）

        Returns:
            竞品分析结果
        """
        return self.analyzer.competitor_analysis(url, name)

    def audience_profiling(self, description: str) -> Dict[str, Any]:
        """
        受众画像生成

        Args:
            description: 受众描述

        Returns:
            受众画像结果
        """
        return self.analyzer.audience_profiling(description)

    def create_presentation_from_analysis(
        self,
        key_info: Dict[str, Any],
        outline: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        根据分析和大纲创建演示文稿数据

        Args:
            key_info: 文档关键信息
            outline: PPT大纲

        Returns:
            演示文稿数据结构
        """
        return {
            "success": True,
            "presentation": {
                "title": key_info.get("title", "演示文稿"),
                "summary": key_info.get("summary", ""),
                "keywords": key_info.get("keywords", []),
                "slides": outline
            }
        }


# ==================== Global Instance ====================

_ai_analysis_service_instance: Optional[AIAnalysisService] = None


def get_ai_analysis_service() -> AIAnalysisService:
    """获取AIAnalysisService单例实例"""
    global _ai_analysis_service_instance
    if _ai_analysis_service_instance is None:
        _ai_analysis_service_instance = AIAnalysisService()
    return _ai_analysis_service_instance


# 导出
__all__ = [
    "AIAnalysisService",
    "get_ai_analysis_service",
    "AIAnalyzer",
    "Slide",
    "KeyInfo",
    "AudiencePersona",
    "CompetitorAnalysis"
]