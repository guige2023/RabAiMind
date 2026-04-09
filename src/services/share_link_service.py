"""
Share Link Service — PPT分享链接生成与管理
Phase 2.1: 分享链接功能

支持:
- 生成分享链接/分享码
- 分享有效期控制
- QR二维码生成
"""

import base64
import io
import json
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any

try:
    from PIL import Image
    from qrcode import QRCode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

SHARE_LINK_DIR = Path(__file__).parent.parent.parent / "data" / "share_links"
SHARE_LINK_DIR.mkdir(parents=True, exist_ok=True)


class SharePermission(str, Enum):
    VIEW = "view"       # 仅查看
    COMMENT = "comment"  # 查看+评论
    EDIT = "edit"       # 查看+编辑
    DOWNLOAD = "download"  # 查看+下载


@dataclass
class ShareLink:
    """分享链接数据模型"""
    share_id: str           # UUID格式的唯一ID
    ppt_id: str             # 关联的PPT ID
    ppt_title: str          # PPT标题
    share_code: str         # 短分享码 (8位)
    permission: str = SharePermission.VIEW.value  # 权限级别
    owner_id: str = "default"  # 所有者ID
    created_at: str = ""    # 创建时间
    expires_at: str = ""    # 过期时间 (空表示永不过期)
    access_count: int = 0   # 访问次数
    is_active: bool = True  # 是否激活
    password: str = ""      # 密码保护 (可选)
    qr_code_data: str = ""  # QR码Base64数据

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "ShareLink":
        return cls(**d)

    def is_expired(self) -> bool:
        """检查链接是否已过期"""
        if not self.expires_at:
            return False
        try:
            expires = datetime.fromisoformat(self.expires_at)
            return datetime.now() > expires
        except (ValueError, TypeError):
            return False


def _generate_share_code() -> str:
    """生成8位短分享码"""
    return uuid.uuid4().hex[:8]


def _load_share_links() -> dict[str, ShareLink]:
    """加载所有分享链接"""
    fpath = SHARE_LINK_DIR / "share_links.json"
    if not fpath.exists():
        return {}
    try:
        with open(fpath, encoding="utf-8") as f:
            data = json.load(f)
            return {k: ShareLink.from_dict(v) for k, v in data.items()}
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _save_share_links(links: dict[str, ShareLink]) -> None:
    """保存分享链接到文件"""
    fpath = SHARE_LINK_DIR / "share_links.json"
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump({k: v.to_dict() for k, v in links.items()}, f, ensure_ascii=False, indent=2)


