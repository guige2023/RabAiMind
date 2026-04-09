"""
Phase 2.1 AI Analysis Routes - AI分析接口

提供文档分析、PPT大纲生成、竞品分析、受众画像等API

作者: Claude
日期: 2026-04-07
"""

import logging
import os
from typing import Any

from fastapi import APIRouter, HTTPException, Request, UploadFile
from pydantic import BaseModel

from src.services.ai_analysis_service import get_ai_analysis_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["AI分析"])


# ==================== Request/Response Models ====================

class AnalyzeRequest(BaseModel):
    """文档分析请求"""
    file_path: str


class AnalyzeResponse(BaseModel):
    """文档分析响应"""
    success: bool
    title: str | None = None
    summary: str | None = None
    key_points: list[str] | None = None
    keywords: list[str] | None = None
    metadata: dict[str, Any] | None = None
    error: str | None = None


class OutlineRequest(BaseModel):
    """PPT大纲生成请求"""
    key_info: dict[str, Any]
    scene: str = "business"


class OutlineResponse(BaseModel):
    """PPT大纲生成响应"""
    success: bool
    outline: list[dict[str, Any]] | None = None
    error: str | None = None


class CompetitorRequest(BaseModel):
    """竞品分析请求"""
    url: str
    name: str | None = None


class CompetitorResponse(BaseModel):
    """竞品分析响应"""
    success: bool
    competitor_name: str | None = None
    strengths: list[str] | None = None
    weaknesses: list[str] | None = None
    market_position: str | None = None
    comparison_data: dict[str, Any] | None = None
    error: str | None = None


class AudienceRequest(BaseModel):
    """受众画像请求"""
    description: str


class AudienceResponse(BaseModel):
    """受众画像响应"""
    success: bool
    name: str | None = None
    age_range: str | None = None
    occupation: str | None = None
    pain_points: list[str] | None = None
    interests: list[str] | None = None
    preferred_content_style: str | None = None
    demographics: dict[str, Any] | None = None
    error: str | None = None


# ==================== Helper ====================

def get_service():
    """获取AI分析服务实例"""
    return get_ai_analysis_service()


# ==================== Endpoints ====================

@router.post("/analyze")
async def analyze_document(request: AnalyzeRequest):
    """
    分析文档并提取关键信息

    支持格式: .txt, .pdf, .docx

    Request Body:
        file_path: 文档路径

    Returns:
        文档分析结果（title, summary, key_points, keywords, metadata）
    """
    service = get_service()

    try:
        result = service.analyze_document(request.file_path)

        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "文档分析失败")
            }

        return {
            "success": True,
            "title": result.get("title"),
            "summary": result.get("summary"),
            "key_points": result.get("key_points", []),
            "keywords": result.get("keywords", []),
            "metadata": result.get("metadata", {})
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "NOT_FOUND", "detail": str(e)})
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": "BAD_REQUEST", "detail": str(e)})
    except Exception as e:
        logger.error(f"文档分析失败: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/analyze/upload")
async def analyze_document_upload(request: Request):
    """
    上传文件并分析文档

    支持格式: .txt, .pdf, .docx

    Form Data:
        file: 上传的文件

    Returns:
        文档分析结果
    """
    service = get_service()

    try:
        # 获取上传的文件
        form = await request.form()
        file = form.get("file")

        if not file or not isinstance(file, UploadFile):
            raise HTTPException(status_code=400, detail={"error": "BAD_REQUEST", "detail": "请上传文件"})

        # 验证文件类型
        allowed_extensions = {".txt", ".pdf", ".docx", ".doc"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式，支持: {', '.join(allowed_extensions)}"
            )

        # 读取文件内容
        file_content = await file.read()

        # 分析文档
        result = service.analyze_document_from_upload(file_content, file.filename)

        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "文档分析失败")
            }

        return {
            "success": True,
            "file_name": file.filename,
            "title": result.get("title"),
            "summary": result.get("summary"),
            "key_points": result.get("key_points", []),
            "keywords": result.get("keywords", []),
            "metadata": result.get("metadata", {})
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文档上传分析失败: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/outline")
async def generate_outline(request: OutlineRequest):
    """
    根据文档关键信息生成PPT大纲

    Request Body:
        key_info: 文档关键信息（from /analyze endpoint）
        scene: 场景类型（business/education/tech/marketing等）

    Returns:
        PPT大纲列表
    """
    service = get_service()

    try:
        # 验证scene参数
        valid_scenes = {"business", "education", "tech", "marketing", "creative", "finance", "medical", "government"}
        if request.scene not in valid_scenes:
            logger.warning(f"无效的scene参数: {request.scene}，使用默认值business")
            request.scene = "business"

        result = service.generate_outline(request.key_info, request.scene)

        return {
            "success": True,
            "outline": result
        }

    except Exception as e:
        logger.error(f"大纲生成失败: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/competitor")
async def competitor_analysis(request: CompetitorRequest):
    """
    分析竞品URL并生成对比数据

    Request Body:
        url: 竞品URL
        name: 竞品名称（可选）

    Returns:
        竞品分析结果（strengths, weaknesses, market_position, comparison_data）
    """
    service = get_service()

    try:
        # 验证URL格式
        if not request.url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail={"error": "BAD_REQUEST", "detail": "请提供有效的URL"})

        result = service.competitor_analysis(request.url, request.name)

        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "竞品分析失败")
            }

        return {
            "success": True,
            "competitor_name": result.get("competitor_name"),
            "strengths": result.get("strengths", []),
            "weaknesses": result.get("weaknesses", []),
            "market_position": result.get("market_position"),
            "comparison_data": result.get("comparison_data", {})
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"竞品分析失败: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})


@router.post("/audience")
async def audience_profiling(request: AudienceRequest):
    """
    根据用户描述生成受众画像

    Request Body:
        description: 受众描述

    Returns:
        受众画像（name, age_range, occupation, pain_points, interests等）
    """
    service = get_service()

    try:
        # 验证输入
        if not request.description or len(request.description.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="描述内容太少，请提供更详细的受众描述（至少10个字符）"
            )

        result = service.audience_profiling(request.description)

        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "受众画像生成失败")
            }

        return {
            "success": True,
            "name": result.get("name"),
            "age_range": result.get("age_range"),
            "occupation": result.get("occupation"),
            "pain_points": result.get("pain_points", []),
            "interests": result.get("interests", []),
            "preferred_content_style": result.get("preferred_content_style"),
            "demographics": result.get("demographics", {})
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"受众画像生成失败: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": str(e)})
