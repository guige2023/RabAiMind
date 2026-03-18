# -*- coding: utf-8 -*-
"""
智能PPT规划器 - 让AI真正参与PPT构思
"""
import json
import requests
from typing import Dict, Any, List

# 火山引擎API配置
VOLC_API_KEY = "1d91e7e0-5761-4edb-a348-bc0b8b86affb"
VOLC_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3"
VOLC_MODEL = "ep-20260303221115-dk4rt"


# 布局类型
class LayoutType:
    TITLE = "title"           # 全屏标题
    TOC = "toc"              # 目录页
    LEFT_TEXT_RIGHT_IMAGE = "left_text_right_image"  # 左文右图
    LEFT_IMAGE_RIGHT_TEXT = "left_image_right_text"  # 左图右文
    FULL_IMAGE = "full_image"  # 全屏图片
    TOP_TEXT_BOTTOM_IMAGE = "top_text_bottom_image"  # 上文下图
    THREE_COLUMN = "three_column"  # 三栏
    CARD = "card"            # 卡片式
    CENTER = "center"        # 居中
    THANK_YOU = "thank_you"  # 尾页


def plan_ppt(user_request: str, slide_count: int = 5) -> List[Dict]:
    """
    让AI规划PPT的完整结构
    
    包括：
    1. 每页的布局类型
    2. 每页的具体内容
    3. 文字和图片的互补关系
    """
    
    prompt = f"""你是一个顶级的PPT策划专家。请为用户需求设计一个专业的PPT。

用户需求：{user_request}

请设计{slide_count}页PPT的完整方案。

**重要：每一页都要让图片成为主体，文字叠加在图片上，形成图文一体的效果！**

布局类型说明：
- title: 全屏标题页（封面）- 图片铺满，文字叠加
- image_cover: 图片封面 - 图片为主，文字在图片上
- full_image: 全屏图片 - 图片铺满，底部文字叠加
- toc: 目录页
- left_text_right_image: 不要用这个！
- left_image_right_text: 不要用这个！

**关键要求：**
1. 每页都用图片作为背景/主体
2. 文字叠加在图片上，不是旁边
3. 图片和文字要形成一体感
4. 布局要多样化

返回JSON格式：
{{
    "slides": [
        {{
            "slide_type": "title",
            "title": "震撼的标题",
            "content": ["副标题/亮点"],
            "layout": "image_cover",
            "image_hint": "大气发布会现场，背景",
            "design_notes": "全屏图片，文字叠加在图片中央"
        }},
        {{
            "slide_type": "content",
            "title": "核心内容",
            "content": ["要点1", "要点2", "要点3"],
            "layout": "full_image",
            "image_hint": "展示产品功能的图片",
            "design_notes": "全屏图片，文字叠加在底部"
        }},
        ...
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
        "temperature": 0.8,
        "max_tokens": 3000
    }
    
    try:
        resp = requests.post(
            f"{VOLC_ENDPOINT}/projects/*/chat/completions",
            headers=headers,
            json=data,
            timeout=90
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
            return data.get("slides", [])
    except Exception as e:
        print(f"规划失败: {e}")
    
    return _get_default_plan(user_request, slide_count)


def _get_default_plan(user_request: str, slide_count: int) -> List[Dict]:
    """默认规划方案"""
    slides = []
    
    # 封面
    slides.append({
        "slide_type": "title",
        "title": user_request[:50],
        "content": ["专业演示"],
        "layout": LayoutType.TITLE,
        "image_hint": "大气发布会现场",
        "design_notes": "全屏标题，大气背景"
    })
    
    # 目录
    if slide_count > 2:
        slides.append({
            "slide_type": "toc",
            "title": "目录",
            "content": ["第一章", "第二章", "第三章"],
            "layout": LayoutType.CENTER,
            "image_hint": "",
            "design_notes": "居中展示"
        })
    
    # 内容页 - 使用不同布局
    layouts = [
        LayoutType.LEFT_TEXT_RIGHT_IMAGE,
        LayoutType.LEFT_IMAGE_RIGHT_TEXT,
        LayoutType.THREE_COLUMN,
        LayoutType.CARD
    ]
    
    topics = [
        "市场分析", "产品介绍", "核心竞争力", "发展规划"
    ]
    
    for i in range(1, slide_count - 1):
        topic = topics[i - 1] if i - 1 < len(topics) else f"第{i}部分"
        layout = layouts[(i - 1) % len(layouts)]
        
        slides.append({
            "slide_type": "content",
            "title": topic,
            "content": [
                f"{topic}的核心要点",
                "关键数据支持",
                "实际案例展示"
            ],
            "layout": layout,
            "image_hint": f"与{topic}相关的专业图片",
            "design_notes": f"使用{layout}布局，文字和图片互补"
        })
    
    # 尾页
    slides.append({
        "slide_type": "thank_you",
        "title": "谢谢观看",
        "content": ["联系我们"],
        "layout": LayoutType.THANK_YOU,
        "image_hint": "简洁大气的结束页",
        "design_notes": "居中简洁布局"
    })
    
    return slides[:slide_count]
