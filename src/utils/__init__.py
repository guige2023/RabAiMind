# -*- coding: utf-8 -*-
"""
通用工具函数

作者: Claude
日期: 2026-03-17
"""

import os
import uuid
import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path


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


# ==================== 时间工具 ====================

def get_timestamp() -> str:
    """获取当前时间戳"""
    return datetime.now().isoformat()


def format_datetime(dt: datetime = None, fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    """格式化时间"""
    if dt is None:
        dt = datetime.now()
    return dt.strftime(fmt)
