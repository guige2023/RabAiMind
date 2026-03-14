"""百度云BOS文件服务"""
import io
from typing import Optional, BinaryIO
from datetime import timedelta
import hashlib

from baidubce.services.bos.bos_client import BosClient
from baidubce.bce_response import BceResponse
from baidubce.exception import BceServerError, BceClientError

from app.core.config import settings


class BOSService:
    """百度云BOS文件服务"""
    
    def __init__(self):
        """初始化BOS客户端"""
        self.bos_client = None
        self.bucket_name = settings.bos_bucket_name
        self._initialize_client()
    
    def _initialize_client(self):
        """初始化BOS客户端"""
        if not settings.bos_endpoint or not settings.bos_access_key_id:
            return
        
        config = {
            'credentials': {
                'access_key_id': settings.bos_access_key_id,
                'secret_access_key': settings.bos_secret_access_key
            },
            'endpoint': settings.bos_endpoint,
            'protocol': 'http',
            'connection_timeout_in_mills': 60000,
            'send_buf_size': 8192,
            'recv_buf_size': 8192,
        }
        self.bos_client = BosClient(config)
    
    def _get_full_key(self, key: str) -> str:
        """获取完整的BOS对象键"""
        if key.startswith('/'):
            key = key[1:]
        return key
    
    def upload_file(
        self, 
        file_data: BinaryIO, 
        object_key: str, 
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> dict:
        """
        上传文件到BOS
        
        Args:
            file_data: 文件数据
            object_key: BOS对象键
            content_type: 内容类型
            metadata: 自定义元数据
            
        Returns:
            上传结果，包含etag、file_url等
        """
        if not self.bos_client:
            raise RuntimeError("BOS client not initialized. Check configuration.")
        
        key = self._get_full_key(object_key)
        
        # 计算文件MD5
        file_data.seek(0)
        content_md5 = hashlib.md5(file_data.read()).hexdigest()
        file_data.seek(0)
        
        # 设置元数据
        headers = {
            'Content-Type': content_type,
            'Content-MD5': content_md5,
        }
        if metadata:
            for k, v in metadata.items():
                headers[f'x-bce-meta-{k}'] = str(v)
        
        # 上传文件
        response = self.bos_client.put_object(
            bucket=self.bucket_name,
            key=key,
            content=file_data,
            headers=headers
        )
        
        return {
            'etag': response.metadata.get('etag', ''),
            'object_key': key,
            'file_url': f"https://{self.bucket_name}.{settings.bos_endpoint.replace('https://', '')}/{key}",
            'content_type': content_type,
            'metadata': metadata or {}
        }
    
    def download_file(self, object_key: str) -> bytes:
        """
        从BOS下载文件
        
        Args:
            object_key: BOS对象键
            
        Returns:
            文件内容
        """
        if not self.bos_client:
            raise RuntimeError("BOS client not initialized. Check configuration.")
        
        key = self._get_full_key(object_key)
        
        response = self.bos_client.get_object(
            bucket=self.bucket_name,
            key=key
        )
        
        # 读取内容
        content = b''
        for data in response.data_stream:
            content += data
        
        return content
    
    def get_object_metadata(self, object_key: str) -> dict:
        """
        获取对象元数据
        
        Args:
            object_key: BOS对象键
            
        Returns:
            元数据字典
        """
        if not self.bos_client:
            raise RuntimeError("BOS client not initialized. Check configuration.")
        
        key = self._get_full_key(object_key)
        
        response = self.bos_client.head_object(
            bucket=self.bucket_name,
            key=key
        )
        
        return {
            'content_length': response.metadata.get('content_length', 0),
            'content_type': response.metadata.get('content_type', ''),
            'etag': response.metadata.get('etag', ''),
            'last_modified': response.metadata.get('last_modified', ''),
            'metadata': response.metadata.get('meta', {})
        }
    
    def delete_file(self, object_key: str) -> bool:
        """
        删除BOS对象
        
        Args:
            object_key: BOS对象键
            
        Returns:
            是否删除成功
        """
        if not self.bos_client:
            raise RuntimeError("BOS client not initialized. Check configuration.")
        
        key = self._get_full_key(object_key)
        
        self.bos_client.delete_object(
            bucket=self.bucket_name,
            key=key
        )
        
        return True
    
    def list_files(self, prefix: str = "", max_keys: int = 1000) -> list:
        """
        列出BOS对象
        
        Args:
            prefix: 前缀过滤
            max_keys: 最大返回数量
            
        Returns:
            对象列表
        """
        if not self.bos_client:
            raise RuntimeError("BOS client not initialized. Check configuration.")
        
        response = self.bos_client.list_objects(
            bucket=self.bucket_name,
            prefix=prefix,
            max_keys=max_keys
        )
        
        files = []
        for obj in response.contents:
            files.append({
                'key': obj.key,
                'size': obj.size,
                'etag': obj.etag,
                'last_modified': str(obj.last_modified) if obj.last_modified else None
            })
        
        return files
    
    def generate_presigned_url(
        self, 
        object_key: str, 
        expires_in_seconds: int = 3600
    ) -> str:
        """
        生成预签名URL（用于临时访问）
        
        Args:
            object_key: BOS对象键
            expires_in_seconds: 过期时间（秒）
            
        Returns:
            预签名URL
        """
        if not self.bos_client:
            raise RuntimeError("BOS client not initialized. Check configuration.")
        
        key = self._get_full_key(object_key)
        
        # 生成带签名的URL
        url = self.bos_client.generate_pre_signed_url(
            bucket=self.bucket_name,
            key=key,
            expiration=expires_in_seconds
        )
        
        return url
    
    def copy_file(self, source_key: str, dest_key: str) -> dict:
        """
        复制BOS对象
        
        Args:
            source_key: 源对象键
            dest_key: 目标对象键
            
        Returns:
            复制结果
        """
        if not self.bos_client:
            raise RuntimeError("BOS client not initialized. Check configuration.")
        
        source = f"{self.bucket_name}/{self._get_full_key(source_key)}"
        dest = self._get_full_key(dest_key)
        
        response = self.bos_client.copy_object(
            bucket=self.bucket_name,
            key=dest,
            source_bucket=self.bucket_name,
            source_key=source
        )
        
        return {
            'source_key': source_key,
            'dest_key': dest_key,
            'etag': response.metadata.get('etag', '')
        }


# 全局服务实例
bos_service = BOSService()
