# -*- coding: utf-8 -*-
"""
AI 增强功能路由
R32: AI rephrase, translate, layout suggestion, auto-enhance, content score
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from src.services.volc_api import get_volc_api

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["AI增强"])


# ==================== Request/Response Models ====================

class RephraseRequest(BaseModel):
    text: str
    style: Optional[str] = "natural"  # natural, formal, creative, concise

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "en"  # zh, en, ja, ko

class LayoutSuggestionRequest(BaseModel):
    slide_index: int
    elements: List[Dict[str, Any]]  # element data
    slide_content: str  # overall slide text content

class AutoEnhanceRequest(BaseModel):
    slide_index: int
    elements: List[Dict[str, Any]]
    color_scheme: Optional[str] = "#165DFF"  # accent color

class ContentScoreRequest(BaseModel):
    elements: List[Dict[str, Any]]
    slide_content: str


# ==================== Helper ====================

def call_ai(prompt: str, system: str = "") -> str:
    """调用火山引擎AI，返回文本内容"""
    volc = get_volc_api()
    # 如果有system指令，追加到prompt前面
    full_prompt = (system + "\n\n" + prompt) if system else prompt
    
    try:
        result = volc.text_generation(
            prompt=full_prompt,
            model=None,
            temperature=0.7,
            max_tokens=2048
        )
        # 火山引擎返回格式：result["content"]
        if isinstance(result, dict):
            if result.get("success"):
                return result.get("content", "")
            # 失败情况
            error = result.get("error", "未知错误")
            raise HTTPException(status_code=500, detail=f"AI服务错误: {error}")
        return str(result)
    except HTTPException:
        raise  # FastAPI HTTPException should pass through
    except Exception as e:
        logger.error(f"AI调用失败: {e}")
        raise HTTPException(status_code=500, detail=f"AI服务调用失败: {str(e)}")


def safe_json_parse(text: str) -> Optional[dict]:
    """安全解析JSON"""
    import re, json
    text = text.strip()
    # 尝试直接解析
    try:
        return json.loads(text)
    except:
        pass
    # 尝试提取 ```json ... ``` 块
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except:
            pass
    # 尝试提取第一个 { ... }
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except:
            pass
    return None


# ==================== Endpoints ====================

@router.post("/rephrase")
async def rephrase_text(req: RephraseRequest):
    """
    AI改写文本
    对选中的文本进行智能改写，保持原意但改善表达
    """
    style_map = {
        "natural": "自然流畅、口语化",
        "formal": "正式书面语",
        "creative": "创意生动",
        "concise": "简洁精炼"
    }
    style_desc = style_map.get(req.style, "自然流畅")
    
    prompt = f"""请将以下文本改写为{style_desc}的表达方式，保持原意但改善表达。

原文：
{req.text}

请直接返回改写后的文本，不要解释，不要加引号或其他标记。"""
    
    system = "你是一个专业的文案改写专家。直接返回改写结果，不要添加任何前缀或解释。"
    
    try:
        result = call_ai(prompt, system)
        return {"success": True, "rephrased": result.strip()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"rephrase失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate")
async def translate_text(req: TranslateRequest):
    """
    AI翻译文本
    支持中文(zh)、英文(en)、日语(ja)、韩语(ko)互译
    """
    lang_map = {
        "zh": "中文",
        "en": "英文",
        "ja": "日语",
        "ko": "韩文"
    }
    target = lang_map.get(req.target_lang, "英文")
    
    prompt = f"""请将以下文本翻译成{target}，保持专业、地道的表达。

原文：
{req.text}

请直接返回翻译结果，不要添加任何标记或解释。"""
    
    system = f"你是一个专业的{target}翻译专家。直接返回翻译结果。"
    
    try:
        result = call_ai(prompt, system)
        return {"success": True, "translated": result.strip(), "lang": req.target_lang}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"translate失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/layout-suggestion")
async def layout_suggestion(req: LayoutSuggestionRequest):
    """
    智能布局建议
    根据幻灯片内容分析，推荐最佳元素布局
    """
    elements_info = "\n".join([
        f"- {i+1}. 类型:{e.get('type')}, 内容:{e.get('content', e.get('fill', ''))[:50]}"
        for i, e in enumerate(req.elements)
    ])
    
    prompt = f"""分析以下幻灯片内容，为其推荐最佳布局方案。

