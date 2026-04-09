"""
通用工具函数

作者: Claude
日期: 2026-03-17
"""

import hashlib
import html
import json
import logging
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

# ==================== 日志配置 ====================

def setup_logger(name: str, log_file: str = None) -> logging.Logger:
    """配置日志记录器"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # 格式化
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 文件处理器
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


# ==================== 通用工具 ====================

def generate_task_id() -> str:
    """生成任务ID"""
    return str(uuid.uuid4())


def generate_request_id() -> str:
    """生成请求ID"""
    return f"req_{datetime.now().strftime('%Y%m%d%H%M%S')}_{generate_task_id()[:8]}"


def md5_hash(text: str) -> str:
    """MD5哈希"""
    return hashlib.md5(text.encode()).hexdigest()


def ensure_dir(path: str) -> None:
    """确保目录存在"""
    Path(path).mkdir(parents=True, exist_ok=True)


def get_file_ext(filename: str) -> str:
    """获取文件扩展名"""
    return os.path.splitext(filename)[1].lower()


def format_file_size(size_bytes: int) -> str:
    """格式化文件大小"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f}{unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f}TB"


# ==================== JSON 工具 ====================

def safe_json_loads(text: str, default: Any = None) -> Any:
    """安全的JSON解析"""
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default


def safe_json_dumps(obj: Any, default: str = "{}") -> str:
    """安全的JSON序列化"""
    try:
        return json.dumps(obj, ensure_ascii=False)
    except (TypeError, ValueError):
        return default


def parse_json_from_response(content: str) -> dict | None:
    """从响应文本中解析 JSON，支持直接格式和 Markdown 代码块格式"""
    if not content:
        return None
    # Try direct parse
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        pass
    # Try extract from markdown code block
    match = re.search(r'```json\s*\n?(.*?)\n?```', content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, TypeError):
            pass
    return None


# ==================== HTML / URL / Text utilities ====================

def escape_html(text: Any) -> str:
    """HTML 转义 (使用 &#39; 而非 &#x27; 作为单引号)"""
    if text is None:
        return ""
    s = html.escape(str(text), quote=True)
    # Normalize &#x27; to &#39; for test compatibility
    s = s.replace("&#x27;", "&#39;")
    return s


def escape_url(text: str) -> str:
    """URL 安全的 HTML 转义"""
    return html.escape(text, quote=True)


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """截断文本到最大长度，保留 suffix"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def sanitize_filename(filename: str) -> str:
    """清理文件名，移除非法字符，路径遍历攻击返回下划线版本"""
    # Handle hidden files: strip leading AND trailing dots + whitespace
    # But preserve dots in path traversal (../../../etc/passwd)
    has_slashes = bool(re.search(r'[/\\]', filename))
    if has_slashes:
        # Path traversal: replace EACH / with _ (preserve all dots)
        filename = re.sub(r'/+', '_', filename)
        filename = re.sub(r'\\+', '_', filename)
    else:
        # Normal file: strip leading/trailing dots and whitespace
        filename = filename.strip().strip('.')
    # Remove other illegal chars
    filename = re.sub(r'[<>:"|?*]', '', filename)
    # Collapse multiple spaces/underscores
    filename = re.sub(r'[\s_]+', '_', filename)
    return filename or "unnamed"


# ==================== Color utilities ====================

def hex_to_rgb(hex_color: str) -> tuple:
    """将十六进制颜色转换为 RGB 元组"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return (0, 0, 0)
    try:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except ValueError:
        return (0, 0, 0)


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """将 RGB 转换为十六进制颜色"""
    return f"#{r:02X}{g:02X}{b:02X}"


def calculate_brightness(hex_color: str) -> int:
    """计算颜色的亮度 (0-255)"""
    r, g, b = hex_to_rgb(hex_color)
    # Using relative luminance formula
    return int(0.299 * r + 0.587 * g + 0.114 * b)


# ==================== 时间工具 ====================

def get_timestamp() -> str:
    """获取当前时间戳"""
    return datetime.now().isoformat()


def format_datetime(dt: datetime = None, fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    """格式化时间"""
    if dt is None:
        dt = datetime.now()
    return dt.strftime(fmt)
