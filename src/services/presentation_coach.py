# -*- coding: utf-8 -*-
"""
AI Presentation Coach Service
AI演讲教练服务 - 分析幻灯片、提供练习、建议节奏、演讲技巧、预测观众问题
"""
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json
import re

logger = logging.getLogger(__name__)


@dataclass
class SlideContent:
    """幻灯片内容"""
    slide_num: int
    title: str
    content: str  # 可能是纯文本、bullet points等
    layout: str = ""
    presenter_notes: str = ""


@dataclass
class CoachFeedback:
    """教练反馈"""
    slide_num: int
    overall_score: int  # 1-10
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    structure_score: int = 0
    content_score: int = 0
    design_score: int = 0
    engagement_score: int = 0


@dataclass
class TimingAdvice:
    """时间节奏建议"""
    total_slides: int
    suggested_total_minutes: float
    per_slide_seconds: List[Dict[str, Any]]
    pace_feedback: str
    recommended_pause_points: List[int]
    tips: List[str] = field(default_factory=list)


@dataclass
class DeliveryTip:
    """演讲技巧建议"""
    slide_num: int
    key_message: str
    emphasis_points: List[str]
    voice_tips: str
    body_language: str
    transition_phrase: str  # 到下一页的过渡语


@dataclass
class AudienceQuestion:
    """观众可能提问"""
    question: str
    category: str  # 澄清/质疑/建议/深层
    difficulty: str  # easy/moderate/hard
    slide_ref: int  # 相关幻灯片编号
    suggested_answer: str = ""


class PresentationCoachService:
    """AI演讲教练服务"""
    
    def __init__(self, volc_api=None):
        self.volc_api = volc_api
        self._slides_cache: Dict[str, List[SlideContent]] = {}
    
    def _get_api(self):
        from .volc_api import get_volc_api
        return self.volc_api or get_volc_api()
    
    # ==================== 1. Presentation Coach - 分析幻灯片 ====================
    
    def analyze_slides(self, task_id: str, slides: List[Dict]) -> Dict[str, Any]:
        """
        分析所有幻灯片，给出整体反馈和改进建议
        
        Args:
            task_id: 任务ID
            slides: 幻灯片列表，每个包含 title, content, layout, notes
            
        Returns:
            包含分析结果的字典
        """
        api = self._get_api()
        
        # 提取文本内容
        slide_texts = []
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】{title}\n{content}")
        
        all_text = "\n\n".join(slide_texts)
        
        # 限制分析文本长度
        if len(all_text) > 3000:
            all_text = all_text[:3000] + "\n\n[内容已截断...]"
        
        prompt = f"""你是一个专业的PPT演讲教练。请分析以下演示文稿的内容，并给出评分和建议。

{all_text}

请从以下5个维度评估（每项1-10分）：
1. 结构（Structure）：逻辑是否清晰、层次是否分明
2. 内容（Content）：信息是否准确、是否有价值
3. 设计（Design）：是否简洁、是否易读
4. 参与度（Engagement）：是否能吸引观众、是否有亮点
5. 演讲准备（Delivery Ready）：是否容易演讲、是否有过渡

请同时给出：
- 每页的优缺点（ strengths / weaknesses）
- 具体改进建议（ suggestions）
- 整体综合评分（ overall_score）

请按以下JSON格式返回（不要包含任何其他文字）：
{{
    "overall_score": 8,
    "structure_score": 8,
    "content_score": 9,
    "design_score": 7,
    "engagement_score": 8,
    "overall_feedback": "整体反馈文字（100字以内）",
    "slide_feedback": [
        {{
            "slide_num": 1,
            "strengths": ["优点1", "优点2"],
            "weaknesses": ["缺点1"],
            "suggestions": ["建议1", "建议2"]
        }},
        ...
    ],
    "top_3_improvements": ["最重要的改进建议1", "最重要的改进建议2", "最重要的改进建议3"]
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=2000)
            if response.get("success"):
                content = response.get("content", "")
                # 提取JSON
                data = self._extract_json(content)
                if data:
                    return {
                        "success": True,
                        "task_id": task_id,
                        "analysis": data,
                        "analyzed_at": datetime.now().isoformat()
                    }
            return {"success": False, "error": "AI分析失败，请重试"}
        except Exception as e:
            logger.error(f"分析幻灯片失败: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== 2. Practice Mode - Q&A 练习 ====================
    
    def generate_practice_qa(self, task_id: str, slides: List[Dict], difficulty: str = "mixed") -> Dict[str, Any]:
        """
        生成练习问答，模拟观众可能的提问
        
        Args:
            task_id: 任务ID
            slides: 幻灯片列表
            difficulty: 难度级别 easy / moderate / hard / mixed
            
        Returns:
            问答列表
        """
        api = self._get_api()
        
        slide_texts = []
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】{title}\n{content}")
        
        all_text = "\n\n".join(slide_texts)
        
        if len(all_text) > 3000:
            all_text = all_text[:3000] + "\n\n[内容已截断...]"
        
        difficulty_instruction = {
            "easy": "问题应该简单，主要测试观众是否理解基本概念",
            "moderate": "问题应该有一定深度，需要观众思考后才能回答",
            "hard": "问题应该深入或具有挑战性，测试演讲者对主题的掌握深度",
            "mixed": "混合简单、中等、困难三类问题"
        }.get(difficulty, "混合简单、中等、困难三类问题")
        
        prompt = f"""你是一个演讲培训师。基于以下演示文稿的内容，生成8-12个观众可能提出的练习问答。

