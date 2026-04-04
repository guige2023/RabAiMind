# -*- coding: utf-8 -*-
"""
主题应用服务 - 批量应用主题颜色
"""

import os
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def apply_theme_to_task(
    task_id: str,
    theme_primary: str = "#165DFF",
    theme_secondary: str = "#0E42D2",
    theme_accent: str = "#00C6FF"
) -> dict:
    """
    将主题颜色应用到指定任务的SVG幻灯片文件
    
    Args:
        task_id: 任务ID
        theme_primary: 主色
        theme_secondary: 副色
        theme_accent: 强调色
    
    Returns:
        更新结果
    """
    from ..config import settings
    
    task_output_dir = Path(settings.OUTPUT_DIR) / task_id
    if not task_output_dir.exists():
        raise FileNotFoundError(f"任务 {task_id} 输出目录不存在")
    
    svg_files = sorted(task_output_dir.glob("slide_*.svg"))
    if not svg_files:
        raise FileNotFoundError(f"任务 {task_id} 没有SVG幻灯片文件")
    
    updated = 0
    errors = []
    
    for svg_path in svg_files:
        try:
            content = svg_path.read_text(encoding="utf-8")
            
            # 替换主题颜色（保留alpha通道）
            # #165DFF -> theme_primary
            content = re.sub(
                r'#165DFF(?![0-9A-Fa-f])',
                theme_primary,
                content
            )
            # #0E42D2 -> theme_secondary  
            content = re.sub(
                r'#0E42D2(?![0-9A-Fa-f])',
                theme_secondary,
                content
            )
            # #00C6FF -> theme_accent
            content = re.sub(
                r'#00C6FF(?![0-9A-Fa-f])',
                theme_accent,
                content
            )
            
            svg_path.write_text(content, encoding="utf-8")
            updated += 1
            
        except Exception as e:
            logger.error(f"更新 {svg_path} 失败: {e}")
            errors.append({"file": str(svg_path), "error": str(e)})
    
    return {
        "task_id": task_id,
        "updated": updated,
        "errors": errors,
        "theme": {
            "primary": theme_primary,
            "secondary": theme_secondary,
            "accent": theme_accent
        }
    }
