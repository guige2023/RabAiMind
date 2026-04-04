# -*- coding: utf-8 -*-
"""
Script Content Service - R148 AI Script & Content Generation 2.0

5种AI脚本内容生成模式：
1. Story Arc Generator - 叙事结构生成器
2. Data Story Teller - 数据故事讲述者
3. Persuasion Techniques - 说服技巧框架
4. Audience Personas - 受众画像定制
5. Competitor Analysis - 竞品分析幻灯片
"""
import json
import logging
import re
from typing import Dict, Any, List, Optional

from .volc_api import get_volc_api

logger = logging.getLogger(__name__)


def get_script_content_service() -> "ScriptContentService":
    return ScriptContentService()


# ===== Story Arc Generator =====
STORY_ARC_PROMPT = """你是一位顶级的故事叙述大师和PPT结构设计师。请为演示文稿设计一个引人入胜的故事弧线结构。

主题：{topic}
场景：{scene}
页数：{slide_count}
目标受众：{audience}

请按照经典叙事结构（建置→对抗→解决）设计{slide_count}页PPT的故事弧线：

**【故事弧线框架】**
1. Hook（钩子）：用震撼数据/痛点问题/惊人洞察抓住注意力
2. Setup（建置）：展示现状、挑战、背景
3. Conflict（冲突）：深化核心矛盾，Why Now？为什么必须现在行动？
4. Journey（历程）：展示解决路径/演进过程
5. Climax（高潮）：最核心的洞察或解决方案
6. Resolution（解决）：展示成果/价值/未来愿景
7. CTA（行动号召）：清晰的下一jump限

请返回JSON格式：
{{
    "story_arc": {{
        "theme": "整体故事主题（一句话）",
        "protagonist": "故事主角（谁在经历这个转变？）",
        "starting_state": "起点状态",
        "ending_state": "终点状态",
        "emotional_arc": "情感弧线（低→高/高→低→高/其他）",
        "slides": [
            {{
                "slide_number": 1,
                "story_position": "hook/setup/conflict/journey/climax/resolution/cta",
                "title": "标题",
                "content": "核心内容",
                "emotion": "情感基调（悬念/期待/紧张/兴奋/感动/信心）",
                "key_message": "这一页要传递的关键信息",
                "visual_suggestion": "视觉建议"
            }}
        ],
        "transition_phrases": ["上一页到本页的过渡语1", "上一页到本页的过渡语2"],
        "summary": "故事弧线整体总结"
    }}
}}

请只返回JSON，不要其他内容。"""


# ===== Data Story Teller =====
DATA_STORY_PROMPT = """你是一位数据可视化叙事专家。请将数据/分析内容转化为有说服力的数据故事。

主题：{topic}
场景：{scene}
页数：{slide_count}

请按照数据故事的经典框架设计PPT：

**【数据故事框架：3Act Structure】**

Act 1 - 设置悬念：
- 开场问题：为什么这个数据很重要？
- 打破认知的数据洞察
- 建立"数据悬念"

Act 2 - 揭示真相：
- 数据的深度分析
- 多维度对比
- 趋势和模式发现
- 关键发现1、2、3

Act 3 - 行动号召：
- 数据驱动的结论
- 建议和下一步
- 愿景描绘

请返回JSON格式：
{{
    "data_story": {{
        "data_focus": "核心数据主题",
        "insight_hook": "开场数据洞察（一个惊人的数字或发现）",
        "act1": {{
            "title": "第一幕标题",
            "slides": [
                {{
                    "slide_number": 1,
                    "title": "标题",
                    "data_point": "关键数据点",
                    "narrative": "数据叙事（这个数字意味着什么？）",
                    "chart_type": "建议图表类型",
                    "visual_hook": "视觉钩子"
                }}
            ]
        }},
        "act2": {{
            "title": "第二幕标题",
            "key_findings": ["关键发现1", "关键发现2", "关键发现3"],
            "slides": [
                {{
                    "slide_number": 3,
                    "title": "标题",
                    "finding": "关键发现",
                    "supporting_data": "支撑数据",
                    "chart_type": "建议图表类型",
                    "insight": "深度洞察"
                }}
            ]
        }},
        "act3": {{
            "title": "第三幕标题",
            "conclusion": "数据驱动的结论",
            "recommendations": ["建议1", "建议2"],
            "future_vision": "未来愿景",
            "slides": [
                {{
                    "slide_number": 6,
                    "title": "标题",
                    "content": "结论内容",
                    "call_to_action": "行动号召"
                }}
            ]
        }},
        "summary": "数据故事整体总结"
    }}
}}

请只返回JSON，不要其他内容。"""


