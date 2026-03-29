"""
品牌中心 — 管理用户企业品牌配置

功能：
- 上传/管理 LOGO
- 设置主色/辅色/渐变色
- 配置字体
- 品牌模板生成
"""

import os
import json
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict

BRAND_DIR = Path(__file__).parent.parent / "data" / "brands"
BRAND_DIR.mkdir(parents=True, exist_ok=True)

@dataclass
class BrandProfile:
    user_id: str
    brand_name: str
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: List[str] = None
    logo_url: str = ""
    slogan: str = ""

    def __post_init__(self):
        if self.fonts is None:
            self.fonts = ["思源黑体", "Arial"]

    def to_dict(self) -> dict:
        return asdict(self)

class BrandManager:
    """品牌管理器"""

    def __init__(self):
        self.brands_dir = BRAND_DIR

    def _get_brand_file(self, user_id: str) -> Path:
        return self.brands_dir / f"{user_id}.json"

    def get_brand(self, user_id: str) -> Optional[BrandProfile]:
        """获取用户品牌配置"""
        path = self._get_brand_file(user_id)
        if not path.exists():
            return None
        data = json.loads(path.read_text())
        return BrandProfile(**data)

    def save_brand(self, brand: BrandProfile) -> None:
        """保存品牌配置"""
        path = self._get_brand_file(brand.user_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(brand.to_dict(), ensure_ascii=False, indent=2))

    def delete_brand(self, user_id: str) -> bool:
        """删除品牌配置"""
        path = self._get_brand_file(user_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def apply_brand_to_theme(self, user_id: str, base_theme: Dict) -> Dict:
        """将品牌配置应用到主题"""
        brand = self.get_brand(user_id)
        if not brand:
            return base_theme

        return {
            **base_theme,
            "primary_color": brand.primary_color,
            "secondary_color": brand.secondary_color,
            "accent_color": brand.accent_color,
            "fonts": brand.fonts,
            "logo_url": brand.logo_url,
            "use_brand": True,
        }

# 全局单例
_brand_manager = None
def get_brand_manager() -> BrandManager:
    global _brand_manager
    if _brand_manager is None:
        _brand_manager = BrandManager()
    return _brand_manager
