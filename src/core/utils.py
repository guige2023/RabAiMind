"""
公共工具函数模块

提供项目中通用的工具函数，避免代码重复
"""
import re
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


def parse_json_from_response(content: str) -> Optional[Dict[str, Any]]:
    """
    从 API 响应中解析 JSON
    
    支持多种格式：
    - 纯 JSON
    - ```json ... ``` 包裹的 JSON
    - ``` ... ``` 包裹的 JSON
    """
    if not content:
        return None
    
    content = content.strip()
    
    # 尝试直接解析
    if content.startswith('{') or content.startswith('['):
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
    
    # 尝试提取 ```json ... ``` 或 ``` ... ``` 中的内容
    patterns = [
        r'```json\s*([\s\S]*?)\s*```',
        r'```\s*([\s\S]*?)\s*```',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content)
        if match:
            json_str = match.group(1).strip()
            try:
                # 移除尾部逗号
                json_str = re.sub(r',\s*]', ']', json_str)
                json_str = re.sub(r',\s*}', '}', json_str)
                return json.loads(json_str)
            except json.JSONDecodeError:
                continue
    
    return None


def parse_slides_from_response(content: str) -> List[Dict[str, Any]]:
    """
    从 LLM 响应中解析幻灯片结构
    
    Args:
        content: LLM 返回的内容
        
    Returns:
        幻灯片列表，每个元素包含 type, title, content 等字段
    """
    # 尝试解析 JSON
    data = parse_json_from_response(content)
    
    if data and isinstance(data, dict):
        slides = data.get("slides", [])
        if slides:
            return slides
    
    # 尝试按行解析
    lines = [l.strip() for l in content.split("\n") if l.strip()]
    slides = []
    current = None
    
    for line in lines:
        # 识别标题行（数字开头或 # 开头）
        if line and (line[0].isdigit() or line.startswith("#")):
            if current:
                slides.append(current)
            title = line.lstrip("0123456789.# ").strip()
            current = {"type": "content", "title": title, "content": []}
        elif current and len(line) > 10:
            current["content"].append(line)
    
    if current:
        slides.append(current)
    
    if slides:
        return slides
    
    # 返回默认结构
    logger.warning("无法解析幻灯片结构，使用默认值")
    return [
        {"type": "title_slide", "title": "演示文稿", "content": ["根据用户需求生成的演示文稿"]},
        {"type": "content", "title": "目录", "content": ["第一部分", "第二部分", "第三部分"]},
        {"type": "content", "title": "内容", "content": ["核心内容"]},
    ]


def escape_html(text: str) -> str:
    """转义 HTML 特殊字符，防止 XSS"""
    if not text:
        return ""
    return (text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
        .replace("`", "&#96;")
        .replace("\\", "&#92;"))


def escape_url(url: str) -> str:
    """转义 URL 中的特殊字符，防止 XSS"""
    if not url:
        return ""
    return (url
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
        .replace("<", "&lt;")
        .replace(">", "&gt;"))


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """截断文本到指定长度"""
    if not text or len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def sanitize_filename(filename: str) -> str:
    """清理文件名，移除不安全字符"""
    # 移除路径分隔符
    filename = filename.replace("/", "_").replace("\\", "_")
    # 移除特殊字符
    filename = re.sub(r'[<>:"|?*]', '', filename)
    # 移除开头和结尾的空格和点
    filename = filename.strip(". ")
    # 限制长度
    if len(filename) > 200:
        filename = filename[:200]
    return filename or "unnamed"


def ensure_dir(path: str) -> Path:
    """确保目录存在"""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_timestamp() -> str:
    """获取当前时间戳字符串"""
    from datetime import datetime
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def calculate_brightness(hex_color: str) -> float:
    """
    计算颜色的亮度
    
    Args:
        hex_color: 十六进制颜色（如 "165DFF" 或 "#165DFF"）
        
    Returns:
        亮度值 (0-255)
    """
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return 128  # 默认中等亮度
    
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    
    return (r * 299 + g * 587 + b * 114) / 1000


def get_contrast_color(hex_color: str) -> str:
    """
    根据背景色获取合适的文字颜色
    
    Args:
        hex_color: 背景色（十六进制）
        
    Returns:
        文字颜色（黑色或白色）
    """
    brightness = calculate_brightness(hex_color)
    return "#000000" if brightness > 128 else "#FFFFFF"


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """十六进制颜色转 RGB"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return (0, 0, 0)
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16)
    )


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """RGB 转十六进制颜色"""
    return f"#{r:02X}{g:02X}{b:02X}"


def adjust_color_brightness(hex_color: str, factor: float) -> str:
    """
    调整颜色亮度
    
    Args:
        hex_color: 十六进制颜色
        factor: 亮度因子 (>1 变亮, <1 变暗)
        
    Returns:
        调整后的十六进制颜色
    """
    r, g, b = hex_to_rgb(hex_color)
    r = min(255, max(0, int(r * factor)))
    g = min(255, max(0, int(g * factor)))
    b = min(255, max(0, int(b * factor)))
    return rgb_to_hex(r, g, b)


def setup_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """设置日志记录器"""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setLevel(level)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger
