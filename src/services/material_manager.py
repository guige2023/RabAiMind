"""
素材管理服务
处理用户上传的素材（图片、PDF、文本等）
"""
import logging
import os
import json
import hashlib
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from ..config import settings
from ..utils import ensure_dir, get_timestamp

logger = logging.getLogger(__name__)

# 允许的文件扩展名白名单
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx', '.bmp', '.webp'}
# 最大文件大小 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024


@dataclass
class Material:
    """素材"""
    id: str
    name: str
    type: str  # image, pdf, text
    path: str
    size: int
    upload_time: datetime
    content: Optional[str] = None  # 提取的文本内容
    description: Optional[str] = None


class MaterialManager:
    """素材管理器"""
    
    def __init__(self):
        self.material_dir = settings.MATERIAL_DIR
        ensure_dir(self.material_dir)
        
    def save_material(
        self,
        file_data: bytes,
        filename: str,
        material_type: str
    ) -> Material:
        """
        保存素材

        Args:
            file_data: 文件数据
            filename: 文件名
            material_type: 素材类型

        Returns:
            素材对象

        Raises:
            ValueError: 文件大小超限或文件名不安全
        """
        # 验证文件大小
        if len(file_data) > MAX_FILE_SIZE:
            raise ValueError(f"文件大小超过限制({MAX_FILE_SIZE // (1024*1024)}MB)")

        # 验证文件名：去除路径遍历字符，移除危险字符
        # 只保留安全的文件名（字母数字汉字下划线短横线）
        safe_filename = re.sub(r'[^\w\u4e00-\u9fff.-]', '_', filename)
        if not safe_filename or safe_filename.startswith('.'):
            safe_filename = f"material_{get_timestamp()}"

        # 生成唯一ID
        material_id = hashlib.md5(
            f"{safe_filename}{get_timestamp()}".encode()
        ).hexdigest()[:16]

        # 确定文件扩展名
        ext = os.path.splitext(safe_filename)[1].lower()
        if not ext or ext not in ALLOWED_EXTENSIONS:
            ext = self._get_extension_by_type(material_type)

        # 验证扩展名安全性
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"不支持的文件类型: {ext}")

        # 保存路径（使用安全的material_id，不使用用户提供的文件名构建路径）
        save_path = self.material_dir / f"{material_id}{ext}"
        save_path.write_bytes(file_data)

        logger.info(f"保存素材: id={material_id}, name={safe_filename}, size={len(file_data)}")

        return Material(
            id=material_id,
            name=safe_filename,
            type=material_type,
            path=str(save_path),
            size=len(file_data),
            upload_time=datetime.now()
        )
    
    def get_material(self, material_id: str) -> Optional[Material]:
        """获取素材"""
        # 验证material_id格式（只允许字母数字）
        if not re.match(r'^[a-f0-9]+$', material_id):
            logger.warning(f"无效的material_id格式: {material_id}")
            return None

        # 查找文件
        for ext in ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx']:
            path = self.material_dir / f"{material_id}{ext}"
            if path.exists():
                # 使用realpath验证路径在允许目录内（防止符号链接绕过）
                real_path = path.resolve()
                if not str(real_path).startswith(str(self.material_dir.resolve())):
                    logger.warning(f"路径遍历尝试: material_id={material_id}")
                    return None
                stat = path.stat()
                return Material(
                    id=material_id,
                    name=path.name,
                    type=self._get_type_by_extension(ext),
                    path=str(path),
                    size=stat.st_size,
                    upload_time=datetime.fromtimestamp(stat.st_ctime)
                )
        return None

    def delete_material(self, material_id: str) -> bool:
        """删除素材"""
        material = self.get_material(material_id)
        if material:
            try:
                os.remove(material.path)
                logger.info(f"删除素材: id={material_id}")
                return True
            except OSError as e:
                logger.error(f"删除素材失败: id={material_id}, error={e}")
                return False
        return False
    
    def list_materials(self, material_type: Optional[str] = None) -> List[Material]:
        """列出素材"""
        materials = []
        for path in self.material_dir.iterdir():
            if path.is_file():
                ext = path.suffix.lower()
                m_type = self._get_type_by_extension(ext)
                
                if material_type and m_type != material_type:
                    continue
                    
                stat = path.stat()
                materials.append(Material(
                    id=path.stem,
                    name=path.name,
                    type=m_type,
                    path=str(path),
                    size=stat.st_size,
                    upload_time=datetime.fromtimestamp(stat.st_ctime)
                ))
        
        return sorted(materials, key=lambda m: m.upload_time, reverse=True)
    
    def extract_text_from_image(self, material_id: str) -> str:
        """从图片提取文本（OCR）"""
        # 这里可以集成OCR服务
        # 目前返回空字符串
        material = self.get_material(material_id)
        if material and material.type == "image":
            # TODO: 集成OCR服务
            pass
        return ""
    
    def _get_extension_by_type(self, material_type: str) -> str:
        """根据类型获取扩展名"""
        mapping = {
            "image": ".jpg",
            "pdf": ".pdf",
            "text": ".txt",
            "document": ".docx"
        }
        return mapping.get(material_type, ".bin")
    
    def _get_type_by_extension(self, ext: str) -> str:
        """根据扩展名获取类型"""
        ext = ext.lower()
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
            return "image"
        elif ext == '.pdf':
            return "pdf"
        elif ext in ['.txt', '.md']:
            return "text"
        elif ext in ['.doc', '.docx']:
            return "document"
        else:
            return "other"


# 全局实例
material_manager = MaterialManager()


def get_material_manager() -> MaterialManager:
    """获取素材管理器实例"""
    return material_manager
