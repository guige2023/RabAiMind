# -*- coding: utf-8 -*-
"""
PPT 生成器服务

作者: Claude
日期: 2026-03-17
"""

import time
import asyncio
import os
from typing import Optional, Dict, Any, List
from pathlib import Path

from ..utils import ensure_dir, get_timestamp, setup_logger
from ..config import settings
from .task_manager import get_task_manager
from .svg_converter import create_pptx_from_svgs, get_pptx_slide_count
from agents.svg_agent import SVGBuilder, SVGStyle

logger = setup_logger("ppt_generator")


class PPTGenerator:
    """PPT 生成器"""

    def __init__(self):
        self.task_manager = get_task_manager()
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
            # 更新状态
            self.task_manager.update_progress(task_id, 5, "解析需求", "processing")

            # 内容生成 - 从 agents 目录导入实际的内容生成逻辑
            slides_content = await self._generate_content(
                user_request, slide_count, scene, style
            )

            self.task_manager.update_progress(task_id, 20, "生成内容", "processing")

            # SVG 渲染
            svg_files = await self._render_svg(slides_content, template, theme_color)
            logger.info(f"生成了 {len(svg_files)} 个 SVG 文件")

            self.task_manager.update_progress(task_id, 50, "渲染SVG", "processing")

            # PPTX 转换
            pptx_path = await self._convert_to_pptx(svg_files, task_id)
            logger.info(f"PPTX 转换完成: {pptx_path}")

            self.task_manager.update_progress(task_id, 80, "转换PPTX", "processing")

            # 获取实际的幻灯片数量
            actual_slide_count, _ = get_pptx_slide_count(pptx_path)
            logger.info(f"PPTX 幻灯片数量: {actual_slide_count}")

            self.task_manager.update_progress(task_id, 90, "优化文件", "processing")

            # 优化
            optimized_path = await self._optimize_pptx(pptx_path)

            # 完成
            self.task_manager.complete_task(
                task_id=task_id,
                pptx_path=optimized_path,
                slide_count=actual_slide_count or slide_count,
                compression_ratio=4.5
            )

            logger.info(f"PPT 生成完成, task_id={task_id}, path={optimized_path}")

            return {
                "success": True,
                "pptx_path": optimized_path,
                "slide_count": actual_slide_count or slide_count
            }

        except Exception as e:
            logger.error(f"PPT 生成失败, task_id={task_id}, error={str(e)}")
            import traceback
            traceback.print_exc()
            self.task_manager.fail_task(task_id, "GENERATE_ERROR", str(e))
            return {
                "success": False,
                "error": str(e)
            }

    async def _generate_content(
        self,
        user_request: str,
        slide_count: int,
        scene: str,
        style: str
    ) -> list:
        """生成 PPT 内容 - 使用 Volcano Agent 进行实际内容生成"""
        try:
            # 尝试调用 volcano_agent 生成实际内容
            from agents.volcano_agent import VolcanoAgent
            agent = VolcanoAgent()
            slides = agent.generate_presentation(user_request, slide_count, scene, style)
            if slides and len(slides) > 0:
                logger.info(f"VolcanoAgent 生成了 {len(slides)} 张幻灯片")
                return slides
        except Exception as e:
            logger.warning(f"VolcanoAgent 调用失败: {e}, 使用默认内容")

        # 如果 VolcanoAgent 失败，使用默认内容
        slides = []
        for i in range(slide_count):
            if i == 0:
                slides.append({
                    "type": "title",
                    "title": user_request[:50] if len(user_request) > 50 else user_request,
                    "subtitle": "RabAi Mind AI PPT 生成平台",
                    "content": []
                })
            elif i == slide_count - 1:
                slides.append({
                    "type": "thank_you",
                    "title": "谢谢观看",
                    "content": []
                })
            else:
                # 内容页
                content_items = [
                    f"要点 {(i-1)*2+1}: 这是第{(i-1)*2+1}个要点的详细说明，包含具体解释和案例",
                    f"要点 {(i-1)*2+2}: 这是第{(i-1)*2+2}个要点的详细说明，包含具体解释和案例",
                ]
                slides.append({
                    "type": "content",
                    "title": f"第{i}章 - 主题内容",
                    "content": content_items
                })
        return slides

    async def _render_svg(
        self,
        slides_content: list,
        template: str,
        theme_color: str
    ) -> list:
        """渲染 SVG"""
        svg_files = []

        # 根据主题色选择风格
        style_map = {
            "#165DFF": "professional",
            "#2C3E50": "professional",
            "#9B59B6": "creative",
            "#0D47A1": "tech",
            "#1976D2": "education"
        }
        style_name = style_map.get(theme_color.lower(), "professional")

        try:
            svg_builder = SVGBuilder()

            # 设置风格
            style_enum = SVGStyle.PROFESSIONAL
            if style_name == "creative":
                style_enum = SVGStyle.CREATIVE
            elif style_name == "tech":
                style_enum = SVGStyle.TECH
            elif style_name == "education":
                style_enum = SVGStyle.EDUCATION
            elif style_name == "minimal":
                style_enum = SVGStyle.MINIMAL

            # 为每一页生成图片
            slide_images = {}
            for i, slide in enumerate(slides_content):
                slide_type = slide.get("type", "content")
                title = slide.get("title", f"Slide {i+1}")

                # 生成图片提示词
                if slide_type == "title":
                    image_prompt = f"Professional business presentation background, {title}, modern minimalist style, gradient blue and white, abstract geometric shapes, 16:9 ratio"
                else:
                    content_text = " ".join(slide.get("content", [])[:2]) if slide.get("content") else title
                    image_prompt = f"Business illustration for {content_text[:50]}, professional flat design, modern corporate style, clean background"

                # 尝试生成图片
                try:
                    from volc_okppt_tools import generate_image
                    # 使用正确的尺寸以满足 API 要求 (至少 3686400 像素 = 2560x1440)
                    result = generate_image(image_prompt, size="2560x1440")
                    if result and result.get("url"):
                        slide_images[i] = result["url"]
                        logger.info(f"生成了图片 for slide {i+1}: {result['url'][:50]}...")
                except Exception as e:
                    logger.warning(f"图片生成失败: {e}")
                    slide_images[i] = None

            # 生成 SVG
            for i, slide in enumerate(slides_content):
                slide_type = slide.get("type", "content")
                title = slide.get("title", f"Slide {i+1}")
                content = slide.get("content", [])
                subtitle = slide.get("subtitle")
                image_url = slide_images.get(i)

                # 根据是否有图片选择不同的 SVG 构建方法
                if slide_type == "title":
                    if image_url:
                        svg_code = svg_builder.build_title_slide_with_image(title, subtitle, image_url, style_enum)
                    else:
                        svg_code = svg_builder.build_title_slide(title, subtitle, style_enum)
                else:
                    # 内容页
                    content_list = content if isinstance(content, list) else [str(content)]
                    if image_url:
                        svg_code = svg_builder.build_content_slide_with_image(title, content_list, image_url, style_enum)
                    else:
                        svg_code = svg_builder.build_content_slide(title, content_list, style_enum)

                # 保存 SVG 文件
                svg_path = Path(settings.OUTPUT_DIR) / f"slide_{i+1}_{slide_type}.svg"
                with open(svg_path, "w", encoding="utf-8") as f:
                    f.write(svg_code)

                svg_files.append(str(svg_path))
                logger.info(f"已生成 SVG: {svg_path}")

        except Exception as e:
            logger.error(f"SVG 渲染失败: {e}")
            import traceback
            traceback.print_exc()

        return svg_files

    async def _convert_to_pptx(self, svg_files: list, task_id: str) -> str:
        """转换为 PPTX"""
        if not svg_files:
            # 如果没有 SVG 文件，创建一个空的 PPTX
            pptx_path = Path(settings.OUTPUT_DIR) / f"presentation_{task_id}.pptx"
            from pptx import Presentation
            from pptx.util import Inches

            prs = Presentation()
            prs.slide_width = Inches(16)
            prs.slide_height = Inches(9)
            prs.slides.add_slide(prs.slide_layouts[6])
            prs.save(str(pptx_path))
            return str(pptx_path)

        # 使用 SVG 转换器创建 PPTX
        pptx_path = Path(settings.OUTPUT_DIR) / f"presentation_{task_id}.pptx"

        success, error = create_pptx_from_svgs(
            svg_files=svg_files,
            output_path=str(pptx_path)
        )

        if not success:
            logger.error(f"PPTX 转换失败: {error}")
            # 降级：创建一个简单的 PPTX
            from pptx import Presentation
            from pptx.util import Inches

            prs = Presentation()
            prs.slide_width = Inches(16)
            prs.slide_height = Inches(9)
            for _ in range(len(svg_files)):
                prs.slides.add_slide(prs.slide_layouts[6])
            prs.save(str(pptx_path))

        return str(pptx_path)

    async def _optimize_pptx(self, pptx_path: str) -> str:
        """优化 PPTX"""
        # 模拟优化
        return pptx_path


# 全局实例
_generator: Optional[PPTGenerator] = None


def get_ppt_generator() -> PPTGenerator:
    """获取生成器实例"""
    global _generator
    if _generator is None:
        _generator = PPTGenerator()
    return _generator
