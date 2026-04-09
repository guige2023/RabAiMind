"""
品牌中心 — 管理用户企业品牌配置

功能：
- 上传/管理 LOGO
- 设置主色/辅色/强调色
- 配置字体
- LOGO 位置、首尾页自定义
- White-label 全站重品牌
- 从 LOGO 自动提取配色
"""

import base64
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path

BRAND_DIR = Path(__file__).parent.parent / "data" / "brands"
BRAND_DIR.mkdir(parents=True, exist_ok=True)

# LOGO 存储目录
LOGO_DIR = Path(__file__).parent.parent / "data" / "brand_logos"
LOGO_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class BrandKit:
    """品牌套件 - 一组可复用的品牌配置"""
    kit_id: str = ""
    kit_name: str = ""
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: list[str] = field(default_factory=lambda: ["思源黑体", "Arial"])
    logo_data: str = ""
    logo_position: str = "bottom-right"
    created_at: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "BrandKit":
        defaults = {"kit_id": "", "kit_name": "", "primary_color": "#165DFF",
                    "secondary_color": "#0E42D2", "accent_color": "#FF9500",
                    "fonts": ["思源黑体", "Arial"], "logo_data": "",
                    "logo_position": "bottom-right", "created_at": ""}
        for k, v in defaults.items():
            if k not in data:
                data[k] = v
        return cls(**data)


@dataclass
class BrandProfile:
    user_id: str
    brand_name: str
    primary_color: str = "#165DFF"
    secondary_color: str = "#0E42D2"
    accent_color: str = "#FF9500"
    fonts: list[str] = field(default_factory=lambda: ["思源黑体", "Arial"])
    logo_url: str = ""
    slogan: str = ""
    # R46: 扩展字段
    logo_data: str = ""            # base64 编码的 LOGO 图片
    logo_position: str = "bottom-right"  # top-left | top-right | bottom-left | bottom-right | center
    powered_by_toggle: bool = True  # 是否显示 "Powered by RabAiMind"
    footer_text: str = ""           # 自定义页脚文本
    white_label_mode: bool = False  # White-label 全站重品牌
    auto_color_detection: bool = False  # 从 LOGO 自动提取配色
    # R104: 品牌套件 & 自定义域名
    custom_domain: str = ""        # 自定义域名，如 "ppt.mydomain.com"
    brand_kits: list[BrandKit] = field(default_factory=list)  # 保存的品牌套件列表
    email_template_enabled: bool = True  # 分享邮件是否使用品牌模板
    email_tagline: str = ""       # 邮件签名语

    def __post_init__(self):
        if self.fonts is None:
            self.fonts = ["思源黑体", "Arial"]

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "BrandProfile":
        # 兼容旧数据
        defaults = {
            "logo_data": "",
            "logo_position": "bottom-right",
            "powered_by_toggle": True,
            "footer_text": "",
            "white_label_mode": False,
            "auto_color_detection": False,
            "custom_domain": "",
            "brand_kits": [],
            "email_template_enabled": True,
            "email_tagline": "",
        }
        for k, v in defaults.items():
            if k not in data:
                data[k] = v
        # 转换 brand_kits
        if "brand_kits" in data and isinstance(data["brand_kits"], list):
            data["brand_kits"] = [BrandKit.from_dict(k) if isinstance(k, dict) else k for k in data["brand_kits"]]
        return cls(**data)


class BrandManager:
    """品牌管理器"""

    def __init__(self):
        self.brands_dir = BRAND_DIR

    def _get_brand_file(self, user_id: str) -> Path:
        return self.brands_dir / f"{user_id}.json"

    def get_brand(self, user_id: str) -> BrandProfile | None:
        """获取用户品牌配置"""
        path = self._get_brand_file(user_id)
        if not path.exists():
            return None
        data = json.loads(path.read_text())
        return BrandProfile.from_dict(data)

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

    def apply_brand_to_theme(self, user_id: str, base_theme: dict) -> dict:
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
            "logo_data": brand.logo_data,
            "logo_position": brand.logo_position,
            "powered_by_toggle": brand.powered_by_toggle,
            "footer_text": brand.footer_text,
            "white_label_mode": brand.white_label_mode,
            "auto_color_detection": brand.auto_color_detection,
            "custom_domain": brand.custom_domain,
            "email_template_enabled": brand.email_template_enabled,
            "email_tagline": brand.email_tagline,
            "use_brand": True,
        }

    def save_brand_kit(self, user_id: str, kit: BrandKit) -> str:
        """保存品牌套件，返回 kit_id"""
        brand = self.get_brand(user_id)
        if not brand:
            brand = BrandProfile(user_id=user_id, brand_name="")
        import time
        if not kit.kit_id:
            kit.kit_id = f"kit_{int(time.time() * 1000)}"
            kit.created_at = time.strftime("%Y-%m-%d %H:%M:%S")
        # 更新或追加
        existing = [k for k in brand.brand_kits if k.kit_id != kit.kit_id]
        brand.brand_kits = existing + [kit]
        self.save_brand(brand)
        return kit.kit_id

    def delete_brand_kit(self, user_id: str, kit_id: str) -> bool:
        """删除品牌套件"""
        brand = self.get_brand(user_id)
        if not brand:
            return False
        brand.brand_kits = [k for k in brand.brand_kits if k.kit_id != kit_id]
        self.save_brand(brand)
        return True

    def get_brand_kits(self, user_id: str) -> list[BrandKit]:
        """获取品牌套件列表"""
        brand = self.get_brand(user_id)
        if not brand:
            return []
        return brand.brand_kits

    def apply_brand_kit(self, user_id: str, kit_id: str) -> BrandKit | None:
        """应用品牌套件到主品牌配置"""
        brand = self.get_brand(user_id)
        if not brand:
            return None
        kit = next((k for k in brand.brand_kits if k.kit_id == kit_id), None)
        if not kit:
            return None
        # 将套件颜色/字体等应用到主配置
        brand.primary_color = kit.primary_color
        brand.secondary_color = kit.secondary_color
        brand.accent_color = kit.accent_color
        brand.fonts = kit.fonts
        brand.logo_data = kit.logo_data
        brand.logo_position = kit.logo_position
        self.save_brand(brand)
        return kit

    def save_logo(self, user_id: str, logo_data: str) -> str:
        """保存 LOGO，返回存储路径"""
        # logo_data 可以是 base64 或 URL
        logo_file = LOGO_DIR / f"{user_id}_logo.png"
        if logo_data.startswith("data:"):
            # 提取 base64 内容
            import re
            match = re.search(r'data:image/[^;]+;base64,(.+)', logo_data)
            if match:
                logo_data = match.group(1)

        try:
            binary = base64.b64decode(logo_data + "==")
            with open(logo_file, "wb") as f:
                f.write(binary)
            return str(logo_file)
        except Exception:
            # 可能是 URL，下载保存
            return ""

    def get_logo_path(self, user_id: str) -> str | None:
        """获取用户 LOGO 路径"""
        logo_file = LOGO_DIR / f"{user_id}_logo.png"
        if logo_file.exists():
            return str(logo_file)
        return None


# 全局单例
_brand_manager = None
def get_brand_manager() -> BrandManager:
    global _brand_manager
    if _brand_manager is None:
        _brand_manager = BrandManager()
    return _brand_manager