# ===== Persuasion Techniques =====
PERSUASION_PROMPT = """你是一位说服心理学和修辞学专家。请运用经典说服框架设计演示文稿。

主题：{topic}
场景：{scene}
页数：{slide_count}
目标受众：{audience}

请运用以下经典说服框架（可组合使用）：

**【说服框架】**
1. AIDA模型：Attention注意 → Interest兴趣 → Desire欲望 → Action行动
2. PAS框架：Problem痛苦 → Agitation放大 → Solution解决方案
3. FAB框架：Feature特性 → Advantage优势 → Benefit利益
4. 6种社会认同武器：权威、稀缺、社会认同、从众、承诺一致、喜好
5. 叙事说服：故事+数据+情感的黄金组合

请返回JSON格式：
{{
    "persuasion": {{
        "primary_framework": "主要使用的说服框架",
        "secondary_frameworks": ["辅助框架1", "辅助框架2"],
        "target_psychology": "目标受众心理弱点",
        "key_persuasion_lever": "核心说服杠杆（恐惧/稀缺/社会认同/权威/逻辑/情感）",
        "slides": [
            {{
                "slide_number": 1,
                "framework_used": "使用的说服框架",
                "technique": "具体说服技巧",
                "title": "标题",
                "content": "核心内容",
                "persuasion_element": "说服要素（数据/案例/引用/情感）",
                "leverage_point": "触达的心理杠杆",
                "visual_suggestion": "视觉建议"
            }}
        ],
        "emotional_journey": ["情绪1", "情绪2", "情绪3"],
        "proof_points": ["信任背书1", "信任背书2"],
        "urgency_mechanism": "紧迫感机制",
        "summary": "说服策略整体总结"
    }}
}}

请只返回JSON，不要其他内容。"""


# ===== Audience Personas =====
AUDIENCE_PERSONA_PROMPT = """你是一位B2B营销和用户研究专家。请根据受众特征设计精准定制的内容。

主题：{topic}
场景：{scene}
页数：{slide_count}
受众描述：{audience_description}

请深入分析目标受众并设计定制化内容：

**【受众画像框架】**
1. 人口统计：B2B决策链中的角色（EB/IB/TB/U）
2. 心理特征：核心驱动力、痛点、焦虑
3. 信息行为：喜欢什么格式的内容？信任什么渠道？
4. 决策动机：他们如何做决定？
5. 反对意见：他们最可能提出的异议及应对

请返回JSON格式：
{{
    "audience_persona": {{
        "primary_persona": {{
            "name": "虚构人物名",
            "role": "职位角色",
            "company_stage": "公司阶段（初创/成长/成熟）",
            "decision_makers": "决策链条",
            "core_pain": "核心痛点",
            "business_goal": "业务目标",
            "information_style": "内容偏好（数据/故事/案例/权威）",
            "objections": ["异议1", "异议2"],
            "how_to_reach": "如何触达"
        }},
        "content_tailoring": {{
            "pain_agenda": ["痛点1→内容对应", "痛点2→内容对应"],
            "value_alignment": "与受众业务目标对齐的方式",
            "objection_handling": "异议处理策略"
        }},
        "slides": [
            {{
                "slide_number": 1,
                "targeting": "本页针对哪个角色",
                "title": "标题",
                "content": "定制化内容",
                "pain_addressed": "解决的痛点",
                "value_shown": "展示的价值",
                "persuasion_approach": "说服方式"
            }}
        ],
        "summary": "受众定制策略整体总结"
    }}
}}

请只返回JSON，不要其他内容。"""


