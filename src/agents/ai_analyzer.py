# -*- coding: utf-8 -*-
"""
Phase 2.1 AI Analysis Layer - AIAnalyzer Agent
文档分析、竞品分析、受众画像、PPT大纲生成

作者: Claude
日期: 2026-04-07
"""

import logging
import os
import json
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


# ==================== Data Models ====================

@dataclass
class Slide:
    """幻灯片数据结构"""
    slide_number: int
    title: str
    content: str
    bullet_points: List[str] = field(default_factory=list)
    layout_type: str = "content_card"
    notes: Optional[str] = None


@dataclass
class KeyInfo:
    """文档关键信息"""
    title: str
    summary: str
    key_points: List[str]
    keywords: List[str]
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AudiencePersona:
    """受众画像"""
    name: str
    age_range: str
    occupation: str
    pain_points: List[str]
    interests: List[str]
    preferred_content_style: str
    demographics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CompetitorAnalysis:
    """竞品分析结果"""
    competitor_name: str
    strengths: List[str]
    weaknesses: List[str]
    market_position: str
    comparison_data: Dict[str, Any] = field(default_factory=dict)


# ==================== Document Parsers ====================

def extract_text_from_file(file_path: str) -> str:
    """
    从文件提取文本内容

    支持格式: .txt, .pdf, .docx

    Args:
        file_path: 文件路径

    Returns:
        提取的文本内容
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件不存在: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".txt":
        return _extract_txt(file_path)
    elif ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return _extract_docx(file_path)
    else:
        raise ValueError(f"不支持的文件格式: {ext}")


def _extract_txt(file_path: str) -> str:
    """提取纯文本文件"""
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def _extract_pdf(file_path: str) -> str:
    """提取PDF文件文本"""
    try:
        import PyPDF2
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
    except ImportError:
        logger.warning("PyPDF2 未安装，尝试使用 pdfplumber")
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                text_parts = []
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                return "\n".join(text_parts)
        except ImportError:
            raise ImportError("请安装 PyPDF2 或 pdfplumber 来解析 PDF 文件")


def _extract_docx(file_path: str) -> str:
    """提取Word文档文本"""
    try:
        from docx import Document
        doc = Document(file_path)
        text_parts = []
        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text)
        return "\n".join(text_parts)
    except ImportError:
        raise ImportError("请安装 python-docx 来解析 Word 文档")


# ==================== Prompt Templates ====================

class PromptTemplates:
    """AI提示词模板"""

    DOCUMENT_ANALYSIS = """你是一个专业的文档分析专家。请分析以下文档内容，提取关键信息。

文档内容：
{content}

请按以下JSON格式返回分析结果：
{{
    "title": "文档标题/主题",
    "summary": "文档摘要（100字以内）",
    "key_points": ["核心要点1", "核心要点2", "核心要点3", "核心要点4", "核心要点5"],
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
    "metadata": {{
        "word_count": 字数,
        "document_type": "文档类型",
        "language": "语言"
    }}
}}

请只返回JSON，不要其他内容。"""

    OUTLINE_GENERATION = """你是一个专业的PPT策划专家。根据文档内容，为目标场景生成PPT大纲。

场景类型：{scene}
文档关键信息：
{key_info}

请按以下JSON格式返回PPT大纲：
{{
    "slides": [
        {{
            "slide_number": 1,
            "title": "封面标题",
            "content": "封面副标题或简介",
            "bullet_points": [],
            "layout_type": "title_slide"
        }},
        {{
            "slide_number": 2,
            "title": "目录标题",
            "content": "目录内容简介",
            "bullet_points": ["要点1", "要点2", "要点3"],
            "layout_type": "toc"
        }},
        {{
            "slide_number": 3,
            "title": "内容页标题",
            "content": "主要内容概述",
            "bullet_points": ["详细要点1", "详细要点2", "详细要点3"],
            "layout_type": "content_card"
        }}
    ]
}}

请生成5-15页幻灯片的大纲，确保覆盖文档的核心内容。请只返回JSON。"""

    COMPETITOR_ANALYSIS = """你是一个专业的竞品分析专家。请分析以下竞品信息，生成对比数据。

竞品名称：{competitor_name}
竞品URL：{url}
网页内容/描述：{content}

请按以下JSON格式返回分析结果：
{{
    "competitor_name": "竞品名称",
    "strengths": ["优势1", "优势2", "优势3"],
    "weaknesses": ["劣势1", "劣势2", "劣势3"],
    "market_position": "市场定位描述",
    "comparison_data": {{
        "pricing": "定价策略",
        "target_audience": "目标受众",
        "key_features": ["功能1", "功能2", "功能3"],
        "brand_voice": "品牌调性",
        "content_strategy": "内容策略"
    }}
}}

请只返回JSON，不要其他内容。"""

    AUDIENCE_PROFILING = """你是一个专业的市场营销专家。请根据描述生成受众画像。

用户描述：{description}

