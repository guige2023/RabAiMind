# -*- coding: utf-8 -*-
"""
数据模型定义

作者: Claude
日期: 2026-03-17
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


# ==================== 枚举类型 ====================

class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SceneType(str, Enum):
    """场景类型"""
    BUSINESS = "business"
    EDUCATION = "education"
    TECH = "tech"
    CREATIVE = "creative"


class StyleType(str, Enum):
    """风格类型"""
    PROFESSIONAL = "professional"
    SIMPLE = "simple"
    ENERGETIC = "energetic"
    PREMIUM = "premium"


class TemplateType(str, Enum):
    """模板类型"""
    DEFAULT = "default"
    MODERN = "modern"
    CLASSIC = "classic"
    TECH = "tech"


# ==================== 请求模型 ====================

class GenerateRequest(BaseModel):
    """PPT生成请求"""
    user_request: str = Field(..., min_length=10, max_length=2000, description="用户需求描述")
    slide_count: int = Field(default=10, ge=5, le=30, description="幻灯片数量")
    scene: SceneType = Field(default=SceneType.BUSINESS, description="场景类型")
    style: StyleType = Field(default=StyleType.PROFESSIONAL, description="风格类型")
    template: TemplateType = Field(default=TemplateType.DEFAULT, description="模板类型")
    theme_color: str = Field(default="#165DFF", description="主题色")


# ==================== 响应模型 ====================

class TaskResult(BaseModel):
    """任务结果"""
    pptx_path: str
    slide_count: int
    file_size: int = 0
    compression_ratio: float = 0.0


class TaskError(BaseModel):
    """任务错误"""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class GenerateResponse(BaseModel):
    """生成响应"""
    success: bool
    task_id: str
    status: TaskStatus
    message: str
    request_id: Optional[str] = None
    estimated_time: Optional[int] = None


class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    success: bool
    task_id: str
    status: TaskStatus
    progress: int = Field(default=0, ge=0, le=100)
    current_step: str = ""
    created_at: str
    updated_at: str
    result: Optional[TaskResult] = None
    error: Optional[TaskError] = None


# ==================== 数据模型 ====================

class SlideData(BaseModel):
    """幻灯片数据"""
    index: int
    title: str
    content: str
    image_url: Optional[str] = None
    svg_content: Optional[str] = None


class PPTData(BaseModel):
    """PPT数据"""
    task_id: str
    user_request: str
    slides: List[SlideData]
    scene: SceneType
    style: StyleType
    template: TemplateType
    theme_color: str


# ==================== 配置模型 ====================

class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    service: str
    version: str = "1.0.0"


class APIInfo(BaseModel):
    """API信息"""
    name: str
    version: str
    features: List[str]