{difficulty_instruction}

演示文稿内容：
{all_text}

请生成多样化的问答，涵盖：
- 澄清性问题（要求解释不清楚的地方）
- 质疑性问题（挑战或质疑你的观点）
- 建议性问题（提出改进或补充）
- 深层问题（需要展开讨论的）

请按以下JSON格式返回：
{{
    "total_questions": 10,
    "estimated_practice_minutes": 15,
    "questions": [
        {{
            "question": "问题内容",
            "category": "clarification|challenge|suggestion|deep_dive",
            "difficulty": "easy|moderate|hard",
            "slide_ref": 3,
            "suggested_answer": "建议回答要点（50字以内）",
            "tips": "回答技巧提示"
        }},
        ...
    ]
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=2500)
            if response.get("success"):
                content = response.get("content", "")
                data = self._extract_json(content)
                if data:
                    return {
                        "success": True,
                        "task_id": task_id,
                        "qa_list": data.get("questions", []),
                        "estimated_minutes": data.get("estimated_practice_minutes", 15),
                        "difficulty": difficulty
                    }
            return {"success": False, "error": "生成练习问答失败，请重试"}
        except Exception as e:
            logger.error(f"生成Q&A失败: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== 3. Timing Advisor - 时间节奏 ====================
    
    def get_timing_advice(self, task_id: str, slides: List[Dict], total_minutes: float = 15.0) -> Dict[str, Any]:
        """
        根据内容长度建议每页的演讲时间
        
        Args:
            task_id: 任务ID
            slides: 幻灯片列表
            total_minutes: 总演讲时间（分钟）
            
        Returns:
            每页时间分配和建议
        """
        slide_count = len(slides)
        
        if slide_count == 0:
            return {"success": False, "error": "没有幻灯片内容"}
        
        # 分析每页内容复杂度
        per_slide_data = []
        total_content_score = 0
        
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                bullet_count = len(content)
                content_text = "\n".join(content)
            else:
                bullet_count = len(content.split("\n")) if content else 0
                content_text = content
            
            # 简单估算内容复杂度
            word_count = len(content_text)
            has_numbers = bool(re.search(r'\d+', content_text))
            has_chart = "chart" in str(s.get("layout", "")).lower()
            
            content_score = min(10, word_count // 50 + bullet_count + (2 if has_numbers else 0) + (3 if has_chart else 0))
            total_content_score += content_score
            
            per_slide_data.append({
                "slide_num": i + 1,
                "title": title[:30] + "..." if len(title) > 30 else title,
                "word_count": word_count,
                "bullet_count": bullet_count,
                "has_data": has_numbers,
                "complexity_score": content_score
            })
        
        # 计算时间分配
        available_seconds = total_minutes * 60
        avg_seconds_per_score = available_seconds / total_content_score if total_content_score > 0 else 30
        
        timing_results = []
        for slide in per_slide_data:
            suggested_seconds = max(15, min(180, int(avg_seconds_per_score * slide["complexity_score"])))
            
            # 根据页码调整（封面/结尾可以稍长）
            if slide["slide_num"] == 1:
                suggested_seconds = max(suggested_seconds, 30)
            if slide["slide_num"] == slide_count:
                suggested_seconds = max(suggested_seconds, 20)
            
            timing_results.append({
                "slide_num": slide["slide_num"],
                "title": slide["title"],
                "suggested_seconds": suggested_seconds,
                "tip": self._get_slide_timing_tip(slide, suggested_seconds)
            })
        
        # 推荐暂停点
        pause_points = self._find_pause_points(slide_count, per_slide_data)
        
        # 整体节奏反馈
        if slide_count > 0:
            avg_per_slide = available_seconds / slide_count
            if avg_per_slide < 20:
                pace_feedback = "节奏较快，建议减少每页内容或增加总时间"
            elif avg_per_slide > 90:
                pace_feedback = "节奏较慢，建议增加更多内容或减少幻灯片"
            else:
                pace_feedback = f"节奏良好，每页平均 {int(avg_per_slide)} 秒"
        else:
            pace_feedback = "无法评估节奏"
        
        tips = [
            f"总时间 {total_minutes} 分钟，{slide_count} 页幻灯片",
            f"建议开场介绍 1-2 分钟",
            f"建议结尾总结 1-2 分钟",
            "每页之间可以自然停顿 2-3 秒",
            "遇到数据页可以放慢语速"
        ]
        
        return {
            "success": True,
            "task_id": task_id,
            "total_slides": slide_count,
            "total_minutes": total_minutes,
            "per_slide_seconds": timing_results,
            "pause_points": pause_points,
            "pace_feedback": pace_feedback,
            "tips": tips,
            "breakdown": {
                "introduction": min(2.0, total_minutes * 0.1),
                "content": total_minutes * 0.8,
                "conclusion": min(2.0, total_minutes * 0.1)
            }
        }
    
    def _get_slide_timing_tip(self, slide: Dict, seconds: int) -> str:
        """根据幻灯片特点给出时间建议"""
        if seconds < 30:
            return "快速浏览即可"
        elif seconds < 60:
            return "简要介绍要点"
        elif seconds < 90:
            return "详细讲解"
        else:
            return "深入讨论的时间"
    
    def _find_pause_points(self, slide_count: int, per_slide_data: List[Dict]) -> List[int]:
        """找到适合暂停的点"""
        pause_points = []
        
        # 找出内容复杂度明显变化的点
        for i in range(1, len(per_slide_data)):
            prev_score = per_slide_data[i-1]["complexity_score"]
            curr_score = per_slide_data[i]["complexity_score"]
            
            # 复杂度大幅增加或减少的点适合暂停
            if abs(curr_score - prev_score) >= 4:
                pause_points.append(i + 1)  # 1-based
        
        # 每隔3-4页建议一个暂停
        for i in range(3, slide_count, 4):
            if i + 1 not in pause_points:
                pause_points.append(i + 1)
        
        return sorted(set(pause_points))[:5]  # 最多5个暂停点
    
    # ==================== 4. Delivery Tips - 演讲技巧 ====================
    
    def get_delivery_tips(self, task_id: str, slides: List[Dict]) -> Dict[str, Any]:
        """
        分析内容，给出每页的演讲技巧建议
        
        Args:
            task_id: 任务ID
            slides: 幻灯片列表
            
        Returns:
            每页的演讲技巧
        """
        api = self._get_api()
        
        slide_texts = []
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】{title}\n{content}")
        
        all_text = "\n\n".join(slide_texts)
        
        if len(all_text) > 2500:
            all_text = all_text[:2500] + "\n\n[内容已截断...]"
        
        prompt = f"""你是一个专业的演讲教练。请为以下演示文稿的每一页提供演讲技巧建议。

演示文稿内容：
{all_text}

请为每页提供：
1. 核心信息（key_message）：这一页想让观众记住什么
2. 强调要点（emphasis_points）：演讲时需要特别强调的词或句子
3. 语音技巧（voice_tips）：语速、语调、停顿建议
4. 肢体语言（body_language）：站姿、手势、眼神建议
5. 过渡语（transition_phrase）：从这一页到下一页的连接语

请按以下JSON格式返回：
{{
    "delivery_tips": [
        {{
            "slide_num": 1,
            "key_message": "核心信息",
            "emphasis_points": ["强调1", "强调2"],
            "voice_tips": "语音技巧建议（30字以内）",
            "body_language": "肢体语言建议（30字以内）",
            "transition_phrase": "过渡到下一页的话"
        }},
        ...
    ],
    "general_tips": [
        "通用建议1",
        "通用建议2",
        "通用建议3"
    ]
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=2500)
            if response.get("success"):
                content = response.get("content", "")
                data = self._extract_json(content)
                if data:
                    return {
                        "success": True,
                        "task_id": task_id,
                        "tips": data.get("delivery_tips", []),
                        "general_tips": data.get("general_tips", [])
                    }
            return {"success": False, "error": "生成演讲技巧失败，请重试"}
        except Exception as e:
            logger.error(f"生成演讲技巧失败: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== 5. Audience Prediction - 观众预测 ====================
    
    def predict_audience_questions(self, task_id: str, slides: List[Dict], audience_profile: str = "") -> Dict[str, Any]:
        """
        预测观众可能提出的问题
        
        Args:
            task_id: 任务ID
            slides: 幻灯片列表
            audience_profile: 观众画像描述（如"技术高管"、"大学生"、"投资者"）
            
        Returns:
            预测的问题列表
        """
        api = self._get_api()
        
        slide_texts = []
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】{title}\n{content}")
        
        all_text = "\n\n".join(slide_texts)
        
        if len(all_text) > 3000:
            all_text = all_text[:3000] + "\n\n[内容已截断...]"
        
        audience_context = f"目标观众：{audience_profile}" if audience_profile else "目标观众：一般商务人士"
        
        prompt = f"""你是一个经验丰富的演讲者，擅长预测观众会问的问题。

{audience_context}

演示文稿内容：
{all_text}

请预测8-12个观众最可能提出的问题，考虑：
1. 演讲中没有讲清楚的地方
2. 观众自然会好奇的深层问题
3. 对演讲者观点的质疑或挑战
4. 听众角色相关的问题（如投资者关心ROI，学生关心考试重点）

请按以下JSON格式返回：
{{
    "questions": [
        {{
            "question": "问题内容",
            "category": "clarification|challenge|suggestion|deep_dive|technical|commercial",
            "difficulty": "easy|moderate|hard",
            "slide_ref": 3,
            "why_likely": "为什么观众会问这个问题（15字以内）",
            "suggested_answer": "建议回答框架（60字以内）",
            "preparation_tip": "提前准备这个问题的建议"
        }},
        ...
    ],
    "hardest_question": {{
        "question": "最难回答的问题",
        "why_hard": "为什么难",
        "strategy": "应对策略"
    }},
    "must_prepare": ["必须准备的3个问题"]
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=3000)
            if response.get("success"):
                content = response.get("content", "")
                data = self._extract_json(content)
                if data:
                    return {
                        "success": True,
                        "task_id": task_id,
                        "audience_profile": audience_profile or "一般商务人士",
                        "questions": data.get("questions", []),
                        "hardest_question": data.get("hardest_question"),
                        "must_prepare": data.get("must_prepare", [])
                    }
            return {"success": False, "error": "预测观众问题失败，请重试"}
        except Exception as e:
            logger.error(f"预测观众问题失败: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== 辅助方法 ====================
    
    def _extract_json(self, text: str) -> Optional[Dict]:
        """从文本中提取JSON"""
        try:
            # 尝试直接解析
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass
        
        # 尝试提取代码块
        patterns = [
            r'```json\s*([\s\S]*?)\s*```',
            r'```\s*([\s\S]*?)\s*```',
            r'\{[\s\S]*\}$',  # 最后一个 {...}
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return json.loads(match.group(1).strip())
                except json.JSONDecodeError:
                    continue
        
        return None
    
    # ==================== 快捷方法 ====================
    
    def quick_score(self, slides: List[Dict]) -> int:
        """
        快速评分（不需要AI）
        基于简单规则快速给出1-10分
        """
        if not slides:
            return 5
        
        score = 7  # 基础分
        
        for s in slides:
            content = s.get("content", "")
            if isinstance(content, list):
                bullet_count = len(content)
            else:
                bullet_count = len(content.split("\n")) if content else 0
            
            # 每页bullet点数量适中（3-6个）加分
            if 3 <= bullet_count <= 6:
                score += 0.3
            elif bullet_count > 8:
                score -= 0.5
            elif bullet_count == 0:
                score -= 0.3
            
            # 有标题加分
            if s.get("title"):
                score += 0.2
        
        return max(1, min(10, int(score)))


# 全局实例
_coach_service: Optional[PresentationCoachService] = None


def get_presentation_coach_service() -> PresentationCoachService:
    """获取教练服务实例"""
    global _coach_service
    if _coach_service is None:
        _coach_service = PresentationCoachService()
    return _coach_service
