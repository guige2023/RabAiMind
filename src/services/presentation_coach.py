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
    # ==================== R127: Delivery Coach - Speaking Pace Analysis ====================
    
    def analyze_speaking_pace(self, task_id: str, slides: List[Dict], total_minutes: float = 15.0, 
                               actual_words: Optional[int] = None) -> Dict[str, Any]:
        api = self._get_api()
        if actual_words is None:
            total_words = 0
            for s in slides:
                content = s.get("content", "")
                if isinstance(content, list):
                    total_words += sum(len(str(c)) for c in content)
                elif content:
                    total_words += len(content)
                title = s.get("title", "")
                if title:
                    total_words += len(title)
        else:
            total_words = actual_words
        
        wpm = int(total_words / total_minutes) if total_minutes > 0 else 0
        
        if wpm < 80:
            pace_category = "太慢"
            pace_icon = "🐢"
            pace_feedback = "语速偏慢，可能会让观众失去兴趣。建议适当加快节奏。"
        elif wpm < 120:
            pace_category = "偏慢"
            pace_icon = "🚶"
            pace_feedback = "语速偏慢，但适合详细讲解重要内容。可以适当加快。"
        elif wpm <= 150:
            pace_category = "适中"
            pace_icon = "✅"
            pace_feedback = "语速适中，符合专业演讲标准。"
        elif wpm <= 180:
            pace_category = "偏快"
            pace_icon = "🏃"
            pace_feedback = "语速偏快，观众可能跟不上。建议适当放慢或在重点处停顿。"
        else:
            pace_category = "太快"
            pace_icon = "⚠️"
            pace_feedback = "语速过快，观众容易疲劳。建议大幅放慢。"
        
        slide_count = len(slides)
        suggested_pauses = max(1, slide_count // 4)
        
        slide_texts = []
        for i, s in enumerate(slides[:5]):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】{title}\n{content[:200]}")
        
        all_text = "\n\n".join(slide_texts)
        if len(all_text) > 1500:
            all_text = all_text[:1500]
        
        detailed_tips = []
        try:
            prompt = f"""你是一个专业演讲教练。请分析以下内容的语速建议。

内容预览：
{all_text}

当前估算：{wpm} WPM（每分钟{wpm}词），总{total_minutes}分钟。

请给出3-5条改善语速的具体建议。

请按以下JSON格式返回：
{{
    "tips": ["建议1（30字以内）", "建议2（30字以内）", "建议3（30字以内）"],
    "pace_evaluation": "整体评价（20字以内）"
}}

请只返回JSON。"""
            response = api.text_generation(prompt=prompt, max_tokens=800)
            if response.get("success"):
                data = self._extract_json(response.get("content", ""))
                if data:
                    detailed_tips = data.get("tips", [])
        except Exception as e:
            logger.warning(f"AI detailed tips failed: {e}")
        
        return {
            "success": True,
            "task_id": task_id,
            "wpm": wpm,
            "total_words": total_words,
            "total_minutes": total_minutes,
            "pace_category": pace_category,
            "pace_icon": pace_icon,
            "pace_feedback": pace_feedback,
            "suggested_pauses": suggested_pauses,
            "tips": detailed_tips or [
                f"建议语速保持在 120-150 WPM",
                "重点数据处放慢语速",
                "每页之间停顿2-3秒"
            ],
            "per_slide_pace": [
                {
                    "slide_num": i + 1,
                    "title": s.get("title", "")[:30],
                    "estimated_words": len(s.get("content", "")) if isinstance(s.get("content"), str) else sum(len(str(c)) for c in s.get("content", [])),
                    "suggested_seconds": max(15, int(60 * (len(s.get("content", "")) if isinstance(s.get("content"), str) else 50) / wpm)) if wpm > 0 else 30
                }
                for i, s in enumerate(slides)
            ]
        }
    
    # ==================== R127: Content Score - Clarity, Conciseness, Impact ====================
    
    def analyze_content_dimensions(self, task_id: str, slides: List[Dict]) -> Dict[str, Any]:
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
            all_text = all_text[:3000] + "\n\n[内容已截断]"
        
        prompt = f"""你是一个专业的PPT内容评审专家。请从以下三个维度评估内容质量：

1. 清晰度（Clarity）：内容是否易于理解？逻辑是否清晰？
2. 简洁度（Conciseness）：是否简洁明了？没有冗余信息？
3. 影响力（Impact）：是否有说服力？是否能打动观众？

内容：
{all_text}

请按以下JSON格式返回评分和分析：
{{
    "clarity_score": 8,
    "conciseness_score": 7,
    "impact_score": 8,
    "overall_content_score": 8,
    "clarity_analysis": "清晰度分析（50字以内）",
    "conciseness_analysis": "简洁度分析（50字以内）",
    "impact_analysis": "影响力分析（50字以内）",
    "clarity_weaknesses": ["弱点1", "弱点2"],
    "conciseness_weaknesses": ["冗余1", "冗余2"],
    "impact_improvements": ["改进建议1", "改进建议2"],
    "per_slide_scores": [
        {{"slide_num": 1, "clarity": 8, "conciseness": 7, "impact": 8, "verdict": "这页的评价（20字以内）"}},
        ...
    ],
    "top_content_improvements": ["最重要的内容改进建议1", "最重要的内容改进建议2", "最重要的内容改进建议3"]
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=2500)
            if response.get("success"):
                content = response.get("content", "")
                data = self._extract_json(content)
                if data:
                    return {"success": True, "task_id": task_id, **data, "analyzed_at": datetime.now().isoformat()}
            return {"success": False, "error": "内容分析失败，请重试"}
        except Exception as e:
            logger.error(f"内容维度分析失败: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== R127: Visual Design Feedback ====================
    
    def analyze_visual_design(self, task_id: str, slides: List[Dict]) -> Dict[str, Any]:
        api = self._get_api()
        
        slide_texts = []
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            layout = s.get("layout", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】布局:{layout} 标题:{title} 内容:{content[:300]}")
        
        all_text = "\n\n".join(slide_texts)
        if len(all_text) > 3000:
            all_text = all_text[:3000]
        
        prompt = f"""你是一个专业的PPT视觉设计师。请评价以下幻灯片的视觉设计质量。

幻灯片信息：
{all_text}

请从以下维度评估（每项1-10分）：
1. 布局合理性（Layout）：元素是否平衡、有层次？
2. 配色协调性（Color）：颜色是否搭配和谐？
3. 字体层级（Typography）：标题/正文字体大小是否清晰？
4. 留白利用（White Space）：空白是否得当？
5. 视觉一致性（Consistency）：整体风格是否统一？

请按以下JSON格式返回：
{{
    "layout_score": 7,
    "color_score": 8,
    "typography_score": 7,
    "whitespace_score": 6,
    "consistency_score": 8,
    "overall_design_score": 7,
    "layout_analysis": "布局分析（40字以内）",
    "color_analysis": "配色分析（40字以内）",
    "typography_analysis": "字体层级分析（40字以内）",
    "whitespace_analysis": "留白分析（40字以内）",
    "consistency_analysis": "一致性分析（40字以内）",
    "common_issues": ["共同问题1", "共同问题2"],
    "design_strengths": ["设计优点1", "优点2"],
    "per_slide_feedback": [
        {{"slide_num": 1, "layout_score": 7, "color_score": 8, "typography_score": 7, "issues": ["问题1"], "suggestions": ["建议1"]}},
        ...
    ],
    "top_3_design_improvements": ["最重要的视觉改进建议1", "最重要的视觉改进建议2", "最重要的视觉改进建议3"]
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=3000)
            if response.get("success"):
                content = response.get("content", "")
                data = self._extract_json(content)
                if data:
                    return {"success": True, "task_id": task_id, **data, "analyzed_at": datetime.now().isoformat()}
            return {"success": False, "error": "视觉设计分析失败，请重试"}
        except Exception as e:
            logger.error(f"视觉设计分析失败: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== R127: Audience Engagement Prediction ====================
    
    def predict_audience_engagement(self, task_id: str, slides: List[Dict], 
                                   audience_profile: str = "") -> Dict[str, Any]:
        api = self._get_api()
        
        slide_texts = []
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】{title}\n{content[:300]}")
        
        all_text = "\n\n".join(slide_texts)
        if len(all_text) > 3000:
            all_text = all_text[:3000]
        
        audience_context = f"目标观众：{audience_profile}" if audience_profile else "目标观众：一般商务人士"
        
        prompt = f"""你是一个专业的演讲心理学专家。请预测观众在演讲过程中每个阶段的参与度和情感反应。

{audience_context}

演讲内容：
{all_text}

请预测：
1. 每页/每个阶段的观众情绪（兴趣/疲劳/疑惑/兴奋）
2. 注意力变化（高/中/低）
3. 可能的情感反应
4. 最吸引观众的时刻
5. 观众可能走神的时刻

请按以下JSON格式返回：
{{
    "audience_profile": "观众画像描述",
    "predicted_attention_score": 7,
    "predicted_engagement_score": 8,
    "predicted_emotion_curve": [
        {{"slide_range": "1-3", "phase": "开场", "predicted_emotion": "好奇/期待", "attention_level": "high", "engagement": "high", "reason": "为什么这个阶段观众会这样反应"}},
        ...
    ],
    "most_engaging_moment": {{"slide_num": 5, "reason": "为什么这页最吸引人"}},
    "least_engaging_moment": {{"slide_num": 8, "reason": "为什么这页最无聊"}},
    "engagement_tips": ["提升观众参与度的建议1", "建议2", "建议3"],
    "emotional_peaks": [{{"slide_num": 3, "emotion": "兴奋", "trigger": "什么触发了这个情绪"}}],
    "fatigue_risks": [{{"slide_range": "7-9", "risk_level": "high", "reason": "为什么观众可能疲劳"}}],
    "overall_prediction": "整体预测总结（60字以内）"
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=3000)
            if response.get("success"):
                content = response.get("content", "")
                data = self._extract_json(content)
                if data:
                    return {"success": True, "task_id": task_id, **data, "analyzed_at": datetime.now().isoformat()}
            return {"success": False, "error": "观众参与度预测失败，请重试"}
        except Exception as e:
            logger.error(f"观众参与度预测失败: {e}")
            return {"success": False, "error": str(e)}
    
    # ==================== R127: Personalized Coaching Based on Past Presentations ====================
    
    def get_personalized_coaching(self, task_id: str, slides: List[Dict], 
                                   user_id: str = "default") -> Dict[str, Any]:
        from pathlib import Path
        
        history_file = Path.home() / ".rabai" / "coach_history.json"
        history_data = {}
        
        if history_file.exists():
            try:
                with open(history_file, "r", encoding="utf-8") as f:
                    history_data = json.load(f)
            except Exception:
                history_data = {}
        
        user_history = history_data.get(user_id, {}).get("sessions", [])
        
        api = self._get_api()
        
        slide_texts = []
        for i, s in enumerate(slides):
            title = s.get("title", "")
            content = s.get("content", "")
            if isinstance(content, list):
                content = "\n".join(content)
            slide_texts.append(f"【第{i+1}页】{title}\n{content[:300]}")
        
        all_text = "\n\n".join(slide_texts)
        if len(all_text) > 2500:
            all_text = all_text[:2500]
        
        common_past_issues = []
        improvement_trends = []
        
        if user_history:
            all_issues = []
            for session in user_history[-5:]:
                issues = session.get("issues", [])
                all_issues.extend(issues)
            
            from collections import Counter
            issue_counts = Counter(all_issues)
            common_past_issues = [issue for issue, count in issue_counts.most_common(5)]
            
            if len(user_history) >= 2:
                old_score = user_history[-2].get("score", 7)
                new_score = user_history[-1].get("score", 7)
                if new_score > old_score:
                    improvement_trends.append("你的演讲评分正在提升，继续保持！")
                elif new_score < old_score:
                    improvement_trends.append("近期评分有所下降，建议加强练习")
                else:
                    improvement_trends.append("评分保持稳定，建议寻求突破")
        
        history_context = f"历史演讲次数：{len(user_history)}"
        if common_past_issues:
            history_context += f"\n常见问题：{', '.join(common_past_issues[:3])}"
        if improvement_trends:
            history_context += f"\n趋势：{improvement_trends[0]}"
        
        prompt = f"""你是一个个性化演讲教练。你需要根据用户的历史表现和当前内容，提供定制化的改进建议。

用户历史信息：
{history_context}

当前演讲内容：
{all_text}

请根据历史数据和当前内容，提供：
1. 针对性改进（针对用户过去常犯的问题）
2. 保持优点（用户历史上做得好需要继续保持的）
3. 本次演讲的特殊建议

请按以下JSON格式返回：
{{
    "personalized_tips": [
        {{"category": "针对历史问题", "tip": "具体建议（30字以内）", "reason": "为什么这个建议适合你"}},
        {{"category": "保持优点", "tip": "继续保持的优点（30字以内）", "reason": "为什么这个要保持"}},
        {{"category": "本次特别建议", "tip": "针对本次内容的建议（30字以内）", "reason": "为什么本次需要这样"}}
    ],
    "historical_summary": "历史表现总结（40字以内）",
    "coaching_focus": "本次教练重点（20字以内）",
    "improvement_priority": ["最优先改进1", "最优先改进2", "最优先改进3"],
    "confidence_boost": "提升自信的建议（30字以内）"
}}

请只返回JSON。"""

        try:
            response = api.text_generation(prompt=prompt, max_tokens=2000)
            personalized_result = {}
            if response.get("success"):
                data = self._extract_json(response.get("content", ""))
                if data:
                    personalized_result = data
            
            result = {
                "success": True,
                "task_id": task_id,
                "user_id": user_id,
                "total_past_sessions": len(user_history),
                "has_history": len(user_history) > 0,
                "common_past_issues": common_past_issues[:5],
                "improvement_trends": improvement_trends,
                **personalized_result,
                "analyzed_at": datetime.now().isoformat()
            }
            
            self._save_coaching_session(user_id, task_id, slides, result, history_file)
            return result
            
        except Exception as e:
            logger.error(f"个性化教练失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _save_coaching_session(self, user_id: str, task_id: str, slides: List[Dict],
                                result: Dict[str, Any], history_file: Path) -> None:
        try:
            history_file.parent.mkdir(parents=True, exist_ok=True)
            history_data = {}
            if history_file.exists():
                try:
                    with open(history_file, "r", encoding="utf-8") as f:
                        history_data = json.load(f)
                except Exception:
                    history_data = {}
            
            if user_id not in history_data:
                history_data[user_id] = {"sessions": []}
            
            session = {
                "task_id": task_id,
                "timestamp": datetime.now().isoformat(),
                "slide_count": len(slides),
                "score": result.get("overall_content_score") or result.get("overall_design_score") or 7,
                "issues": result.get("common_past_issues", [])[:3],
                "focus": result.get("coaching_focus", "")
            }
            
            history_data[user_id]["sessions"].append(session)
            history_data[user_id]["sessions"] = history_data[user_id]["sessions"][-20:]
            
            with open(history_file, "w", encoding="utf-8") as f:
                json.dump(history_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"保存教练历史失败: {e}")

_coach_service: Optional[PresentationCoachService] = None


def get_presentation_coach_service() -> PresentationCoachService:
    """获取教练服务实例"""
    global _coach_service
    if _coach_service is None:
        _coach_service = PresentationCoachService()
    return _coach_service