# ===== Competitor Analysis =====
COMPETITOR_ANALYSIS_PROMPT = """你是一位竞争情报和商业战略分析专家。请基于brief描述设计专业的竞品分析幻灯片。

主题/产品：{topic}
场景：{scene}
页数：{slide_count}
Brief描述：{brief_description}

请设计全面的竞品分析框架：

**【竞品分析框架】**
1. 市场份额与定位图
2. 产品功能对比矩阵
3. 定价策略对比
4. 竞争优势分析（我们的差异化）
5. 竞争格局演变趋势
6. 机会窗口识别
7. 应对策略建议

请返回JSON格式：
{{
    "competitor_analysis": {{
        "market_overview": {{
            "market_size": "市场规模概述",
            "market_share_distribution": "市场份额分布",
            "competitive_intensity": "竞争激烈程度"
        }},
        "key_players": [
            {{
                "name": "竞品A",
                "market_share": "市场份额",
                "strengths": ["优势1", "优势2"],
                "weaknesses": ["劣势1", "劣势2"],
                "pricing": "定价策略",
                "target_segment": "目标细分"
            }},
            {{
                "name": "竞品B",
                "market_share": "市场份额",
                "strengths": ["优势1", "优势2"],
                "weaknesses": ["劣势1", "劣势2"],
                "pricing": "定价策略",
                "target_segment": "目标细分"
            }}
        ],
        "comparison_matrix": {{
            "dimensions": ["功能A", "功能B", "价格", "服务", "品牌"],
            "us": "我们的评分",
            "competitor_a": "竞品A评分",
            "competitor_b": "竞品B评分"
        }},
        "our_advantages": ["竞争优势1", "竞争优势2", "竞争优势3"],
        "opportunity_window": "机会窗口描述",
        "slides": [
            {{
                "slide_number": 1,
                "title": "标题",
                "content": "核心内容",
                "analysis_type": "overview/feature/price/advantage/trend/strategy",
                "visual_suggestion": "视觉建议（对比表格/雷达图/矩阵图）"
            }}
        ],
        "summary": "竞品分析整体总结"
    }}
}}

请只返回JSON，不要其他内容。"""


