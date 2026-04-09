"""
品牌资产服务 - 多品牌资产管理

支持企业用户管理多个品牌资产（Logo、配色、字体）

作者: Claude
日期: 2026-04-09
"""

import base64
import json
import logging
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from ..utils import get_timestamp

logger = logging.getLogger(__name__)

# 品牌资产存储目录
BRAND_ASSETS_DIR = Path(__file__).parent.parent / "data" / "brand_assets"
BRAND_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

# Logo 存储目录
LOGO_STORAGE_DIR = Path(__file__).parent.parent / "static" / "uploads" / "brand_logos"
LOGO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class BrandAsset:
    """品牌资产"""
    brand_id: str = ""
    user_id: str = ""
    name: str = ""
    logo_url: str | None = None  # 上传后OSS URL或本地路径
    primary_color: str = "#165DFF"       # #165DFF 格式
    secondary_color: str = "#0E42D2"
    font_family: str = "思源黑体"         # "思源黑体" 等
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "BrandAsset":
        defaults = {
            "brand_id": "", "user_id": "", "name": "",
            "logo_url": None, "primary_color": "#165DFF",
            "secondary_color": "#0E42D2", "font_family": "思源黑体",
            "created_at": "", "updated_at": ""
        }
        for k, v in defaults.items():
            if k not in data:
                data[k] = v
        return cls(**data)


