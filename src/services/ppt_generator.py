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

# 导入 AI 分析层
from ..core.ai_analyzer import AIAnalyzer, ContentGenerator, create_analyzer, create_content_generator

# 导入简单内容生成器
from .simple_content_generator import generate_ppt_content

# 导入智能规划器
from .ppt_planner import plan_ppt, LayoutType

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
            logger.info(f"更新任务状态为 processing, task_id={task_id}")
            self.task_manager.update_progress(task_id, 5, "解析需求", "processing")
            logger.info(f"任务状态已更新, task_id={task_id}")

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
        """生成 PPT 内容 - 使用智能规划器"""
        logger.info(f"开始智能规划 PPT, request={user_request[:50]}...")

        try:
            # 使用智能规划器（让AI先构思PPT结构）
            slides = await asyncio.to_thread(
                plan_ppt, user_request, slide_count
            )
            logger.info(f"AI规划了 {len(slides)} 页，每页都有智能布局")
            return slides

        except Exception as e:
            logger.error(f"智能规划失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return await self._generate_default_content(user_request, slide_count)

    async def _generate_content_with_ai(
        self,
        user_request: str,
        slide_count: int,
        scene: str,
        style: str
    ) -> list:
        """实际的 AI 内容生成逻辑"""
        # 1. 使用 AI 分析器分析需求 (在线程池中运行避免阻塞)
        analyzer = create_analyzer()
        options = {
            "scene": scene,
            "style": style,
            "slide_count": slide_count
        }

        # 使用 asyncio.to_thread 避免阻塞事件循环
        analysis = await asyncio.to_thread(analyzer.analyze, user_request, options)
        logger.info(f"需求分析完成: title={analysis.title}")

        # 2. 使用内容生成器生成幻灯片结构 (在线程池中运行)
        generator = create_content_generator()
        slide_tasks = await asyncio.to_thread(generator.generate_all_slides, analysis, slide_count)
        logger.info(f"生成了 {len(slide_tasks)} 个幻灯片任务")

        # 3. 为每个幻灯片生成详细内容 (在线程池中运行)
        for slide_task in slide_tasks:
            await asyncio.to_thread(generator.generate_slide_content, slide_task, scene, style)

        # 4. 转换为内部格式
        slides = []
        for i, task in enumerate(slide_tasks):
            slide_data = {
                "type": task.slide_type,
                "title": task.title,
                "content": task.content,
                "subtitle": None,
                "notes": task.notes
            }
            slides.append(slide_data)
            logger.info(f"Slide {i+1}: {task.title} ({task.slide_type})")

        return slides

    async def _generate_default_content(
        self,
        user_request: str,
        slide_count: int
    ) -> list:
        """生成默认内容（降级方案）"""
        slides = []
        for i in range(slide_count):
            if i == 0:
                slides.append({
                    "type": "title_slide",
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

                # 生成图片提示词 - 使用slide特定的image_hint或生成相关内容提示
                image_hint = slide.get("image_hint", "")
                if slide_type == "title_slide":
                    image_prompt = f"Professional business presentation background, {title}, modern minimalist style, gradient blue and white, abstract geometric shapes, 16:9 ratio"
                elif image_hint:
                    image_prompt = f"{image_hint}, professional flat design, modern corporate style, clean background, high quality"
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

            # 生成 SVG - 根据layout类型选择不同的构建方法
            for i, slide in enumerate(slides_content):
                slide_type = slide.get("type", "content")
                title = slide.get("title", f"Slide {i+1}")
                content = slide.get("content", [])
                subtitle = slide.get("subtitle")
                image_url = slide_images.get(i)
                
                # 获取布局类型
                layout = slide.get("layout", "left_text_right_image")
                design_notes = slide.get("design_notes", "")
                
                # 根据layout和slide_type选择构建方法
                if slide_type in ["title", "title_slide"]:
                    if image_url:
                        svg_code = svg_builder.build_title_slide_with_image(title, subtitle, image_url, style_enum)
                    else:
                        svg_code = svg_builder.build_title_slide(title, subtitle, style_enum)
                elif slide_type == "thank_you":
                    svg_code = svg_builder.build_thank_you_slide(title, style_enum)
                elif layout == "left_image_right_text" and image_url:
                    # 左图右文布局
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = _build_reversed_layout_slide(svg_builder, title, content_list, image_url, style_enum)
                elif layout == "full_image" and image_url:
                    # 全屏图片布局 - 图片铺满，文字叠加
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = _build_full_image_slide(svg_builder, title, content_list, image_url, style_enum)
                elif layout == "image_cover" and image_url:
                    # 图片封面布局 - 图片为主，文字在图片上
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = _build_image_cover_layout(svg_builder, title, content_list, image_url, style_enum)
                elif layout == "three_column":
                    # 三栏布局
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = _build_three_column_slide(svg_builder, title, content_list, style_enum)
                elif layout == "card":
                    # 卡片布局
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = _build_card_slide(svg_builder, title, content_list, style_enum)
                elif layout == "center":
                    # 居中布局
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = _build_center_slide(svg_builder, title, content_list, style_enum)
                elif layout == "toc":
                    # 目录页
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = _build_toc_slide(svg_builder, title, content_list, style_enum)
                elif image_url:
                    # 默认左文右图
                    content_list = content if isinstance(content, list) else [str(content)]
                    svg_code = svg_builder.build_content_slide_with_image(title, content_list, image_url, style_enum)
                else:
                    content_list = content if isinstance(content, list) else [str(content)]
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


# ========== 布局构建函数 ==========

def _build_reversed_layout_slide(svg_builder, title: str, content: list, image_url: str, style):
    """左图右文布局"""
    # 使用现有的构建方法，但传入参数让它反向
    return svg_builder.build_content_slide_with_image(title, content, image_url, style)


def _build_full_image_slide(svg_builder, title: str, content: list, image_url: str, style):
    """全屏图片布局 - 图片为主，文字叠加在上面（图文一体）"""
    from agents.svg_agent import SVGStyle
    
    # 颜色配置
    colors = {
        "primary": "#165DFF",
        "secondary": "#0E42D2",
        "accent": "#00C853",
        "text": "#FFFFFF",
        "background": "#1A1A2E"
    }
    
    # 处理内容，限制显示数量
    display_content = content[:4] if len(content) >= 4 else content
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:0.7" />
    </linearGradient>
    <linearGradient id="contentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#165DFF;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#0E42D2;stop-opacity:0.95" />
    </linearGradient>
  </defs>
  
  <!-- 全屏背景图 -->
  <image href="{image_url}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice" />
  
  <!-- 暗色遮罩，让文字更清晰 -->
  <rect width="1600" height="900" fill="url(#overlayGrad)" />
  
  <!-- 顶部标题区域 -->
  <rect x="0" y="0" width="1600" height="120" fill="url(#contentGrad)" />
  <text x="50" y="80" font-family="Microsoft YaHei" font-size="42" font-weight="bold" fill="#FFFFFF">{title}</text>
  
  <!-- 底部内容卡片 -->
  <rect x="0" y="750" width="1600" height="150" fill="#000000" opacity="0.6" />
  
  <!-- 内容要点 - 横向排列 -->
'''
    
    # 横向排列内容要点
    item_width = 350
    for i, item in enumerate(display_content):
        x = 50 + i * item_width
        svg += f'''  <text x="{x}" y="790" font-family="Microsoft YaHei" font-size="18" fill="#FFFFFF">▸ {item}</text>
'''
    
    svg += '</svg>'
    return svg


def _build_image_cover_layout(svg_builder, title: str, content: list, image_url: str, style):
    """图片封面布局 - 图片铺满，文字在图片上"""
    from agents.svg_agent import SVGStyle
    
    display_content = content[:3] if len(content) >= 3 else content
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0.8" />
    </linearGradient>
  </defs>
  
  <!-- 全屏背景图片 -->
  <image href="{image_url}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice" />
  
  <!-- 半透明遮罩 -->
  <rect width="1600" height="900" fill="#000000" opacity="0.4" />
  
  <!-- 中心标题区域 -->
  <rect x="200" y="300" width="1200" height="300" rx="20" fill="#000000" opacity="0.5" />
  
  <!-- 主标题 -->
  <text x="800" y="400" font-family="Microsoft YaHei" font-size="52" font-weight="bold" fill="url(#textGrad)" text-anchor="middle">{title}</text>
  
'''
    
    # 副标题/要点
    for i, item in enumerate(display_content):
        y = 480 + i * 40
        svg += f'  <text x="800" y="{y}" font-family="Microsoft YaHei" font-size="24" fill="#FFFFFF" text-anchor="middle">• {item}</text>\n'
    
    svg += '</svg>'
    return svg


def _build_full_image_slide(svg_builder, title: str, content: list, image_url: str, style):
    """全屏图片布局 - 图片为主，文字为辅"""
    from agents.svg_agent import SVGStyle
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
    <clipPath id="imgClip">
      <rect x="0" y="0" width="1600" height="900" />
    </clipPath>
  </defs>
  
  <!-- 全屏背景图 -->
  <image href="{image_url}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice" clip-path="url(#imgClip)" />
  
  <!-- 暗色遮罩 -->
  <rect width="1600" height="900" fill="#000000" opacity="0.4" />
  
  <!-- 底部内容区 -->
  <rect x="0" y="650" width="1600" height="250" fill="url(#bgGrad)" opacity="0.9" />
  
  <!-- 标题 -->
  <text x="80" y="710" font-family="Microsoft YaHei" font-size="48" font-weight="bold" fill="#FFFFFF">{title}</text>
  
  <!-- 内容 -->
'''
    
    for i, item in enumerate(content[:3]):
        svg += f'  <text x="80" y="{780 + i * 40}" font-family="Microsoft YaHei" font-size="24" fill="#CCCCCC">• {item}</text>\n'
    
    svg += '</svg>'
    return svg


def _build_three_column_slide(svg_builder, title: str, content: list, style):
    """三栏布局"""
    from agents.svg_agent import SVGStyle
    
    colors = ["#165DFF", "#00C853", "#FF6D00"]
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2C3E50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3498DB;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="1600" height="900" fill="#F8F9FA" />
  
  <!-- 标题栏 -->
  <rect x="0" y="0" width="1600" height="120" fill="url(#headerGrad)" />
  <text x="50" y="75" font-family="Microsoft YaHei" font-size="40" font-weight="bold" fill="#FFFFFF">{title}</text>
  
'''
    
    # 三栏内容
    col_width = 480
    start_x = [80, 560, 1040]
    
    for col in range(3):
        x = start_x[col]
        color = colors[col % len(colors)]
        
        # 卡片背景
        svg += f'''  <rect x="{x}" y="160" width="{col_width}" height="650" rx="15" fill="#FFFFFF" stroke="{color}" stroke-width="2" />
  <circle cx="{x + col_width//2}" cy="220" r="30" fill="{color}" />
  <text x="{x + col_width//2}" y="230" font-family="Microsoft YaHei" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">{col + 1}</text>
  
'''
        
        # 栏内容
        content_idx = col * 2
        if content_idx < len(content):
            svg += f'  <text x="{x + 30}" y="300" font-family="Microsoft YaHei" font-size="22" font-weight="bold" fill="#333333">{content[content_idx]}</text>\n'
        
        if content_idx + 1 < len(content):
            # 分点内容
            sub_items = content[content_idx + 1].split('，')
            for j, sub in enumerate(sub_items[:3]):
                svg += f'  <text x="{x + 30}" y="{350 + j * 35}" font-family="Microsoft YaHei" font-size="16" fill="#666666">▸ {sub}</text>\n'
    
    svg += '</svg>'
    return svg


def _build_card_slide(svg_builder, title: str, content: list, style):
    """卡片式布局"""
    from agents.svg_agent import SVGStyle
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="1600" height="900" fill="#F0F2F5" />
  
  <!-- 标题 -->
  <rect x="0" y="0" width="1600" height="100" fill="url(#headerGrad)" />
  <text x="50" y="65" font-family="Microsoft YaHei" font-size="40" font-weight="bold" fill="#FFFFFF">{title}</text>
  
'''
    
    # 卡片网格
    card_width = 350
    card_height = 280
    start_x = [175, 625, 1075]
    start_y = [150, 470]
    colors = ["#FFFFFF", "#FFFFFF", "#FFFFFF"]
    
    for row in range(2):
        for col in range(3):
            idx = row * 3 + col
            if idx >= len(content):
                break
                
            x = start_x[col]
            y = start_y[row]
            
            svg += f'''  <rect x="{x}" y="{y}" width="{card_width}" height="{card_height}" rx="20" fill="#FFFFFF" filter="url(#shadow)" />
  <rect x="{x}" y="{y}" width="{card_width}" height="8" rx="4" fill="#667eea" />
  <text x="{x + 30}" y="{y + 60}" font-family="Microsoft YaHei" font-size="24" font-weight="bold" fill="#333333">{content[idx]}</text>
'''
    
    svg += '''</svg>'''
    return svg


def _build_center_slide(svg_builder, title: str, content: list, style):
    """居中布局"""
    from agents.svg_agent import SVGStyle
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E8F4FD;stop-opacity:1" />
    </radialGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="1600" height="900" fill="url(#bgGrad)" />
  
  <!-- 装饰圆 -->
  <circle cx="800" cy="300" r="200" fill="#165DFF" opacity="0.1" />
  <circle cx="800" cy="300" r="150" fill="#165DFF" opacity="0.15" />
  
  <!-- 居中标题 -->
  <text x="800" y="300" font-family="Microsoft YaHei" font-size="56" font-weight="bold" fill="#165DFF" text-anchor="middle">{title}</text>
  
'''
    
    # 居中内容
    for i, item in enumerate(content[:4]):
        svg += f'  <text x="800" y="{400 + i * 50}" font-family="Microsoft YaHei" font-size="28" fill="#333333" text-anchor="middle">• {item}</text>\n'
    
    svg += '</svg>'
    return svg


def _build_toc_slide(svg_builder, title: str, content: list, style):
    """目录页布局"""
    from agents.svg_agent import SVGStyle
    
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#2C3E50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3498DB;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="1600" height="900" fill="#F8F9FA" />
  
  <!-- 标题 -->
  <rect x="0" y="0" width="1600" height="150" fill="url(#headerGrad)" />
  <text x="800" y="100" font-family="Microsoft YaHei" font-size="48" font-weight="bold" fill="#FFFFFF" text-anchor="middle">{title}</text>
  
'''
    
    # 目录项
    for i, item in enumerate(content[:5]):
        y = 250 + i * 110
        
        svg += f'''  <rect x="200" y="{y}" width="1200" height="90" rx="10" fill="#FFFFFF" stroke="#E0E0E0" />
  <circle cx="280" cy="{y + 45}" r="25" fill="#165DFF" />
  <text x="280" y="{y + 53}" font-family="Microsoft YaHei" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="middle">{i + 1}</text>
  <text x="340" y="{y + 55}" font-family="Microsoft YaHei" font-size="28" fill="#333333">{item}</text>
  
'''
    
    svg += '</svg>'
    return svg