class ScriptContentService:
    """AI 脚本内容生成服务"""

    def __init__(self):
        self.volc = get_volc_api()

    def _parse_json_response(self, content: str) -> Optional[Dict]:
        """健壮的JSON解析"""
        if not content:
            return None
        content = content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                content = match.group(0)
        content = content.strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        # 修复常见JSON问题
        content = re.sub(r',(\s*[}\]])', r'\1', content)
        content = content.replace("'", '"')
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None

    def generate_story_arc(
        self,
        topic: str,
        scene: str = "business",
        slide_count: int = 10,
        audience: str = "商务人士"
    ) -> Dict[str, Any]:
        """生成故事弧线结构"""
        prompt = STORY_ARC_PROMPT.format(
            topic=topic,
            scene=scene,
            slide_count=slide_count,
            audience=audience
        )
        result = self.volc.text_generation(
            prompt=prompt,
            temperature=0.7,
            max_tokens=8192
        )
        if not result.get("success"):
            return {"success": False, "error": result.get("error", "AI调用失败")}
        try:
            parsed = self._parse_json_response(result["content"])
            if parsed:
                return {"success": True, "data": parsed, "type": "story_arc"}
        except Exception as e:
            logger.error(f"Story arc解析失败: {e}")
        return {"success": False, "error": "AI返回格式解析失败"}

    def generate_data_story(
        self,
        topic: str,
        scene: str = "business",
        slide_count: int = 10
    ) -> Dict[str, Any]:
        """生成数据故事"""
        prompt = DATA_STORY_PROMPT.format(
            topic=topic,
            scene=scene,
            slide_count=slide_count
        )
        result = self.volc.text_generation(
            prompt=prompt,
            temperature=0.6,
            max_tokens=8192
        )
        if not result.get("success"):
            return {"success": False, "error": result.get("error", "AI调用失败")}
        try:
            parsed = self._parse_json_response(result["content"])
            if parsed:
                return {"success": True, "data": parsed, "type": "data_story"}
        except Exception as e:
            logger.error(f"Data story解析失败: {e}")
        return {"success": False, "error": "AI返回格式解析失败"}

    def generate_persuasion(
        self,
        topic: str,
        scene: str = "business",
        slide_count: int = 10,
        audience: str = "商务人士"
    ) -> Dict[str, Any]:
        """生成说服技巧内容"""
        prompt = PERSUASION_PROMPT.format(
            topic=topic,
            scene=scene,
            slide_count=slide_count,
            audience=audience
        )
        result = self.volc.text_generation(
            prompt=prompt,
            temperature=0.7,
            max_tokens=8192
        )
        if not result.get("success"):
            return {"success": False, "error": result.get("error", "AI调用失败")}
        try:
            parsed = self._parse_json_response(result["content"])
            if parsed:
                return {"success": True, "data": parsed, "type": "persuasion"}
        except Exception as e:
            logger.error(f"Persuasion解析失败: {e}")
        return {"success": False, "error": "AI返回格式解析失败"}

    def generate_audience_persona(
        self,
        topic: str,
        scene: str = "business",
        slide_count: int = 10,
        audience_description: str = ""
    ) -> Dict[str, Any]:
        """生成受众画像定制内容"""
        prompt = AUDIENCE_PERSONA_PROMPT.format(
            topic=topic,
            scene=scene,
            slide_count=slide_count,
            audience_description=audience_description or "商务专业人士"
        )
        result = self.volc.text_generation(
            prompt=prompt,
            temperature=0.7,
            max_tokens=8192
        )
        if not result.get("success"):
            return {"success": False, "error": result.get("error", "AI调用失败")}
        try:
            parsed = self._parse_json_response(result["content"])
            if parsed:
                return {"success": True, "data": parsed, "type": "audience_persona"}
        except Exception as e:
            logger.error(f"Audience persona解析失败: {e}")
        return {"success": False, "error": "AI返回格式解析失败"}

    def generate_competitor_analysis(
        self,
        topic: str,
        scene: str = "business",
        slide_count: int = 10,
        brief_description: str = ""
    ) -> Dict[str, Any]:
        """生成竞品分析幻灯片"""
        prompt = COMPETITOR_ANALYSIS_PROMPT.format(
            topic=topic,
            scene=scene,
            slide_count=slide_count,
            brief_description=brief_description or topic
        )
        result = self.volc.text_generation(
            prompt=prompt,
            temperature=0.6,
            max_tokens=8192
        )
        if not result.get("success"):
            return {"success": False, "error": result.get("error", "AI调用失败")}
        try:
            parsed = self._parse_json_response(result["content"])
            if parsed:
                return {"success": True, "data": parsed, "type": "competitor_analysis"}
        except Exception as e:
            logger.error(f"Competitor analysis解析失败: {e}")
        return {"success": False, "error": "AI返回格式解析失败"}

    def generate(
        self,
        content_type: str,
        topic: str,
        scene: str = "business",
        slide_count: int = 10,
        audience: str = "",
        brief_description: str = ""
    ) -> Dict[str, Any]:
        """统一入口：根据content_type调用对应生成器"""
        if content_type == "story_arc":
            return self.generate_story_arc(topic, scene, slide_count, audience or "商务人士")
        elif content_type == "data_story":
            return self.generate_data_story(topic, scene, slide_count)
        elif content_type == "persuasion":
            return self.generate_persuasion(topic, scene, slide_count, audience or "商务人士")
        elif content_type == "audience_persona":
            return self.generate_audience_persona(topic, scene, slide_count, audience)
        elif content_type == "competitor_analysis":
            return self.generate_competitor_analysis(topic, scene, slide_count, brief_description)
        else:
            return {"success": False, "error": f"Unknown content_type: {content_type}"}
