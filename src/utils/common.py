# -*- coding: utf-8 -*-
"""
Common utilities — re-exported from src.utils for backward compatibility.
"""
from . import (
    parse_json_from_response,
    escape_html,
    escape_url,
    truncate_text,
    sanitize_filename,
    hex_to_rgb,
    rgb_to_hex,
    calculate_brightness,
    setup_logger,
    generate_task_id,
    generate_request_id,
    md5_hash,
    ensure_dir,
    get_file_ext,
    format_file_size,
    safe_json_loads,
    safe_json_dumps,
    get_timestamp,
    format_datetime,
)

__all__ = [
    "parse_json_from_response",
    "escape_html",
    "escape_url",
    "truncate_text",
    "sanitize_filename",
    "hex_to_rgb",
    "rgb_to_hex",
    "calculate_brightness",
    "setup_logger",
    "generate_task_id",
    "generate_request_id",
    "md5_hash",
    "ensure_dir",
    "get_file_ext",
    "format_file_size",
    "safe_json_loads",
    "safe_json_dumps",
    "get_timestamp",
    "format_datetime",
]
