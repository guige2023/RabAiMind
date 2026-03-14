"""文件相关Pydantic模型"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """文件上传响应"""
    etag: str = Field(..., description="文件ETag")
    object_key: str = Field(..., description="BOS对象键")
    file_url: str = Field(..., description="文件访问URL")
    content_type: str = Field(..., description="内容类型")
    metadata: dict = Field(default_factory=dict, description="自定义元数据")
    uploaded_at: datetime = Field(default_factory=datetime.now, description="上传时间")


class FileMetadataResponse(BaseModel):
    """文件元数据响应"""
    object_key: str = Field(..., description="BOS对象键")
    content_length: int = Field(..., description="文件大小")
    content_type: str = Field(..., description="内容类型")
    etag: str = Field(..., description="文件ETag")
    last_modified: Optional[str] = Field(None, description="最后修改时间")
    metadata: dict = Field(default_factory=dict, description="自定义元数据")


class FileListItem(BaseModel):
    """文件列表项"""
    key: str = Field(..., description="对象键")
    size: int = Field(..., description="文件大小")
    etag: str = Field(..., description="文件ETag")
    last_modified: Optional[str] = Field(None, description="最后修改时间")


class FileListResponse(BaseModel):
    """文件列表响应"""
    files: List[FileListItem] = Field(default_factory=list, description="文件列表")
    total: int = Field(..., description="文件总数")


class FileDeleteResponse(BaseModel):
    """文件删除响应"""
    success: bool = Field(..., description="是否删除成功")
    object_key: str = Field(..., description="删除的对象键")


class PresignedUrlResponse(BaseModel):
    """预签名URL响应"""
    url: str = Field(..., description="预签名URL")
    object_key: str = Field(..., description="BOS对象键")
    expires_in: int = Field(..., description="过期时间（秒）")


class FileCopyResponse(BaseModel):
    """文件复制响应"""
    source_key: str = Field(..., description="源对象键")
    dest_key: str = Field(..., description="目标对象键")
    etag: str = Field(..., description="新文件ETag")


# Request models
class GeneratePresignedUrlRequest(BaseModel):
    """生成预签名URL请求"""
    object_key: str = Field(..., description="BOS对象键")
    expires_in: int = Field(default=3600, ge=60, le=86400, description="过期时间（秒）")


class FileCopyRequest(BaseModel):
    """文件复制请求"""
    source_key: str = Field(..., description="源对象键")
    dest_key: str = Field(..., description="目标对象键")


class FileDeleteRequest(BaseModel):
    """文件删除请求"""
    object_key: str = Field(..., description="BOS对象键")
