# -*- coding: utf-8 -*-
"""
PPT 生成器服务 - 使用 okppt 方式 (AI生成SVG)

作者: Claude
日期: 2026-03-18
"""

import time
import asyncio
import os
import re
import json
from typing import Optional, Dict, Any, List
from pathlib import Path

# 导入工具函数
from ..utils import ensure_dir, get_timestamp, setup_logger
from ..config import settings

# 导入pptx相关
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

logger = setup_logger("ppt_generator")


class PPTGenerator:
    """PPT 生成器 - okppt方式"""

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
        """生成 PPT - okppt方式"""
        logger.info(f"开始生成 PPT (okppt方式), task_id={task_id}, slide_count={slide_count}")

        try:
            from .task_manager import get_task_manager
            task_manager = get_task_manager()
            
            # 更新状态
            task_manager.update_progress(task_id, 5, "AI构思布局中", "processing")

            # 1. AI规划PPT内容
            logger.info(f"开始智能规划 PPT, request={user_request[:50]}...")
            slides_content = await asyncio.to_thread(
                self._plan_ppt, user_request, slide_count
            )
            logger.info(f"AI规划了 {len(slides_content)} 页")
            task_manager.update_progress(task_id, 20, "规划完成", "processing")

            # 2. 为每页生成AI图片
            task_manager.update_progress(task_id, 40, "生成AI图片中", "processing")
            logger.info("开始生成AI图片...")
            
            for i, slide in enumerate(slides_content):
                image_url = self._generate_image(slide)
                slide["image_url"] = image_url
                logger.info(f"slide {i+1} 图片生成完成")
            
            task_manager.update_progress(task_id, 60, "图片生成完成", "processing")

            # 3. AI生成SVG代码 (同步)
            task_manager.update_progress(task_id, 70, "AI设计SVG中", "processing")
            logger.info("开始生成SVG代码...")
            
            svg_files = []
            for i, slide in enumerate(slides_content):
                svg_code = self._generate_svg(slide, i+1)
                svg_path = os.path.join(settings.OUTPUT_DIR, f"slide_{i+1}_okppt.svg")
                with open(svg_path, 'w', encoding='utf-8') as f:
                    f.write(svg_code)
                svg_files.append(svg_path)
                logger.info(f"slide {i+1} SVG生成完成")
            
            task_manager.update_progress(task_id, 85, "SVG生成完成", "processing")

            # 4. SVG转PPT (同步)
            output_path = os.path.join(
                settings.OUTPUT_DIR, 
                f"presentation_{task_id}.pptx"
            )
            
            logger.info(f"SVG转PPT: {output_path}")
            # 同步调用
            self._svg_to_ppt(svg_files, output_path)
            
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

    def _plan_ppt(self, user_request: str, slide_count: int) -> List[Dict]:
        """AI规划PPT内容"""
        from .ppt_planner import plan_ppt
        return plan_ppt(user_request, slide_count)

    def _generate_image(self, slide: Dict) -> Optional[str]:
        """生成AI图片"""
        from .content_generator import get_content_generator
        
        content_gen = get_content_generator()
        
        prompt = slide.get("image_prompt", "")
        if not prompt:
            prompt = slide.get("title", "")
        
        # generate_image返回图片URL字符串
        image_url = content_gen.generate_image(prompt)
        return image_url

    def _generate_svg(self, slide: Dict, slide_num: int) -> str:
        """AI生成SVG代码"""
        from .volc_api import get_volc_api
        
        volc = get_volc_api()
        
        # 检查火山引擎API是否可用
        api_available = self._check_volc_api_available(volc)
        
        if api_available:
            # 使用AI生成SVG
            logger.info("火山引擎API可用，使用AI生成SVG")
            return self._generate_svg_with_ai(slide, slide_num, volc)
        else:
            # 使用智能文字模式（备用方案）
            logger.info("火山引擎API不可用，使用智能文字模式")
            return self._generate_svg_smart_text(slide, slide_num)
    
    def _check_volc_api_available(self, volc) -> bool:
        """检查火山引擎API是否可用"""
        import os
        api_key = os.getenv("VOLCENGINE_API_KEY", "")
        project_id = os.getenv("VOLCENGINE_PROJECT_ID", "")
        
        if not api_key or not project_id:
            return False
        
        # 尝试调用API检查连通性
        try:
            response = volc.text_generation("test")
            return response.get("success", False)
        except:
            return False
    
    def _generate_svg_with_ai(self, slide: Dict, slide_num: int, volc) -> str:
        """使用AI生成SVG代码"""
        # 构建SVG提示词
        prompt = self._build_svg_prompt(slide, slide_num)
        
        # 调用AI生成SVG (同步调用)
        response = volc.text_generation(prompt)
        
        # 提取SVG代码 - text_generation返回dict，需要取content
        if isinstance(response, dict):
            content = response.get("content", "")
        else:
            content = str(response)
        
        svg_code = self._extract_svg_code(content)
        
        return svg_code

    def _generate_svg_smart_text(self, slide: Dict, slide_num: int) -> str:
        """智能文字模式 - 不依赖AI生成SVG，使用纯代码生成美观SVG"""
        title = slide.get("title", "")
        subtitle = slide.get("subtitle", "")
        content = slide.get("content", [])
        image_url = slide.get("image_url", "")
        
        # 16:9 比例
        width = 1600
        height = 900
        
        # 构建内容列表HTML
        content_html = ""
        if content and len(content) > 0:
            items_html = ""
            for i, item in enumerate(content[:6]):  # 最多显示6个要点
                # 文字换行处理
                escaped_item = self._escape_html(str(item))
                items_html += f'''<text x="150" y="{380 + i * 70}" fill="rgba(255,255,255,0.9)" font-size="28" font-family="Microsoft YaHei, PingFang SC, sans-serif">
              <tspan x="150">{i+1}. </tspan><tspan>{escaped_item}</tspan>
            </text>'''
            
            content_html = f'''
<g id="content">
{items_html}
</g>'''
        
        # 副标题处理
        subtitle_html = ""
        if subtitle:
            escaped_subtitle = self._escape_html(subtitle)
            subtitle_html = f'''
<text x="800" y="180" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="32" font-family="Microsoft YaHei, PingFang SC, sans-serif">
  {escaped_subtitle}
</text>'''
        
        # 标题处理
        escaped_title = self._escape_html(title)
        
        # 背景图片处理（如果有）
        bg_image = ""
        if image_url:
            bg_image = f'''
<image href="{image_url}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice" opacity="0.4"/>'''
        
        svg_code = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <!-- 渐变背景 -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="50%" style="stop-color:#1e3a5f"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <!-- 标题渐变 -->
    <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#bfdbfe"/>
    </linearGradient>
    <!-- 背景遮罩 -->
    <linearGradient id="overlayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(15,23,42,0.3)"/>
      <stop offset="100%" style="stop-color:rgba(15,23,42,0.8)"/>
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="url(#bgGradient)"/>
  
  <!-- 背景图片（如果有） -->
  {bg_image}
  
  <!-- 遮罩层 -->
  <rect width="{width}" height="{height}" fill="url(#overlayGradient)"/>
  
  <!-- 装饰线条 -->
  <line x1="0" y1="200" x2="1600" y2="200" stroke="rgba(59,130,246,0.3)" stroke-width="2"/>
  <circle cx="100" cy="100" r="150" fill="rgba(59,130,246,0.1)"/>
  <circle cx="1500" cy="800" r="200" fill="rgba(59,130,246,0.08)"/>
  
  <!-- 页码 -->
  <text x="1550" y="870" text-anchor="end" fill="rgba(255,255,255,0.4)" font-size="18" font-family="Arial, sans-serif">
    {slide_num}
  </text>
  
  <!-- 标题 -->
  <text x="800" y="120" text-anchor="middle" fill="url(#titleGradient)" font-size="52" font-weight="bold" font-family="Microsoft YaHei, PingFang SC, sans-serif">
    {escaped_title}
  </text>
  
  <!-- 副标题 -->
  {subtitle_html}
  
  <!-- 内容要点 -->
  {content_html}
  
  <!-- 底部装饰 -->
  <rect x="0" y="850" width="1600" height="50" fill="rgba(59,130,246,0.2)"/>
  <text x="50" y="880" fill="rgba(255,255,255,0.5)" font-size="14" font-family="Arial, sans-serif">
    RabAi Mind - AI Generated
  </text>
