# -*- coding: utf-8 -*-
"""
智能PPT规划器 - 让AI真正参与PPT构思
"""
import json
import requests
from typing import Dict, Any, List

# 火山引擎API配置 - 从settings读取
from ..config import settings
from ..models.layout import LayoutType

VOLC_API_KEY = settings.VOLCANO_API_KEY
VOLC_ENDPOINT = settings.VOLCANO_ENDPOINT
VOLC_MODEL = settings.VOLCANO_TEXT_MODEL


def plan_ppt(user_request: str, slide_count: int = 5) -> List[Dict]:
    """
    让AI规划PPT的完整结构

    包括：
    1. 每页的布局类型
    2. 每页的具体内容
    3. 文字和图片的互补关系
    """

    prompt = f"""你是一个顶级的PPT策划专家。请根据用户需求设计一个专业的演示文稿。

用户需求：{user_request}

请设计{slide_count}页PPT的完整方案。

**【重要要求】**
1. 内容必须专业、实用、有深度
2. 标题要简洁有力，能吸引注意力
3. 内容要点要具体，避免空泛表述
4. 每页内容要有实质信息，不要泛泛而谈

**【绝对禁止】**
- 不要包含或重复用户原始需求文本
- 不要使用"根据用户需求"、"按照要求"这类表述
- 不要生成空洞的套话

返回JSON格式：
{{
    "slides": [
        {{
            "slide_type": "title",
            "title": "人工智能",
            "subtitle": "驱动未来的核心技术",
            "layout": "title_full"
        }},
        {{
            "slide_type": "content",
            "title": "目录",
            "content": ["行业概述", "市场分析", "技术应用", "发展趋势"],
            "layout": "center"
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

    # 封面 - 使用简洁的标题，不重复用户需求
    slides.append({
        "slide_type": "title",
        "title": "演示文稿",
        "content": ["专业演示 · 精彩呈现"],
        "layout": LayoutType.TITLE_SLIDE,
        "image_hint": "大气发布会现场，科技创新",
        "design_notes": "全屏标题，大气背景"
    })

    # 目录
    if slide_count > 2:
        slides.append({
            "slide_type": "toc",
            "title": "目录概览",
            "content": [
                "第一部分：行业概述",
                "第二部分：市场分析",
                "第三部分：发展趋势",
                "第四部分：总结展望"
            ],
            "layout": LayoutType.CENTER_RADIATION,
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

    # 每页的具体内容规划
    content_pages = [
        {
            "title": "行业概述",
            "content": [
                "行业定义与内涵",
                "发展历史与现状",
                "市场规模",
                "政策环境"
            ]
        },
        {
            "title": "市场分析",
            "content": [
                "市场规模及增长趋势",
                "竞争格局分析",
                "用户需求特征",
                "区域市场差异"
            ]
        },
        {
            "title": "发展趋势",
            "content": [
                "技术创新方向",
                "商业模式创新",
                "产业链重构",
                "未来前景展望"
            ]
        },
        {
            "title": "案例研究",
            "content": [
                "典型企业案例",
                "成功经验总结",
                "失败教训启示",
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
            "design_notes": f"使用{layout}布局"
        })

    # 尾页
    slides.append({
        "slide_type": "thank_you",
        "title": "谢谢观看",
        "content": ["感谢您的聆听", "欢迎交流探讨"],
        "layout": LayoutType.THANK_YOU,
        "image_hint": "简洁大气的结束页",
        "design_notes": "居中简洁布局"
    })

    return slides[:slide_count]
