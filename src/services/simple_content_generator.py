# -*- coding: utf-8 -*-
"""
简化的PPT内容生成器
直接根据用户需求生成内容
"""
import os
import json
from typing import Dict, Any, List

# 火山引擎API配置
VOLC_API_KEY = "1d91e7e0-5761-4edb-a348-bc0b8b86affb"
VOLC_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3"
VOLC_MODEL = "ep-20260303221115-dk4rt"


def generate_ppt_content(user_request: str, slide_count: int = 5) -> List[Dict]:
    """
    根据用户需求生成PPT内容
    
    Args:
        user_request: 用户需求描述
        slide_count: 幻灯片数量
        
    Returns:
        幻灯片内容列表
    """
    import requests
    
    # 构建prompt
    prompt = f"""你是一个专业的商业PPT策划专家。请根据用户需求生成专业的PPT内容。

用户需求：{user_request}

这是一个关于{user_request}的演示文稿。请生成{slide_count}页PPT的详细内容。

要求：
1. 封面页：震撼的标题 + 副标题
2. 目录页：清晰的章节划分
3. 内容页：每个要点都要有实质内容（不能是"详细说明"这样的空话）
4. 尾页：感谢语 + 联系方式

每页格式：
- title: 页面标题（简短有力）
- content: 2-4个要点（每个要点15-30字的实质内容）
- image_hint: 图片提示词（用于AI生成配图）

返回JSON格式：
{{
    "slides": [
        {{"slide_type": "title_slide", "title": "主标题", "content": ["副标题"], "image_hint": "科技感发布会现场"}},
        {{"slide_type": "toc", "title": "目录", "content": ["第一章", "第二章", "第三章"]}},
        {{"slide_type": "content", "title": "核心内容1", "content": ["具体要点1", "具体要点2", "具体要点3"], "image_hint": "相关图片描述"}},
        ...,
        {{"slide_type": "thank_you", "title": "谢谢观看", "content": ["公司名称", "联系方式"]}}
    ]
}}

只返回JSON！"""
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {VOLC_API_KEY}"
    }
    
    data = {
        "model": VOLC_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    try:
        resp = requests.post(
            f"{VOLC_ENDPOINT}/projects/*/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )
        
        if resp.status_code == 200:
            result = resp.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # 解析JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            data = json.loads(content.strip())
            slides = data.get("slides", [])
            
            # 确保有足够数量的幻灯片
            if len(slides) < slide_count:
                # 填充内容页
                for i in range(len(slides), slide_count - 1):
                    slides.append({
                        "slide_type": "content",
                        "title": f"核心要点 {i}",
                        "content": [f"这是第{i}个要点的详细说明"]
                    })
            
            # 确保有尾页
            if slides[-1].get("slide_type") != "thank_you":
                slides.append({
                    "slide_type": "thank_you",
                    "title": "谢谢观看",
                    "content": ["联系我们"]
                })
            
            return slides[:slide_count]
    except Exception as e:
        print(f"API调用失败: {e}")
    
    # 如果失败，返回基于用户需求的智能默认内容
    return _generate_smart_default(user_request, slide_count)


def _generate_smart_default(user_request: str, slide_count: int) -> List[Dict]:
    """生成智能默认内容"""
    slides = []
    
    # 封面
    slides.append({
        "slide_type": "title_slide",
        "title": user_request[:50] if len(user_request) > 50 else user_request,
        "content": ["专业演示", "AI驱动"]
    })
    
    # 内容页
    topics = [
        "市场背景与机遇",
        "产品与服务介绍", 
        "核心竞争力",
        "商业模式",
        "发展规划"
    ]
    
    for i in range(1, slide_count - 1):
        topic = topics[i - 1] if i - 1 < len(topics) else f"第{i}部分"
        slides.append({
            "slide_type": "content",
            "title": topic,
            "content": [
                f"{topic}的详细说明",
                "关键要点分析",
                "案例与数据支持"
            ]
        })
    
    # 尾页
    slides.append({
        "slide_type": "thank_you",
        "title": "谢谢观看",
        "content": ["如有疑问请联系"]
    })
    
    return slides
