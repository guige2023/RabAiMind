"""
AI 视觉设计器

使用AI生成专业的SVG页面设计

作者: Claude
日期: 2026-03-18
"""

import json
import logging
import re
import threading
from typing import Any

logger = logging.getLogger(__name__)


class AIVisualDesigner:
    """AI 驱动的视觉设计器"""

    # SVG 设计规范
    SVG_DESIGN_PROMPT = """# PPT页面SVG设计宗师

## 设计规范
- 比例规范: 严格遵循16:9 SVG viewBox="0 0 1600 900"
- 安全边际: 核心内容必须完整落于 (100, 50, 1400, 800) 安全区内
- 矢量原生: 仅使用SVG原生元素，零依赖外部字体/图片
- 使用微软雅黑字体: font-family="Microsoft YaHei, Arial, sans-serif"

## 配色方案
{colors}

## 页面类型: {slide_type}

## 页面内容
标题: {title}
内容: {content}

## 设计要求
1. 信息层级清晰，主次分明
2. 视觉焦点明确
3. 配色和谐，符合主题
4. 细节精致，对齐规范
5. 背景可使用渐变或纯色
6. 适当添加装饰元素提升美感

请直接输出完整的 SVG 代码，不要包含任何解释或markdown标记。
输出格式要求：
- 必须包含 viewBox="0 0 1600 900"
- 必须包含 xmlns="http://www.w3.org/2000/svg"
- 不要使用markdown代码块标记
"""

    # 布局特定的提示
    LAYOUT_PROMPTS = {
        "title_slide": """
## 封面页设计要点
- 大标题居中或居左
- 副标题在主标题下方
- 使用渐变背景或大色块背景
- 添加装饰图形增加视觉层次
- 保持大量留白
""",
        "content_card": """
## 卡片式布局设计要点
- 网格排列2-4个卡片
- 每个卡片包含图标、标题、内容
- 卡片使用轻微阴影或边框
- 背景简洁，突出卡片
""",
        "two_column": """
## 双栏布局设计要点
- 左右分栏，内容均衡
- 可添加分隔线
- 标题居左对齐
- 适合对比或并列内容
""",
        "center_radiation": """
## 中心辐射布局设计要点
- 中心放置核心主题
- 周围辐射4-6个分支
- 使用连线连接中心和分支
- 分支使用圆形或卡片
""",
        "timeline": """
## 时间线布局设计要点
- 横向或纵向时间轴
- 均匀分布时间节点
- 节点使用圆形或图标
- 连接线贯穿时间轴
""",
        "quote": """
## 金句页设计要点
- 大面积留白
- 引用文字大而醒目
- 添加引用符号装饰
- 来源信息在下方
""",
        "comparison": """
## 对比布局设计要点
- 左右对比分明
- 使用VS或对比符号
- 颜色或深浅区分两边
- 关键信息突出显示
""",
        "data_visualization": """
## 数据可视化设计要点
- 图表区域占据主要空间
- 数据说明简洁清晰
- 使用颜色突出关键数据
- 添加图例说明
"""
    }

    def __init__(self, llm_client=None):
        """
        初始化AI视觉设计器

        Args:
            llm_client: LLM客户端，如果为None则使用VolcEngineAPI
        """
        self.llm_client = llm_client
        if not self.llm_client:
            from src.services.volc_api import VolcEngineAPI
            self.llm_client = VolcEngineAPI()

    async def design_slide(
        self,
        title: str,
        content: list[dict[str, Any]],
        slide_type: str,
        colors: dict[str, str],
        style: str = "professional"
    ) -> str:
        """
        使用AI设计幻灯片

        Args:
            title: 标题
            content: 内容列表
            slide_type: 幻灯片类型
            colors: 配色方案
            style: 风格

        Returns:
            SVG代码
        """
        # 构建完整提示词
        prompt = self._build_prompt(title, content, slide_type, colors, style)

        # 调用AI生成
        try:
            response = await self._call_ai(prompt)
            svg_code = self._extract_svg(response)
            svg_code = self._validate_and_fix_svg(svg_code)
            return svg_code
        except Exception as e:
            logger.error(f"AI design failed: {e}")
            # 返回fallback SVG
            return self._generate_fallback_svg(title, content, slide_type, colors)

    def _build_prompt(
        self,
        title: str,
        content: list[dict[str, Any]],
        slide_type: str,
        colors: dict[str, str],
        style: str
    ) -> str:
        """构建设计提示词"""
        # 添加布局特定提示
        layout_prompt = self.LAYOUT_PROMPTS.get(slide_type, "")

        # 格式化配色方案
        colors_json = json.dumps(colors, ensure_ascii=False, indent=2)

        # 格式化内容
        content_json = json.dumps(content, ensure_ascii=False)

        # 组合完整提示
        full_prompt = self.SVG_DESIGN_PROMPT.format(
            colors=colors_json,
            slide_type=slide_type,
            title=title,
            content=content_json
        )

        # 添加布局特定要求
        full_prompt += layout_prompt

        return full_prompt

    async def _call_ai(self, prompt: str) -> str:
        """调用AI生成"""
        # 检查客户端类型
        if hasattr(self.llm_client, 'text_generation'):
            # 同步调用
            result = self.llm_client.text_generation(
                prompt=prompt,
                temperature=0.7,
                max_tokens=4000
            )
            if result.get("success"):
                return result["content"]
            else:
                raise Exception(result.get("error", "Unknown error"))
        elif hasattr(self.llm_client, 'generate'):
            # 异步调用
            return await self.llm_client.generate(prompt=prompt)
        else:
            raise Exception("Invalid LLM client")

    def _extract_svg(self, content: str) -> str:
        """从AI响应中提取SVG代码"""
        # 尝试匹配SVG标签
        match = re.search(r'<svg[^>]*>.*?</svg>', content, re.DOTALL)
        if match:
            return match.group(0)

        # 尝试移除markdown代码块
        content = re.sub(r'```svg', '', content)
        content = re.sub(r'```', '', content)
        match = re.search(r'<svg[^>]*>.*?</svg>', content, re.DOTALL)
        if match:
            return match.group(0)

        # 如果都失败，返回原始内容
        return content

    def _validate_and_fix_svg(self, svg_code: str) -> str:
        """验证和修复SVG代码"""
        # 添加viewBox
        if 'viewBox="0 0 1600 900"' not in svg_code:
            svg_code = svg_code.replace('<svg', '<svg viewBox="0 0 1600 900"')

        # 添加命名空间
        if 'xmlns=' not in svg_code:
            svg_code = svg_code.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')

        # 确保有viewBox（如果上面的替换没生效）
        if 'viewBox=' not in svg_code:
            # 在第一个>前添加viewBox
            match = re.search(r'<svg([^>]*)>', svg_code)
            if match:
                attrs = match.group(1)
                svg_code = svg_code.replace(
                    f'<svg{attrs}>',
                    f'<svg{attrs} viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">'
                )

        return svg_code

    def _generate_fallback_svg(
        self,
        title: str,
        content: list[dict[str, Any]],
        slide_type: str,
        colors: dict[str, str]
    ) -> str:
        """生成fallback SVG（当AI调用失败时）"""
        from .visual_element_generator import get_visual_element_generator

        generator = get_visual_element_generator()

        if slide_type == "title_slide":
            subtitle = content[0].get("content", "") if content else ""
            return generator.generate_title_slide(title, subtitle, colors)
        elif slide_type == "quote":
            quote = content[0].get("title", "") if content else ""
            source = content[0].get("content", "") if content else ""
            return generator.generate_quote_slide(quote, source, colors)
        else:
            # 使用卡片布局作为fallback
            return generator.generate_content_slide(title, content, colors, layout="card")


# 单例实例
_ai_visual_designer_instance: AIVisualDesigner | None = None
_manager_lock = threading.Lock()


def get_ai_visual_designer(llm_client=None) -> AIVisualDesigner:
    """获取AI视觉设计器单例（线程安全）"""
    global _ai_visual_designer_instance
    if _ai_visual_designer_instance is None:
        with _manager_lock:
            if _ai_visual_designer_instance is None:
                _ai_visual_designer_instance = AIVisualDesigner(llm_client)
    return _ai_visual_designer_instance