class BrandService:
    """品牌资产管理服务"""

    def __init__(self):
        self.assets_dir = BRAND_ASSETS_DIR
        self.assets_dir.mkdir(parents=True, exist_ok=True)
        self._index_file = self.assets_dir / "index.json"
        self._load_index()

    def _load_index(self) -> None:
        """加载品牌索引"""
        if self._index_file.exists():
            try:
                self._brands_index = json.loads(self._index_file.read_text())
            except Exception:
                self._brands_index = {}
        else:
            self._brands_index = {}

    def _save_index(self) -> None:
        """保存品牌索引"""
        self._index_file.write_text(json.dumps(self._brands_index, ensure_ascii=False, indent=2))

    def _get_brand_file(self, brand_id: str) -> Path:
        """获取品牌数据文件路径"""
        return self.assets_dir / f"{brand_id}.json"

    def _ensure_user_index(self, user_id: str) -> list[str]:
        """确保用户索引存在"""
        if user_id not in self._brands_index:
            self._brands_index[user_id] = []
        return self._brands_index[user_id]

    # ========== CRUD 操作 ==========

    def create_brand(
        self,
        user_id: str,
        name: str,
        primary_color: str = "#165DFF",
        secondary_color: str = "#0E42D2",
        font_family: str = "思源黑体",
        logo_url: str | None = None
    ) -> BrandAsset:
        """创建品牌资产"""
        brand_id = f"brand_{uuid.uuid4().hex[:12]}"
        now = get_timestamp()

        brand = BrandAsset(
            brand_id=brand_id,
            user_id=user_id,
            name=name,
            logo_url=logo_url,
            primary_color=primary_color,
            secondary_color=secondary_color,
            font_family=font_family,
            created_at=now,
            updated_at=now
        )

        # 保存品牌数据
        brand_file = self._get_brand_file(brand_id)
        brand_file.write_text(json.dumps(brand.to_dict(), ensure_ascii=False, indent=2))

        # 更新索引
        user_brands = self._ensure_user_index(user_id)
        user_brands.append(brand_id)
        self._save_index()

        logger.info(f"Created brand: {brand_id} for user: {user_id}")
        return brand

    def get_brand(self, brand_id: str) -> BrandAsset | None:
        """获取单个品牌"""
        brand_file = self._get_brand_file(brand_id)
        if not brand_file.exists():
            return None
        try:
            data = json.loads(brand_file.read_text())
            return BrandAsset.from_dict(data)
        except Exception as e:
            logger.error(f"Failed to load brand {brand_id}: {e}")
            return None

    def get_user_brands(self, user_id: str) -> list[BrandAsset]:
        """获取用户所有品牌"""
        brand_ids = self._brands_index.get(user_id, [])
        brands = []
        for brand_id in brand_ids:
            brand = self.get_brand(brand_id)
            if brand:
                brands.append(brand)
        return brands

    def update_brand(
        self,
        brand_id: str,
        name: str | None = None,
        primary_color: str | None = None,
        secondary_color: str | None = None,
        font_family: str | None = None,
        logo_url: str | None = None
    ) -> BrandAsset | None:
        """更新品牌资产"""
        brand = self.get_brand(brand_id)
        if not brand:
            return None

        if name is not None:
            brand.name = name
        if primary_color is not None:
            brand.primary_color = primary_color
        if secondary_color is not None:
            brand.secondary_color = secondary_color
        if font_family is not None:
            brand.font_family = font_family
        if logo_url is not None:
            brand.logo_url = logo_url

        brand.updated_at = get_timestamp()

        # 保存更新
        brand_file = self._get_brand_file(brand_id)
        brand_file.write_text(json.dumps(brand.to_dict(), ensure_ascii=False, indent=2))

        logger.info(f"Updated brand: {brand_id}")
        return brand

    def delete_brand(self, brand_id: str) -> bool:
        """删除品牌资产"""
        brand = self.get_brand(brand_id)
        if not brand:
            return False

        # 删除品牌文件
        brand_file = self._get_brand_file(brand_id)
        if brand_file.exists():
            brand_file.unlink()

        # 删除 Logo 文件（如果存在且是本地文件）
        if brand.logo_url and brand.logo_url.startswith("/static"):
            logo_path = Path(__file__).parent.parent.parent / brand.logo_url.lstrip("/")
            if logo_path.exists():
                logo_path.unlink()

        # 更新索引
        user_id = brand.user_id
        if user_id in self._brands_index:
            self._brands_index[user_id] = [bid for bid in self._brands_index[user_id] if bid != brand_id]
            self._save_index()

        logger.info(f"Deleted brand: {brand_id}")
        return True

    # ========== Logo 上传 ==========

    def save_logo(self, brand_id: str, logo_data: str) -> str | None:
        """保存 Logo，返回存储路径或URL

        Args:
            brand_id: 品牌ID
            logo_data: base64 编码的图片数据或 data URI

        Returns:
            Logo 的访问 URL
        """
        # 解析 base64 数据
        if logo_data.startswith("data:"):
            import re
            match = re.search(r'data:image/[^;]+;base64,(.+)', logo_data)
            if match:
                logo_data = match.group(1)

        try:
            binary = base64.b64decode(logo_data + "==")
        except Exception as e:
            logger.error(f"Failed to decode logo data: {e}")
            return None

        # 确定文件扩展名
        ext = "png"
        try:
            import io

            from PIL import Image
            img = Image.open(io.BytesIO(binary))
            if img.format:
                ext = img.format.lower()
                if ext == "jpeg":
                    ext = "jpg"
        except ImportError:
            pass

        # 生成文件名
        filename = f"{brand_id}_logo.{ext}"
        logo_path = LOGO_STORAGE_DIR / filename

        # 保存文件
        try:
            with open(logo_path, "wb") as f:
                f.write(binary)
        except Exception as e:
            logger.error(f"Failed to save logo: {e}")
            return None

        # 返回相对URL（相对于 static 目录）
        logo_url = f"/static/uploads/brand_logos/{filename}"

        # 更新品牌 Logo URL
        self.update_brand(brand_id, logo_url=logo_url)

        logger.info(f"Saved logo for brand: {brand_id} -> {logo_url}")
        return logo_url

    # ========== 品牌应用 ==========

    def apply_brand_to_ppt(self, brand_id: str, task_id: str) -> dict[str, Any] | None:
        """将品牌应用到 PPT 任务

        1. 获取任务信息
        2. 修改 PPT 主题色
        3. 替换 Logo 位置
        4. 应用指定字体

        Returns:
            更新后的主题配置
        """
        from ..services.task_manager import get_task_manager

        brand = self.get_brand(brand_id)
        if not brand:
            logger.error(f"Brand not found: {brand_id}")
            return None

        tm = get_task_manager()
        task = tm.get_task(task_id)
        if not task:
            logger.error(f"Task not found: {task_id}")
            return None

        # 构建品牌主题配置
        brand_theme = {
            "primary_color": brand.primary_color,
            "secondary_color": brand.secondary_color,
            "font_family": brand.font_family,
            "logo_url": brand.logo_url,
            "brand_id": brand.brand_id,
            "brand_name": brand.name,
            "use_brand": True
        }

        # 更新任务主题配置
        task_result = task.get("result", {})
        if "theme" not in task_result:
            task_result["theme"] = {}

        task_result["theme"].update(brand_theme)
        task["result"] = task_result

        # 更新任务
        tm.update_task(task_id, task)

        logger.info(f"Applied brand {brand_id} to task {task_id}")

        return brand_theme

    def get_brand_preview(self, brand_id: str) -> dict[str, Any] | None:
        """获取品牌预览数据"""
        brand = self.get_brand(brand_id)
        if not brand:
            return None

        return {
            "brand_id": brand.brand_id,
            "name": brand.name,
            "logo_url": brand.logo_url,
            "colors": {
                "primary": brand.primary_color,
                "secondary": brand.secondary_color
            },
            "font_family": brand.font_family,
            "preview_style": {
                "background": f"linear-gradient(135deg, {brand.primary_color} 0%, {brand.secondary_color} 100%)",
                "primary_color": brand.primary_color,
                "secondary_color": brand.secondary_color,
                "font_family": brand.font_family
            }
        }


# 全局单例
_brand_service = None


def get_brand_service() -> BrandService:
    """获取品牌服务单例"""
    global _brand_service
    if _brand_service is None:
        _brand_service = BrandService()
    return _brand_service
