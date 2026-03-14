"""文件管理API路由"""
import io
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.schemas.file import (
    FileUploadResponse,
    FileMetadataResponse,
    FileListResponse,
    FileListItem,
    FileDeleteResponse,
    PresignedUrlResponse,
    GeneratePresignedUrlRequest,
    FileCopyResponse,
    FileCopyRequest,
    FileDeleteRequest
)
from app.services.bos_service import bos_service

router = APIRouter(prefix="/files", tags=["文件管理"])


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(..., description="要上传的文件"),
    folder: str = Query("", description="存储文件夹路径"),
    metadata: Optional[str] = Query(None, description="自定义元数据（JSON字符串）")
):
    """
    上传文件到百度云BOS
    
    - **file**: 要上传的文件
    - **folder**: 存储文件夹路径（如 "images/", "documents/"）
    - **metadata**: 自定义元数据（JSON格式）
    """
    try:
        # 读取文件内容
        content = await file.read()
        file_data = io.BytesIO(content)
        
        # 构建对象键
        object_key = f"{folder}/{file.filename}" if folder else file.filename
        
        # 解析元数据
        import json
        meta_dict = {}
        if metadata:
            try:
                meta_dict = json.loads(metadata)
            except json.JSONDecodeError:
                pass
        
        # 上传到BOS
        result = bos_service.upload_file(
            file_data=file_data,
            object_key=object_key,
            content_type=file.content_type or "application/octet-stream",
            metadata=meta_dict
        )
        
        return FileUploadResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")


@router.get("/download/{object_key:path}")
async def download_file(object_key: str):
    """
    从百度云BOS下载文件
    
    - **object_key**: BOS对象键
    """
    try:
        content = bos_service.download_file(object_key)
        
        # 获取元数据用于设置content-type
        metadata = bos_service.get_object_metadata(object_key)
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=metadata.get('content_type', 'application/octet-stream'),
            headers={
                'Content-Disposition': f'attachment; filename="{object_key.split("/")[-1]}"'
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件下载失败: {str(e)}")


@router.get("/metadata/{object_key:path}", response_model=FileMetadataResponse)
async def get_file_metadata(object_key: str):
    """
    获取文件元数据
    
    - **object_key**: BOS对象键
    """
    try:
        metadata = bos_service.get_object_metadata(object_key)
        metadata['object_key'] = object_key
        return FileMetadataResponse(**metadata)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取元数据失败: {str(e)}")


@router.delete("/delete", response_model=FileDeleteResponse)
async def delete_file(request: FileDeleteRequest):
    """
    删除BOS文件
    
    - **request**: 包含object_key的请求体
    """
    try:
        success = bos_service.delete_file(request.object_key)
        return FileDeleteResponse(
            success=success,
            object_key=request.object_key
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件删除失败: {str(e)}")


@router.get("/list", response_model=FileListResponse)
async def list_files(
    prefix: str = Query("", description="前缀过滤"),
    max_keys: int = Query(1000, ge=1, le=10000, description="最大返回数量")
):
    """
    列出BOS文件
    
    - **prefix**: 前缀过滤
    - **max_keys**: 最大返回数量
    """
    try:
        files = bos_service.list_files(prefix=prefix, max_keys=max_keys)
        file_items = [FileListItem(**f) for f in files]
        return FileListResponse(
            files=file_items,
            total=len(file_items)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")


@router.post("/presigned-url", response_model=PresignedUrlResponse)
async def generate_presigned_url(request: GeneratePresignedUrlRequest):
    """
    生成预签名URL（用于临时访问）
    
    - **request**: 包含object_key和expires_in的请求体
    """
    try:
        url = bos_service.generate_presigned_url(
            object_key=request.object_key,
            expires_in_seconds=request.expires_in
        )
        return PresignedUrlResponse(
            url=url,
            object_key=request.object_key,
            expires_in=request.expires_in
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成预签名URL失败: {str(e)}")


@router.post("/copy", response_model=FileCopyResponse)
async def copy_file(request: FileCopyRequest):
    """
    复制BOS文件
    
    - **request**: 包含source_key和dest_key的请求体
    """
    try:
        result = bos_service.copy_file(
            source_key=request.source_key,
            dest_key=request.dest_key
        )
        return FileCopyResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件复制失败: {str(e)}")