</svg>'''
        
        return svg_code
    
    def _escape_html(self, text: str) -> str:
        """转义HTML特殊字符"""
        return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#39;"))

    def _build_svg_prompt(self, slide: Dict, slide_num: int) -> str:
        """构建SVG生成提示词"""
        title = slide.get("title", "")
        content = slide.get("content", [])
        slide_type = slide.get("slide_type", "content")
        
        # 根据类型选择不同提示词
        if slide_num == 1:
            prompt = f"""# PPT页面SVG设计宗师

## 设计规范
- 比例规范: 严格遵循16:9 SVG viewBox="0 0 1600 900"
- 安全边际: 核心内容必须完整落于 100, 50, 1400, 800 安全区内
- 矢量原生: 仅使用SVG原生元素

## 配色方案
- 主色调: #165DFF (科技蓝)
- 背景: 渐变深蓝到浅蓝，或使用提供的背景图
- 文字: 白色或浅色

## 页面类型: 封面页

## 内容信息
- 标题: {title}
- 副标题: {slide.get('subtitle', '')}

## 背景图片
图片URL: {slide.get('image_url', '')}

请直接输出完整的 SVG 代码，不要包含任何解释或markdown标记。
确保背景使用提供的图片URL，覆盖整个页面。
"""
        else:
            content_str = "\n".join([f"- {c}" for c in content[:5]])
            prompt = f"""# PPT页面SVG设计宗师

## 设计规范
- 比例规范: 严格遵循16:9 SVG viewBox="0 0 1600 900"
- 安全边际: 核心内容必须完整落于 100, 50, 1400, 800 安全区内
- 矢量原生: 仅使用SVG原生元素

## 配色方案
- 主色调: #165DFF (科技蓝)
- 背景: 使用提供的背景图铺满整个页面
- 文字: 白色或浅色，覆盖在图片上

## 页面类型: 内容页

## 内容信息
- 标题: {title}
- 内容要点:
{content_str}

## 背景图片
图片URL: {slide.get('image_url', '')}

请直接输出完整的 SVG 代码，不要包含任何解释或markdown标记。
要求：
1. 背景图片铺满整个页面 (1600x900)
2. 标题文字大而醒目，放在页面顶部或中央
3. 内容文字放在图片下方或覆盖在图片下半部分
4. 文字使用白色或浅色带阴影确保可读性
"""
        return prompt

    def _extract_svg_code(self, response: str) -> str:
        """从AI响应中提取SVG代码"""
        # 尝试提取 ```svg ... ``` 或 ``` ... ``` 中的代码
        patterns = [
            r'```svg\s*(.*?)```',
            r'```\s*(.*?)```',
            r'<svg[^>]*>.*?</svg>',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, response, re.DOTALL)
            if matches:
                code = matches[0].strip()
                if code.startswith('<svg'):
                    return code
        
        # 如果没有找到，返回默认SVG
        return self._default_svg()

    def _default_svg(self) -> str:
        """默认SVG"""
        return '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <text x="800" y="450" text-anchor="middle" fill="white" font-size="48">PPT Slide</text>
</svg>'''

    def _svg_to_ppt(self, svg_files: List[str], output_path: str) -> bool:
        """SVG转PPT"""
        try:
            from pptx import Presentation
            from pptx.util import Inches, Pt
            from PIL import Image
            import requests
            import uuid
            
            # 创建演示文稿
            prs = Presentation()
            prs.slide_width = Inches(16)
            prs.slide_height = Inches(9)
            
            for svg_file in svg_files:
                if not os.path.exists(svg_file):
                    continue
                
                # 读取SVG
                with open(svg_file, 'r', encoding='utf-8') as f:
                    svg_content = f.read()
                
                # 提取背景图片URL
                img_url = self._extract_image_url(svg_content)
                
                # 创建空白幻灯片
                blank_layout = prs.slide_layouts[6]
                slide = prs.slides.add_slide(blank_layout)
                
                # 如果有背景图片，下载并添加
                if img_url:
                    try:
                        response = requests.get(img_url, timeout=30)
                        if response.status_code == 200:
                            # 保存临时文件
                            temp_img = f"/tmp/temp_{uuid.uuid4().hex}.png"
                            with open(temp_img, 'wb') as f:
                                f.write(response.content)
                            
                            # 添加图片铺满页面
                            slide.shapes.add_picture(
                                temp_img,
                                Inches(0), Inches(0),
                                width=Inches(16), height=Inches(9)
                            )
                            os.remove(temp_img)
                    except Exception as e:
                        logger.warning(f"添加背景图片失败: {e}")
                
                # 提取文字内容并添加
                title, contents = self._extract_text_from_svg(svg_content)
                
                # 添加标题
                if title:
                    title_box = slide.shapes.add_textbox(
                        Inches(0.5), Inches(0.3), 
                        Inches(15), Inches(1)
                    )
                    tf = title_box.text_frame
                    p = tf.paragraphs[0]
                    p.text = title
                    p.font.size = Pt(44)
                    p.font.bold = True
                    p.font.color.rgb = RGBColor(255, 255, 255)
                
                # 添加内容
                if contents:
                    content_box = slide.shapes.add_textbox(
                        Inches(0.5), Inches(1.5),
                        Inches(15), Inches(6)
                    )
                    tf = content_box.text_frame
                    tf.word_wrap = True
                    
                    for i, content in enumerate(contents[:8]):
                        if i == 0:
                            p = tf.paragraphs[0]
                        else:
                            p = tf.add_paragraph()
                        p.text = f"• {content}"
                        p.font.size = Pt(24)
                        p.font.color.rgb = RGBColor(255, 255, 255)
                        p.space_before = Pt(12)
            
            # 保存
            prs.save(output_path)
            logger.info(f"PPT保存成功: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"SVG转PPT失败: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _extract_image_url(self, svg_content: str) -> Optional[str]:
        """从SVG中提取图片URL"""
        patterns = [
            r'href="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'xlink:href="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"',
            r'(https?://[^"\'>\s]+\.(?:jpg|jpeg|png|webp))',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, svg_content, re.I)
            if match:
                return match.group(1)
        
        return None

    def _extract_text_from_svg(self, svg_content: str):
        """从SVG中提取文字（包括tspan内的文字）"""
        import re
        
        # 方法1: 使用正则提取所有text和tspan元素的内容
        # 先提取所有tspan内容
        tspan_contents = re.findall(r'<tspan[^>]*>([^<]*)</tspan>', svg_content)
        tspan_contents = [t.strip() for t in tspan_contents if t.strip()]
        
        # 提取所有text元素的直接内容（不含tspan）
        text_contents = re.findall(r'<text[^>]*>([^<]*)</text>', svg_content)
        text_contents = [t.strip() for t in text_contents if t.strip()]
        
        # 合并所有文本内容
        all_texts = tspan_contents + text_contents
        
        # 过滤掉页码数字、装饰文字等
        filtered_texts = []
        exclude_patterns = [
            r'^\d+$',  # 纯数字（页码）
            r'^RabAi',  # 底部商标
            r'^AI',  # 可能的简短文字
        ]
        
        for text in all_texts:
            is_excluded = False
            for pattern in exclude_patterns:
                if re.match(pattern, text):
                    is_excluded = True
                    break
            # 过滤太短的文字
            if len(text) > 2 and not is_excluded:
                filtered_texts.append(text)
        
        # 识别标题：通常是大字体、在页面顶部(y < 200)
        title = ""
        contents = []
        
        # 通过y坐标识别标题（y在80-200之间的是标题）
        title_matches = re.findall(r'<text[^>]*y="(\d+)"[^>]*>.*?</text>', svg_content)
        text_with_y = []
        for match in re.finditer(r'<text[^>]*y="(\d+)"[^>]*>(.*?)</text>', svg_content, re.DOTALL):
            y = int(match.group(1))
            text = match.group(2)
            # 提取tspan内容
            tspan_in_text = re.findall(r'<tspan[^>]*>([^<]*)</tspan>', text)
            if tspan_in_text:
                text = ' '.join([t.strip() for t in tspan_in_text if t.strip()])
            else:
                text = text.strip()
            if text and len(text) > 2:
                text_with_y.append((y, text))
        
        # 按y坐标排序
        text_with_y.sort(key=lambda x: x[0])
        
        # 找到标题（y < 200的第一个主要内容）
        for y, text in text_with_y:
            if y < 200 and len(text) > 4:
                title = text
                break
        
        # 其余的是内容
        for y, text in text_with_y:
            if y >= 200 and len(text) > 2:
                # 跳过页码和底部装饰
                if y > 800:
                    continue
                contents.append(text)
        
        # 如果上述方法失败，使用备用逻辑
        if not title and filtered_texts:
            # 取第一个最长的作为标题
            title = max(filtered_texts, key=len) if filtered_texts else ""
            # 其余作为内容
            contents = [t for t in filtered_texts if t != title]
        
        return title, contents


# 全局实例
_ppt_generator: Optional[PPTGenerator] = None


def get_ppt_generator() -> PPTGenerator:
    """获取PPT生成器实例"""
    global _ppt_generator
    if _ppt_generator is None:
        _ppt_generator = PPTGenerator()
    return _ppt_generator
