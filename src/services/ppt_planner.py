# -*- coding: utf-8 -*-
"""
智能PPT规划器 - 让AI真正参与PPT构思
"""
import json
import requests
from typing import Dict, Any, List

# 火山引擎API配置 - 从settings读取
from ..config import settings

VOLC_API_KEY = settings.VOLCANO_API_KEY
VOLC_ENDPOINT = settings.VOLCANO_ENDPOINT
VOLC_MODEL = settings.VOLCANO_TEXT_MODEL


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

**重要：每一页都要让图片铺满整个页面，文字直接覆盖在图片上！**

布局类型说明：
- image_full: 全屏图片，文字直接覆盖在图片上（不是旁边！）
- title_full: 封面页，全屏图片+文字覆盖
- thank_you: 尾页

**关键要求：**
1. 每页都用图片铺满整个背景
2. 文字直接覆盖在图片上，不是旁边的白色区域
3. 需要半透明遮罩让文字更清晰
4. 不要用左右分割布局！

返回JSON格式：
{{
    "slides": [
        {{
            "slide_type": "title",
            "title": "震撼的标题",
            "content": ["副标题"],
            "layout": "title_full",
            "image_hint": "大气发布会现场",
            "design_notes": "全屏图片，文字覆盖在图片中央"
        }},
        {{
            "slide_type": "content",
            "title": "核心内容",
            "content": ["要点1", "要点2", "要点3"],
            "layout": "image_full",
            "image_hint": "相关图片",
            "design_notes": "全屏图片，文字覆盖在图片上"
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
    """默认规划方案 - 优化版，内容更丰富"""
    slides = []
    
    # 提取主题关键词
    topic = user_request[:30] if len(user_request) > 30 else user_request
    
    # 封面
    slides.append({
        "slide_type": "title",
        "title": topic,
        "content": ["专业演示 · 精彩呈现", "AI赋能PPT制作"],
        "layout": LayoutType.TITLE,
        "image_hint": "大气发布会现场，科技创新",
        "design_notes": "全屏标题，大气背景"
    })
    
    # 目录
    if slide_count > 2:
        slides.append({
            "slide_type": "toc",
            "title": "目录概览",
            "content": [
                f"第一部分：{topic}概述",
                f"第二部分：{topic}深度分析",
                f"第三部分：{topic}发展趋势",
                "第四部分：总结与展望"
            ],
            "layout": LayoutType.CENTER,
            "image_hint": "",
            "design_notes": "居中展示"
        })
    
    # 内容页 - 使用不同布局，内容更丰富
    layouts = [
        LayoutType.LEFT_TEXT_RIGHT_IMAGE,
        LayoutType.LEFT_IMAGE_RIGHT_TEXT,
        LayoutType.THREE_COLUMN,
        LayoutType.CARD
    ]
    
    # 每页的具体内容规划
    content_pages = [
        {
            "title": "概述与背景",
            "content": [
                f"{topic}的定义与内涵",
                "行业发展的历史沿革",
                "当前市场总体规模",
                "政策环境与支持力度"
            ]
        },
        {
            "title": "市场分析",
            "content": [
                "市场规模及增长趋势",
                "主要竞争格局分析",
                "消费者需求特征",
                "区域市场差异"
            ]
        },
        {
            "title": "发展趋势",
            "content": [
                "技术创新方向",
                "商业模式创新",
                "产业链重构趋势",
                "未来发展前景"
            ]
        },
        {
            "title": "案例研究",
            "content": [
                "典型企业案例分析",
                "成功经验总结",
                "失败教训与启示",
                "最佳实践推荐"
            ]
        }
    ]
    
    for i in range(1, slide_count - 1):
        content_idx = (i - 1) % len(content_pages)
        page_content = content_pages[content_idx]
        layout = layouts[(i - 1) % len(layouts)]
        
        slides.append({
            "slide_type": "content",
            "title": page_content["title"],
            "content": page_content["content"],
            "layout": layout,
            "image_hint": f"与{page_content['title']}相关的专业图片",
            "design_notes": f"使用{layout}布局，文字和图片互补"
        })
    
    # 尾页
    slides.append({
        "slide_type": "thank_you",
        "title": "谢谢观看",
        "content": ["感谢您的聆听", "欢迎交流探讨", "联系我们进一步沟通"],
        "layout": LayoutType.THANK_YOU,
        "image_hint": "简洁大气的结束页",
        "design_notes": "居中简洁布局"
    })
    
    return slides[:slide_count]