def _generate_qr_code(data: str) -> str | None:
    """生成QR码并返回Base64编码"""
    if not HAS_QRCODE:
        return None
    try:
        qr = QRCode(version=1, box_size=10, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode()
    except Exception:
        return None


class ShareLinkService:
    """分享链接服务"""

    def create_share_link(
        self,
        ppt_id: str,
        ppt_title: str,
        owner_id: str = "default",
        permission: str = SharePermission.VIEW.value,
        expires_in_hours: int | None = None,
        password: str = "",
    ) -> ShareLink:
        """
        创建分享链接
        
        Args:
            ppt_id: PPT任务ID
            ppt_title: PPT标题
            owner_id: 所有者ID
            permission: 权限级别
            expires_in_hours: 过期小时数 (None=永不过期)
            password: 密码保护 (可选)
        
        Returns:
            ShareLink: 分享链接对象
        """
        share_id = str(uuid.uuid4())
        share_code = _generate_share_code()
        created_at = datetime.now().isoformat()

        expires_at = ""
        if expires_in_hours is not None and expires_in_hours > 0:
            expires_at = (datetime.now() + timedelta(hours=expires_in_hours)).isoformat()

        # 生成分享URL
        share_url = f"/share/{share_code}"

        link = ShareLink(
            share_id=share_id,
            ppt_id=ppt_id,
            ppt_title=ppt_title,
            share_code=share_code,
            permission=permission,
            owner_id=owner_id,
            created_at=created_at,
            expires_at=expires_at,
            is_active=True,
            password=password,
        )

        # 生成QR码
        if HAS_QRCODE:
            link.qr_code_data = _generate_qr_code(share_url) or ""

        # 保存
        links = _load_share_links()
        links[share_id] = link
        _save_share_links(links)

        return link

    def get_share_link(self, share_id: str) -> ShareLink | None:
        """通过share_id获取分享链接"""
        links = _load_share_links()
        return links.get(share_id)

    def get_by_code(self, share_code: str) -> ShareLink | None:
        """通过分享码获取分享链接"""
        links = _load_share_links()
        for link in links.values():
            if link.share_code == share_code:
                return link
        return None

    def verify_share_access(
        self,
        share_code: str,
        password: str = ""
    ) -> dict[str, Any]:
        """
        验证分享访问权限
        
        Returns:
            dict: {
                "valid": bool,
                "error": str,
                "link": ShareLink or None,
                "ppt_id": str,
                "requires_password": bool
            }
        """
        link = self.get_by_code(share_code)

        if not link:
            return {"valid": False, "error": "分享链接不存在", "link": None, "ppt_id": "", "requires_password": False}

        if not link.is_active:
            return {"valid": False, "error": "分享链接已被禁用", "link": None, "ppt_id": "", "requires_password": False}

        if link.is_expired():
            return {"valid": False, "error": "分享链接已过期", "link": None, "ppt_id": "", "requires_password": False}

        if link.password and link.password != password:
            return {
                "valid": False,
                "error": "需要密码访问",
                "link": link,
                "ppt_id": link.ppt_id,
                "requires_password": True
            }

        # 增加访问计数
        link.access_count += 1
        links = _load_share_links()
        links[link.share_id] = link
        _save_share_links(links)

        return {
            "valid": True,
            "error": "",
            "link": link,
            "ppt_id": link.ppt_id,
            "requires_password": bool(link.password)
        }

    def record_access(self, share_code: str) -> None:
        """记录分享链接访问"""
        link = self.get_by_code(share_code)
        if link:
            link.access_count += 1
            links = _load_share_links()
            links[link.share_id] = link
            _save_share_links(links)

    def list_user_links(self, owner_id: str) -> list[ShareLink]:
        """列出用户的所有分享链接"""
        links = _load_share_links()
        return [l for l in links.values() if l.owner_id == owner_id]

    def deactivate_link(self, share_id: str, owner_id: str) -> bool:
        """禁用分享链接"""
        links = _load_share_links()
        link = links.get(share_id)
        if link and link.owner_id == owner_id:
            link.is_active = False
            links[share_id] = link
            _save_share_links(links)
            return True
        return False

    def update_link(
        self,
        share_id: str,
        owner_id: str,
        expires_in_hours: int | None = None,
        permission: str | None = None,
        password: str | None = None,
    ) -> ShareLink | None:
        """更新分享链接设置"""
        links = _load_share_links()
        link = links.get(share_id)
        if not link or link.owner_id != owner_id:
            return None

        if expires_in_hours is not None:
            if expires_in_hours <= 0:
                link.expires_at = ""
            else:
                link.expires_at = (datetime.now() + timedelta(hours=expires_in_hours)).isoformat()

        if permission is not None:
            link.permission = permission

        if password is not None:
            link.password = password

        links[share_id] = link
        _save_share_links(links)
        return link

    def delete_link(self, share_id: str, owner_id: str) -> bool:
        """删除分享链接"""
        links = _load_share_links()
        link = links.get(share_id)
        if link and link.owner_id == owner_id:
            del links[share_id]
            _save_share_links(links)
            return True
        return False

    def get_link_analytics(self, share_id: str, owner_id: str) -> dict[str, Any] | None:
        """获取分享链接统计"""
        links = _load_share_links()
        link = links.get(share_id)
        if not link or link.owner_id != owner_id:
            return None

        return {
            "share_id": link.share_id,
            "share_code": link.share_code,
            "ppt_id": link.ppt_id,
            "ppt_title": link.ppt_title,
            "permission": link.permission,
            "access_count": link.access_count,
            "created_at": link.created_at,
            "expires_at": link.expires_at,
            "is_active": link.is_active,
            "is_expired": link.is_expired(),
        }


# 全局单例
_svc = ShareLinkService()


def get_share_link_service() -> ShareLinkService:
    return _svc
