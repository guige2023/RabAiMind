# -*- coding: utf-8 -*-
"""
Advanced AI Features Service
智能复制 / 内容扩展 / 演讲稿生成 / 设计一致性检查 / 一键专业优化
"""
import logging
import json
import os
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

from .volc_api import get_volc_api

logger = logging.getLogger(__name__)


def get_advanced_ai_service() -> "AdvancedAIFeatures":
    return AdvancedAIFeatures()


class AdvancedAIFeatures:
    """Advanced AI features for PPT enhancement"""

    # ============ Feature 1: Smart Copy ============

    SMART_COPY_PROMPT = """你是一个专业的PPT内容迁移专家。请分析源PPT的内容和风格，然后为目标PPT智能复制并适配内容。

源PPT内容：
{Source_content}

目标PPT要求：
- 主题：{target_theme}
- 风格：{target_style}
- 页数：{target_page_count}

请执行"智能复制"：
1. 分析源PPT的核心内容结构和关键信息
2. 根据目标PPT的主题和风格，选择性地迁移最相关的内容
3. 智能适配：调整文字长度、语气、细节程度以匹配目标场景
4. 保留源PPT中真正有价值的独特内容，过滤掉不相关的部分
5. 如果源内容与目标主题完全不相关，说明原因并跳过

请按以下JSON格式返回：
{{
    "analysis": "源PPT内容分析（30字以内）",
    "copied_slides": [
        {{
            "source_slide": "源幻灯片序号",
            "relevance": "与目标主题的相关程度（高/中/低/不相关）",
            "action": "copied（复制）/ adapted（改编）/ skipped（跳过）",
            "adaptation_notes": "内容适配说明（如有）",
            "title": "适配后的标题",
            "content": "适配后的内容",
            "bullet_points": ["要点1", "要点2"],
            "design_suggestion": "设计建议（颜色/图标/布局）"
        }}
    ],
    "summary": "整体迁移总结（50字以内）"
}}

请只返回JSON，不要其他内容。"""

    def smart_copy(
        self,
        source_slides: List[Dict[str, Any]],
        target_theme: str,
        target_style: str = "professional",
        target_page_count: int = 5
    ) -> Dict[str, Any]:
        """
        智能复制：分析源PPT内容，选择性迁移到目标主题
        source_slides: List[Dict], 每项包含 title, content, bullet_points
        """
        volc = get_volc_api()

        source_text = json.dumps(source_slides, ensure_ascii=False, indent=2)

        prompt = self.SMART_COPY_PROMPT.format(
            source_content=source_text,
            target_theme=target_theme,
            target_style=target_style,
            target_page_count=target_page_count
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.5,
            max_tokens=4096
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)
            return {"success": True, "data": parsed}
        except json.JSONDecodeError as e:
            logger.error(f"Smart copy JSON解析失败: {e}, content={result.get('content', '')[:200]}")
            return {"success": False, "error": "AI返回格式解析失败"}

    # ============ Feature 2: AI Content Extender ============

    CONTENT_EXTENDER_PROMPT = """你是一个专业的PPT内容扩展专家。请将用户提供的简略大纲扩展为详细、专业的幻灯片内容。

原始大纲：
{outline}

PPT主题：{topic}
目标受众：{audience}
风格：{style}

请为每个简略条目扩展为完整的幻灯片内容，要求：
1. 标题：简洁有力，吸引注意力（不超过20字）
2. 核心观点：用1-2句话阐明关键信息
3. 详细要点：3-5个支撑点，每个点要有具体数据和案例支撑
4. 演讲提示：为演讲者提供2-3个关键讲述点
5. 视觉建议：建议的图表类型、图片风格、图标元素

请按以下JSON格式返回：
{{
    "extended_slides": [
        {{
            "original_entry": "原始大纲条目（原文）",
            "title": "扩展后的标题",
            "subtitle": "副标题（可选）",
            "core_message": "核心观点（1-2句话）",
            "bullet_points": [
                {{
                    "point": "要点标题",
                    "detail": "要点详细说明（包含数据/案例）",
                    "example": "具体示例（可选）"
                }}
            ],
            "speaker_notes": "演讲者提示（2-3个关键讲述点）",
            "visual_suggestion": "视觉建议（图表类型/图片风格）",
            "design_notes": "设计备注（配色/图标建议）"
        }}
    ],
    "total_slides": 页数,
    "estimated_duration": "预估演讲时长"
}}

请只返回JSON，不要其他内容。"""

    def extend_content(
        self,
        outline: List[Dict[str, str]],
        topic: str,
        audience: str = "商务人士",
        style: str = "professional"
    ) -> Dict[str, Any]:
        """
        AI内容扩展：将简略大纲扩展为详细的幻灯片内容
        outline: List[Dict], 每项包含 title 和 content（如有）
        """
        volc = get_volc_api()

        outline_text = json.dumps(outline, ensure_ascii=False, indent=2)

        prompt = self.CONTENT_EXTENDER_PROMPT.format(
            outline=outline_text,
            topic=topic,
            audience=audience,
            style=style
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.6,
            max_tokens=8192
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)
            return {"success": True, "data": parsed}
        except json.JSONDecodeError as e:
            logger.error(f"Content extender JSON解析失败: {e}")
            return {"success": False, "error": "AI返回格式解析失败"}

    # ============ Feature 3: Speaker Notes Generator ============

    SPEAKER_NOTES_PROMPT = """你是一个专业的演讲稿撰写专家。请为PPT幻灯片生成专业的演讲者备注。

幻灯片信息：
- 标题：{title}
- 内容：{content}
- 要点：{bullet_points}
- 页码：{slide_num} / {total_slides}
- 演讲时长：约{total_duration}分钟

请生成演讲者备注，要求：
1. 开场语：简短有吸引力的开场，引导听众进入主题
2. 核心讲述：配合幻灯片内容，提供演讲者应该说的话
3. 过渡语：与其他幻灯片的自然过渡
4. 时间控制提示：标注该页建议的演讲时长
5. 语调建议：专业/亲和/激情 等
6. 注意事项：可能遇到的提问、数据来源等

请按以下JSON格式返回：
{{
    "slide_num": {slide_num},
    "opening": "开场语（3-5句话）",
    "main_script": "核心讲述内容（配合幻灯片逐点讲解）",
    "transition": "过渡语（衔接下一页）",
    "time_hint": "建议时长（如：45秒-1分钟）",
    "tone_suggestion": "语调建议",
    "key_messages": ["关键信息1", "关键信息2"],
    "anticipation_qa": ["可能被问的问题及回答建议"]
}}

请只返回JSON，不要其他内容。"""

    def generate_speaker_notes(
        self,
        slides: List[Dict[str, Any]],
        total_duration: int = 10
    ) -> Dict[str, Any]:
        """
        自动生成演讲者备注
        slides: List[Dict], 每项包含 title, content, bullet_points
        total_duration: 总演讲时长（分钟）
        """
        volc = get_volc_api()

        time_per_slide = total_duration * 60 // max(len(slides), 1)

        prompt_parts = []
        for i, slide in enumerate(slides[:20]):  # 最多处理20页
            title = slide.get("title", "")
            content = slide.get("content", "")
            bullets = slide.get("bullet_points", [])

            prompt_parts.append(
                f"【第{i+1}页】标题：{title} | 内容：{content} | 要点：{', '.join(bullets) if bullets else '无'}"
            )

        all_slides_text = "\n".join(prompt_parts)

        # 分批处理，每批5页
        all_notes = []
        batch_size = 5
        for batch_start in range(0, len(slides), batch_size):
            batch = slides[batch_start:batch_start + batch_size]
            batch_num = batch_start // batch_size + 1

            prompts_for_batch = []
            for i, slide in enumerate(batch):
                title = slide.get("title", "")
                content = slide.get("content", "")
                bullets = slide.get("bullet_points", [])

                prompts_for_batch.append(
                    f"【第{batch_start + i + 1}页】标题：{title} | 内容：{content} | 要点：{', '.join(bullets) if bullets else '无'}"
                )

            batch_text = "\n".join(prompts_for_batch)

            prompt = f"""你是一个专业的演讲稿撰写专家。请为以下PPT幻灯片生成专业的演讲者备注。

幻灯片信息：
{batch_text}

总页数：{len(slides)}页，总演讲时长约{total_duration}分钟，平均每页约{time_per_slide}秒。

请为每页幻灯片生成演讲者备注，按以下JSON格式返回：
{{
    "speaker_notes": [
        {{
            "slide_num": 页码数字,
            "opening": "开场语（3-5句话）",
            "main_script": "核心讲述内容",
            "transition": "过渡语",
            "time_hint": "建议时长",
            "tone_suggestion": "语调建议",
            "key_messages": ["关键信息"],
            "anticipation_qa": ["可能被问的问题"]
        }}
    ]
}}

请只返回JSON，不要其他内容。"""

            result = volc.text_generation(prompt=prompt, temperature=0.5, max_tokens=8192)

            if result.get("success", False):
                try:
                    text = result["content"]
                    json_match = re.search(r'\{[\s\S]*\}', text)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        notes = parsed.get("speaker_notes", [])
                        all_notes.extend(notes)
                except (json.JSONDecodeError, Exception) as e:
                    logger.error(f"Speaker notes batch {batch_num} 解析失败: {e}")

        return {
            "success": True,
            "data": {
                "speaker_notes": all_notes,
                "total_slides": len(slides),
                "total_duration": total_duration
            }
        }

    # ============ Feature 4: Design Consistency Checker ============

    DESIGN_CHECK_PROMPT = """你是一个专业的PPT设计审核专家。请检查以下幻灯片的设计一致性问题。

幻灯片数据：
{slides_data}

风格主题：{style_theme}
品牌配色：{brand_colors}

请检查以下设计一致性维度：
1. 字体层级：标题/正文/注释的字体大小是否一致
2. 配色方案：背景色、文字色、强调色是否统一
3. 布局节奏：标题位置、内容边距、元素间距是否规范
4. 视觉权重：每页的视觉重心是否均衡
5. 图表风格：图表类型、颜色、标注风格是否统一
6. 图标风格：图标类型、线宽、颜色是否一致

请按以下JSON格式返回：
{{
    "overall_score": 整体评分(0-100),
    "violations": [
        {{
            "slide_num": 幻灯片序号,
            "severity": "critical（严重）/ warning（警告）/ suggestion（建议）",
            "category": "violation类别",
            "description": "具体问题描述",
            "current_value": "当前值",
            "suggested_fix": "建议修复方案"
        }}
    ],
    "style_summary": {{
        "font_consistency": "字体一致性评价",
        "color_consistency": "配色一致性评价",
        "layout_consistency": "布局一致性评价",
        "overall_assessment": "总体评价"
    }},
    "recommendations": ["改进建议1", "改进建议2"]
}}

请只返回JSON，不要其他内容。"""

    def check_design_consistency(
        self,
        slides: List[Dict[str, Any]],
        style_theme: str = "business",
        brand_colors: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        设计一致性检查：扫描幻灯片的设计违规问题
        slides: List[Dict], 每项包含 title, content, design_info（如有）
        """
        volc = get_volc_api()

        brand_colors = brand_colors or ["#1a73e8", "#ffffff", "#202124"]

        slides_text = json.dumps(slides[:30], ensure_ascii=False, indent=2)

        prompt = self.DESIGN_CHECK_PROMPT.format(
            slides_data=slides_text,
            style_theme=style_theme,
            brand_colors=json.dumps(brand_colors)
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.3,
            max_tokens=8192
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)

            # 计算评分
            score = parsed.get("overall_score", 0)
            violations = parsed.get("violations", [])

            return {
                "success": True,
                "data": {
                    "overall_score": score,
                    "violations": violations,
                    "style_summary": parsed.get("style_summary", {}),
                    "recommendations": parsed.get("recommendations", []),
                    "critical_count": sum(1 for v in violations if v.get("severity") == "critical"),
                    "warning_count": sum(1 for v in violations if v.get("severity") == "warning"),
                    "suggestion_count": sum(1 for v in violations if v.get("severity") == "suggestion")
                }
            }
        except json.JSONDecodeError as e:
            logger.error(f"Design check JSON解析失败: {e}")
            return {"success": False, "error": "AI返回格式解析失败"}

    # ============ Feature 5: One-click Professional Polish ============

    POLISH_PROMPT = """你是一个专业的PPT设计优化专家。请对以下幻灯片进行一键专业级优化。

当前幻灯片内容：
{slides_data}

目标风格：{target_style}
使用场景：{use_case}

请执行全面的专业优化：
1. 视觉层次：优化标题层级和内容分区
2. 配色优化：推荐专业配色方案并应用到每页
3. 布局优化：检查并优化信息密度和视觉平衡
4. 字体优化：推荐适合的字体组合
5. 图表优化：建议图表类型和数据可视化方式
6. 留白优化：确保呼吸感，不要过于拥挤
7. 一致性检查：确保全局风格统一
8. 结尾优化：检查结尾页是否有强有力的CTA或总结

请按以下JSON格式返回：
{{
    "polished_slides": [
        {{
            "slide_num": 幻灯片序号,
            "optimizations": [
                {{
                    "type": "color/layout/font/spacing/visual",
                    "before": "优化前的值/状态",
                    "after": "优化后的值/状态",
                    "rationale": "优化理由"
                }}
            ],
            "applied_theme": {{
                "primary_color": "主色调",
                "secondary_color": "辅色调",
                "accent_color": "强调色",
                "background": "背景色",
                "font_title": "标题字体",
                "font_body": "正文字体",
                "layout_style": "布局风格"
            }},
            "new_content": "优化后的内容（如有文字调整）",
            "improvement_summary": "本页优化总结"
        }}
    ],
    "global_optimizations": [
        {{
            "type": "优化类型",
            "description": "优化描述",
            "impact": "影响范围（全局/局部）"
        }}
    ],
    "before_after_summary": "优化前后对比总结",
    "professional_tips": ["专业建议1", "专业建议2"]
}}

请只返回JSON，不要其他内容。"""

    def professional_polish(
        self,
        slides: List[Dict[str, Any]],
        target_style: str = "business",
        use_case: str = "商务演示"
    ) -> Dict[str, Any]:
        """
        一键专业优化：对PPT进行全方位的专业级优化
        slides: List[Dict], 每项包含 title, content, bullet_points
        """
        volc = get_volc_api()

        slides_text = json.dumps(slides[:20], ensure_ascii=False, indent=2)

        prompt = self.POLISH_PROMPT.format(
            slides_data=slides_text,
            target_style=target_style,
            use_case=use_case
        )

        result = volc.text_generation(
            prompt=prompt,
            temperature=0.5,
            max_tokens=8192
        )

        if not result.get("success", False):
            return {"success": False, "error": result.get("error", "AI调用失败")}

        try:
            text = result["content"]
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                parsed = json.loads(text)

            polished = parsed.get("polished_slides", [])
            global_opts = parsed.get("global_optimizations", [])

            return {
                "success": True,
                "data": {
                    "polished_slides": polished,
                    "global_optimizations": global_opts,
                    "before_after_summary": parsed.get("before_after_summary", ""),
                    "professional_tips": parsed.get("professional_tips", []),
                    "total_slides_polished": len(polished)
                }
            }
        except json.JSONDecodeError as e:
            logger.error(f"Professional polish JSON解析失败: {e}")
            return {"success": False, "error": "AI返回格式解析失败"}