请按以下JSON格式返回受众画像：
{{
    "name": "受众群体名称",
    "age_range": "年龄范围，如：25-35岁",
    "occupation": "主要职业",
    "pain_points": ["痛点1", "痛点2", "痛点3"],
    "interests": ["兴趣1", "兴趣2", "兴趣3"],
    "preferred_content_style": "偏好的内容风格",
    "demographics": {{
        "education": "教育水平",
        "income_range": "收入范围",
        "location": "地域分布",
        "values": "价值观描述"
    }}
}}

请只返回JSON，不要其他内容。"""


# ==================== AI Analyzer ====================

class AIAnalyzer:
    """
    Phase 2.1 AI分析器

    提供文档分析、PPT大纲生成、竞品分析、受众画像等功能
    """

    def __init__(self, volc_api=None):
        """
        初始化AI分析器

        Args:
            volc_api: 火山引擎API实例，如果为None则自动获取
        """
        self._volc_api = volc_api
        self._prompt_templates = PromptTemplates()

    @property
    def volc_api(self):
        """获取火山引擎API实例（懒加载）"""
        if self._volc_api is None:
            from src.services.volc_api import get_volc_api
            self._volc_api = get_volc_api()
        return self._volc_api

    def analyze_document(self, file_path: str) -> Dict[str, Any]:
        """
        分析文档并提取关键信息

        Args:
            file_path: 文档路径（支持 .txt, .pdf, .docx）

        Returns:
            包含title, summary, key_points, keywords, metadata的字典
        """
        try:
            # 提取文档文本
            content = extract_text_from_file(file_path)

            # 截取前16000字符（防止超出模型上下文限制）
            max_chars = 16000
            if len(content) > max_chars:
                content = content[:max_chars]
                logger.warning(f"文档内容过长，已截取至{max_chars}字符")

            # 调用AI分析
            prompt = self._prompt_templates.DOCUMENT_ANALYSIS.format(content=content)
            response = self.volc_api.text_generation(
                prompt=prompt,
                temperature=0.3,
                max_tokens=2048
            )

            if not response.get("success"):
                return {
                    "success": False,
                    "error": response.get("error", "文档分析失败")
                }

            # 解析JSON结果
            result_text = response.get("content", "")
            result_data = self._parse_json(result_text)

            if result_data:
                result_data["success"] = True
                result_data["file_path"] = file_path
                result_data["file_name"] = os.path.basename(file_path)
                return result_data
            else:
                return {
                    "success": False,
                    "error": "解析分析结果失败"
                }

        except FileNotFoundError as e:
            return {
                "success": False,
                "error": str(e)
            }
        except ValueError as e:
            return {
                "success": False,
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"文档分析失败: {e}")
            return {
                "success": False,
                "error": f"文档分析失败: {str(e)}"
            }

    def generate_outline(self, key_info: Dict[str, Any], scene: str = "business") -> List[Slide]:
        """
        根据文档关键信息生成PPT大纲

        Args:
            key_info: analyze_document返回的关键信息字典
            scene: 场景类型（business/education/tech/marketing等）

        Returns:
            Slide对象列表
        """
        try:
            # 构建关键信息摘要
            key_info_str = json.dumps(key_info, ensure_ascii=False, indent=2)

            # 调用AI生成大纲
            prompt = self._prompt_templates.OUTLINE_GENERATION.format(
                scene=scene,
                key_info=key_info_str
            )
            response = self.volc_api.text_generation(
                prompt=prompt,
                temperature=0.7,
                max_tokens=4096
            )

            if not response.get("success"):
                logger.error(f"大纲生成失败: {response.get('error')}")
                return self._generate_default_outline(key_info)

            # 解析JSON结果
            result_text = response.get("content", "")
            result_data = self._parse_json(result_text)

            if result_data and "slides" in result_data:
                slides = []
                for slide_data in result_data["slides"]:
                    slide = Slide(
                        slide_number=slide_data.get("slide_number", 0),
                        title=slide_data.get("title", ""),
                        content=slide_data.get("content", ""),
                        bullet_points=slide_data.get("bullet_points", []),
                        layout_type=slide_data.get("layout_type", "content_card"),
                        notes=slide_data.get("notes")
                    )
                    slides.append(slide)
                return slides
            else:
                return self._generate_default_outline(key_info)

        except Exception as e:
            logger.error(f"大纲生成失败: {e}")
            return self._generate_default_outline(key_info)

    def competitor_analysis(self, url: str, competitor_name: Optional[str] = None) -> Dict[str, Any]:
        """
        分析竞品URL并生成对比数据

        Args:
            url: 竞品URL
            competitor_name: 竞品名称（可选）

        Returns:
            竞品分析结果字典
        """
        try:
            # 如果没有提供竞品名称，从URL推断
            if not competitor_name:
                competitor_name = self._extract_domain_name(url)

            # 获取网页内容（简化处理，实际应使用爬虫）
            content = self._fetch_url_content(url)

            # 调用AI分析
            prompt = self._prompt_templates.COMPETITOR_ANALYSIS.format(
                competitor_name=competitor_name,
                url=url,
                content=content[:8000] if content else ""
            )
            response = self.volc_api.text_generation(
                prompt=prompt,
                temperature=0.5,
                max_tokens=2048
            )

            if not response.get("success"):
                return {
                    "success": False,
                    "error": response.get("error", "竞品分析失败")
                }

            # 解析JSON结果
            result_text = response.get("content", "")
            result_data = self._parse_json(result_text)

            if result_data:
                result_data["success"] = True
                result_data["url"] = url
                return result_data
            else:
                return {
                    "success": False,
                    "error": "解析竞品分析结果失败"
                }

        except Exception as e:
            logger.error(f"竞品分析失败: {e}")
            return {
                "success": False,
                "error": f"竞品分析失败: {str(e)}"
            }

    def audience_profiling(self, description: str) -> Dict[str, Any]:
        """
        根据用户描述生成受众画像

        Args:
            description: 受众描述

        Returns:
            受众画像字典
        """
        try:
            # 调用AI生成画像
            prompt = self._prompt_templates.AUDIENCE_PROFILING.format(
                description=description
            )
            response = self.volc_api.text_generation(
                prompt=prompt,
                temperature=0.7,
                max_tokens=2048
            )

            if not response.get("success"):
                return {
                    "success": False,
                    "error": response.get("error", "受众画像生成失败")
                }

            # 解析JSON结果
            result_text = response.get("content", "")
            result_data = self._parse_json(result_text)

            if result_data:
                result_data["success"] = True
                result_data["description"] = description
                return result_data
            else:
                return {
                    "success": False,
                    "error": "解析受众画像结果失败"
                }

        except Exception as e:
            logger.error(f"受众画像生成失败: {e}")
            return {
                "success": False,
                "error": f"受众画像生成失败: {str(e)}"
            }

    # ==================== Helper Methods ====================

    def _parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        """安全解析JSON"""
        text = text.strip()

        # 尝试直接解析
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 尝试提取 ```json ... ``` 块
        match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # 尝试提取第一个 { ... }
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass

        return None

    def _extract_domain_name(self, url: str) -> str:
        """从URL提取域名作为竞品名称"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc
            if domain.startswith("www."):
                domain = domain[4:]
            # 取第一部分作为名称
            name = domain.split(".")[0]
            return name.capitalize() if name else "Unknown"
        except Exception:
            return "Unknown"

    def _fetch_url_content(self, url: str) -> str:
        """
        获取URL内容（简化实现）

        实际生产环境应使用专业的爬虫框架
        """
        try:
            import requests
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; RabAiMindBot/1.0)"
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            # 简单提取正文文本
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, "html.parser")

            # 移除脚本和样式
            for script in soup(["script", "style"]):
                script.decompose()

            text = soup.get_text(separator="\n", strip=True)
            # 清理空行
            lines = [line for line in text.split("\n") if line.strip()]
            return "\n".join(lines[:200])  # 限制行数
        except Exception as e:
            logger.warning(f"获取URL内容失败: {e}")
            return f"无法获取URL内容: {str(e)}"

    def _generate_default_outline(self, key_info: Dict[str, Any]) -> List[Slide]:
        """生成默认大纲（当AI生成失败时）"""
        title = key_info.get("title", "PPT主题")
        key_points = key_info.get("key_points", [])

        return [
            Slide(
                slide_number=1,
                title=title,
                content="",
                bullet_points=[],
                layout_type="title_slide"
            ),
            Slide(
                slide_number=2,
                title="目录",
                content="内容概览",
                bullet_points=["概述", "详细内容", "总结"],
                layout_type="toc"
            ),
            Slide(
                slide_number=3,
                title="概述",
                content=key_info.get("summary", ""),
                bullet_points=key_points[:3] if key_points else [],
                layout_type="content_card"
            ),
            Slide(
                slide_number=4,
                title="详细内容",
                content="核心要点",
                bullet_points=key_points[3:] if len(key_points) > 3 else key_points,
                layout_type="content_card"
            ),
            Slide(
                slide_number=5,
                title="总结",
                content="关键结论",
                bullet_points=["要点总结"],
                layout_type="thank_you"
            )
        ]


# ==================== Global Instance ====================

_ai_analyzer_instance: Optional[AIAnalyzer] = None


def get_ai_analyzer() -> AIAnalyzer:
    """获取AIAnalyzer单例实例"""
    global _ai_analyzer_instance
    if _ai_analyzer_instance is None:
        _ai_analyzer_instance = AIAnalyzer()
    return _ai_analyzer_instance


# 导出
__all__ = [
    "AIAnalyzer",
    "Slide",
    "KeyInfo",
    "AudiencePersona",
    "CompetitorAnalysis",
    "get_ai_analyzer",
    "extract_text_from_file"
]