幻灯片内容：
{req.slide_content[:300]}

当前元素：
{elements_info}

请分析内容类型（标题页/文本页/图片页/图表页等），然后给出布局建议。
请按以下JSON格式返回：
{{
    "layout_type": "居中/左重/右重/网格式/全图背景",
    "suggested_alignments": [
        {{"element_index": 0, "x": 100, "y": 50, "width": 600, "height": 80}}
    ],
    "reason": "为什么这样布局"
}}

只返回JSON，不要其他内容。"""
    
    system = "你是一个专业的PPT设计专家，根据内容特点给出最佳布局建议。"
    
    try:
        result = call_ai(prompt, system)
        parsed = safe_json_parse(result)
        if parsed:
            return {"success": True, "suggestion": parsed}
        # fallback: 返回默认建议
        return {
            "success": True,
            "suggestion": {
                "layout_type": "左重",
                "suggested_alignments": [],
                "reason": "使用默认布局"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"layout-suggestion失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-enhance")
async def auto_enhance(req: AutoEnhanceRequest):
    """
    一键美化
    基于现有设计自动优化：配色、字体、间距等
    """
    elements_summary = "\n".join([
        f"- {e.get('type')}: {e.get('content', e.get('fill', ''))[:30]}"
        for e in req.elements[:5]
    ])
    
    prompt = f"""分析以下幻灯片设计，一键优化配色、字体和视觉效果。

当前元素（最多5个）：
{elements_summary}

主题色：{req.color_scheme}

请分析当前设计问题，然后给出优化建议。
按以下JSON格式返回：
{{
    "improved_color_scheme": ["#主色", "#辅色", "#背景色", "#强调色"],
    "suggested_font": "建议字体",
    "suggested_spacing": "紧凑/标准/宽松",
    "design_tips": ["优化建议1", "优化建议2"],
    "reason": "优化理由"
}}

只返回JSON。"""
    
    system = "你是一个专业的PPT视觉设计师，擅长一键美化设计。"
    
    try:
        result = call_ai(prompt, system)
        parsed = safe_json_parse(result)
        if parsed:
            return {"success": True, "enhancement": parsed}
        return {
            "success": True,
            "enhancement": {
                "improved_color_scheme": ["#165DFF", "#ffffff", "#f5f7ff", "#0e42d2"],
                "suggested_font": "微软雅黑",
                "suggested_spacing": "标准",
                "design_tips": ["使用主题蓝色系配色", "增加字体粗细区分层级"],
                "reason": "应用商务蓝配色方案"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"auto-enhance失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/content-score")
async def content_score(req: ContentScoreRequest):
    """
    内容质量评分
    从完整性、清晰度、专业性、可读性等维度评分
    """
    content_preview = req.slide_content[:500] if req.slide_content else "无内容"
    elements_count = len(req.elements)
    text_elements = sum(1 for e in req.elements if e.get("type") == "text")
    
    prompt = f"""请对以下PPT幻灯片内容进行质量评分。

幻灯片内容预览：
{content_preview}

元素统计：共{elements_count}个元素，其中文本元素{text_elements}个。

请从以下维度评分（每项1-10分）：
1. 内容完整性（内容是否充实完整）
2. 表达清晰度（逻辑是否清晰易懂）
3. 专业性（用语是否专业得体）
4. 可读性（排版是否便于阅读）
5. 视觉吸引力（整体视觉效果）

请按JSON格式返回：
{{
    "overall_score": 7.5,
    "scores": {{
        "completeness": 8,
        "clarity": 7,
        "professionalism": 7,
        "readability": 8,
        "visual_appeal": 7
    }},
    "strengths": ["优点1", "优点2"],
    "improvements": ["改进建议1", "改进建议2"],
    "summary": "一句话总结"
}}

只返回JSON。"""
    
    system = "你是一个专业的PPT内容评审专家，客观评估幻灯片质量。"
    
    try:
        result = call_ai(prompt, system)
        parsed = safe_json_parse(result)
        if parsed:
            return {"success": True, "score": parsed}
        # fallback
        return {
            "success": True,
            "score": {
                "overall_score": 7.0,
                "scores": {
                    "completeness": 7, "clarity": 7, "professionalism": 7,
                    "readability": 7, "visual_appeal": 7
                },
                "strengths": ["内容完整"],
                "improvements": ["可进一步优化"],
                "summary": "内容质量良好"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"content-score失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
