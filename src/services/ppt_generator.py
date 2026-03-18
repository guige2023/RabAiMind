# -*- coding: utf-8 -*-
"""
PPT 生成器服务 - 使用python-pptx

作者: Claude
日期: 2026-03-18
"""

import time
import asyncio
import os
from typing import Optional, Dict, Any, List
from pathlib import Path

# 导入工具函数
from ..utils import ensure_dir, get_timestamp, setup_logger
from ..config import settings
from .task_manager import get_task_manager

# 导入PPT生成器
from .pptx_generator import create_professional_ppt

# 导入内容规划器
from .ppt_planner import plan_ppt

logger = setup_logger("ppt_generator")


class PPTGenerator:
    """PPT 生成器"""

    def __init__(self):
        ensure_dir(settings.OUTPUT_DIR)
        ensure_dir(settings.TEMPLATE_DIR)

    async def generate(
        self,
        task_id: str,
        user_request: str,
        slide_count: int = 10,
        scene: str = "business",
        style: str = "professional",
        template: str = "default",
        theme_color: str = "#165DFF"
    ) -> Dict[str, Any]:
        """生成 PPT"""
        logger.info(f"开始生成 PPT, task_id={task_id}, slide_count={slide_count}")

        try:
            from .task_manager import get_task_manager
            task_manager = get_task_manager()
            
            # 更新状态
            task_manager.update_progress(task_id, 5, "AI规划中", "processing")

            # 1. AI规划PPT内容
            logger.info(f"开始智能规划 PPT, request={user_request[:50]}...")
            slides_content = await asyncio.to_thread(
                plan_ppt, user_request, slide_count
            )
            logger.info(f"AI规划了 {len(slides_content)} 页")
            task_manager.update_progress(task_id, 20, "规划完成", "processing")

            # 2. 为每页生成AI图片
            task_manager.update_progress(task_id, 40, "生成AI图片中", "processing")
            logger.info("开始生成AI图片...")
            
            for i, slide in enumerate(slides_content):
                image_url = await self._generate_image(slide)
                slide["image_url"] = image_url
                logger.info(f"slide {i+1} 图片生成完成")
            
            task_manager.update_progress(task_id, 70, "图片生成完成", "processing")

            # 3. 使用python-pptx生成PPT
            output_path = os.path.join(
                settings.OUTPUT_DIR, 
                f"presentation_{task_id}.pptx"
            )
            
            logger.info(f"使用python-pptx生成PPT: {output_path}")
            await asyncio.to_thread(
                create_professional_ppt, slides_content, output_path
            )
            
            logger.info(f"PPT生成完成: {output_path}")
            task_manager.update_progress(task_id, 100, "完成", "completed")
            
            # 完成任务
            task_manager.complete_task(
                task_id=task_id,
                pptx_path=output_path,
                slide_count=len(slides_content),
                compression_ratio=1.0
            )

            return {
                "success": True,
                "pptx_path": output_path,
                "slide_count": len(slides_content)
            }

        except Exception as e:
            logger.error(f"PPT 生成失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }

    async def _generate_image(self, slide: Dict) -> str:
        """生成AI图片"""
        image_hint = slide.get("image_hint", "")
        title = slide.get("title", "")
        
        # 构建图片提示词
        if image_hint:
            prompt = f"{image_hint}, professional presentation background, high quality, 16:9 aspect ratio"
        else:
            prompt = f"Professional business presentation for {title}, modern minimalist style"
        
        try:
            from volc_okppt_tools import generate_image
            result = generate_image(prompt, size="2560x1440")
            if result and result.get("url"):
                return result["url"]
        except Exception as e:
            logger.warning(f"图片生成失败: {e}")
        
        return ""


# 全局实例
_generator: Optional[PPTGenerator] = None


def get_ppt_generator() -> PPTGenerator:
    """获取生成器实例"""
    global _generator
    if _generator is None:
        _generator = PPTGenerator()
    return _generator
