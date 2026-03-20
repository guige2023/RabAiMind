# -*- coding: utf-8 -*-
"""
智能PPT规划器 - 让AI真正参与PPT构思
"""
import json
import requests
import time
import re
from typing import Dict, Any, List, Optional, Generator

# 火山引擎API配置 - 从settings读取
from ..config import settings
from ..models.layout import LayoutType

VOLC_API_KEY = settings.VOLCANO_API_KEY
VOLC_ENDPOINT = settings.VOLCANO_ENDPOINT
VOLC_PROJECT_ID = settings.VOLCANO_PROJECT_ID
VOLC_MODEL = settings.VOLCANO_TEXT_MODEL


def sanitize_prompt(user_input: str) -> str:
    """过滤用户输入中的危险字符，防止Prompt注入"""
    if not user_input:
        return ""

    # 移除可能导致Prompt注入的特殊指令
    dangerous_patterns = [
        r'```[\s\S]*?```',  # 代码块
        r'ignore\s+previous\s+instructions',
        r'override\s+system',
        r'#instructions',
        r'system:',
        r'user:',
        r'assistant:',
    ]

    result = user_input
    for pattern in dangerous_patterns:
        result = re.sub(pattern, '', result, flags=re.IGNORECASE)

    # 限制长度
    max_length = 5000
    if len(result) > max_length:
        result = result[:max_length]

    return result.strip()


def _parse_json_response(content: str) -> Optional[Dict]:
    """P0修复: 健壮的JSON解析"""
    if not content:
        return None

    # 移除代码块标记
    content = content.strip()
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        # 尝试找到JSON对象的开始
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            content = match.group(0)
        else:
            content = content.split("```")[1].split("```")[0]

    content = content.strip()

    # 尝试直接解析
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # 尝试修复常见JSON问题
    # 1. 移除尾随逗号
    content = re.sub(r',(\s*[}\]])', r'\1', content)
    # 2. 修复单引号
    content = content.replace("'", '"')
    # 3. 移除注释

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # 4. 尝试提取slides数组
        slides_match = re.search(r'"slides"\s*:\s*\[([\s\S]*)\]', content)
        if slides_match:
            slides_content = "[" + slides_match.group(1) + "]"
            # 尝试逐个解析slide
            try:
                return {"slides": json.loads(slides_content)}
            except Exception:
                pass

    return None


def _call_api_with_retry(prompt: str, temperature: float = 0.7, max_tokens: int = 3000,
                         stream: bool = False, max_retries: int = 3) -> Optional[Dict]:
    """P1修复: 带重试机制的API调用"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {VOLC_API_KEY}"
    }

    data = {
        "model": VOLC_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    if stream:
        data["stream"] = True

    for attempt in range(max_retries):
        try:
            resp = requests.post(
                f"{VOLC_ENDPOINT}/projects/{VOLC_PROJECT_ID}/chat/completions",
                headers=headers,
                json=data,
                timeout=(5, 90)
            )

            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                # 速率限制，等待后重试
                wait_time = (attempt + 1) * 2
                print(f"API速率限制，等待{wait_time}秒后重试...")
                time.sleep(wait_time)
                continue
            else:
                print(f"API错误 {resp.status_code}: {resp.text}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
        except requests.exceptions.Timeout:
            print(f"API超时，尝试 {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
        except Exception as e:
            print(f"API调用失败: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue

    return None


def plan_ppt(user_request: str, slide_count: int = 5, temperature: float = 0.7) -> List[Dict]:
    """
    让AI规划PPT的完整结构

    P0修复: 默认方案现在会结合用户需求
    P2修复: temperature可配置

    包括：
    1. 每页的布局类型
    2. 每页的具体内容
    3. 文字和图片的互补关系
    """

    # P1修复: 在Prompt中添加布局说明
    prompt = f"""你是一个顶级的PPT策划专家。请根据用户需求设计一个专业的演示文稿。

用户需求：{user_request}

请设计{slide_count}页PPT的完整方案。

**【布局类型说明】**
- title_full: 全屏标题页，适合封面
- center: 居中布局，适合目录页
- left_text_right_image: 左文右图
- left_image_right_text: 左图右文
- three_column: 三栏布局，适合对比或特点展示
- card: 卡片式布局，适合案例或团队介绍
- thank_you: 结束页

**【重要要求】**
1. 内容必须专业、实用、有深度
2. 标题要简洁有力，能吸引注意力
3. 内容要点要具体，避免空泛表述
4. 每页内容要有实质信息，不要泛泛而谈
5. 合理选择布局类型，让内容呈现更专业

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
            "layout": "title_slide"
        }},
        {{
            "slide_type": "toc",
            "title": "目录",
            "content": ["行业概述", "市场分析", "技术应用", "发展趋势"],
            "layout": "center"
        }},
        ...
    ]
}}

只返回JSON！"""

    # P1修复: 使用带重试的API调用
    result = _call_api_with_retry(prompt, temperature=temperature, max_tokens=3000)

    if result:
        try:
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            # P0修复: 使用健壮的JSON解析
            parsed = _parse_json_response(content)
            if parsed:
                slides = parsed.get("slides", [])
                if slides:
                    return slides
        except Exception as e:
            print(f"解析响应失败: {e}")

    # P0修复: 默认方案现在会结合用户需求生成相关内容
    return _get_default_plan(user_request, slide_count)


def _get_default_plan(user_request: str, slide_count: int) -> List[Dict]:
    """P0修复: 默认规划方案 - 现在会结合用户需求生成相关内容"""
    slides = []

    # 分析用户请求，提取关键词用于生成相关内容
    keywords = _extract_keywords(user_request)

    # 封面 - 基于用户请求生成标题
    slides.append({
        "slide_type": "title",
        "title": keywords.get("title", "演示文稿"),
        "subtitle": keywords.get("subtitle", "专业演示 · 精彩呈现"),
        "layout": LayoutType.TITLE_SLIDE,
        "image_hint": "大气发布会现场，科技创新",
        "design_notes": "全屏标题，大气背景"
    })

    # 目录 - 基于用户请求定制
    if slide_count > 2:
        toc_items = keywords.get("toc_items", [
            "第一部分：行业概述",
            "第二部分：市场分析",
            "第三部分：发展趋势",
            "第四部分：总结展望"
        ])
        slides.append({
            "slide_type": "toc",
            "title": keywords.get("toc_title", "目录概览"),
            "content": toc_items[:4],
            "layout": LayoutType.CENTER_RADIATION,
            "image_hint": "",
            "design_notes": "居中展示"
        })

    # 内容页 - 使用不同布局
    layouts = [
        LayoutType.LEFT_TEXT_RIGHT_IMAGE,
        LayoutType.LEFT_IMAGE_RIGHT_TEXT,
        LayoutType.THREE_COLUMN,
        LayoutType.CONTENT_CARD
    ]

    # 基于用户请求生成内容
    content_pages = keywords.get("content_pages", [
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
    ])

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


def _extract_keywords(user_request: str) -> Dict:
    """P0修复: 从用户请求中提取关键词，生成相关内容"""
    user_request = user_request.lower()

    # 根据关键词匹配生成定制内容
    if any(k in user_request for k in ["商业", "企业", "公司", "融资", "商业计划"]):
        return {
            "title": "商业计划书",
            "subtitle": "驱动商业成功的关键",
            "toc_title": "目录",
            "toc_items": ["公司概述", "市场分析", "商业模式", "竞争分析", "融资计划"],
            "content_pages": [
                {"title": "公司概述", "content": ["公司简介", "核心团队", "发展阶段", "愿景使命"]},
                {"title": "市场分析", "content": ["市场规模", "目标用户", "市场趋势", "增长潜力"]},
                {"title": "商业模式", "content": ["盈利模式", "收入来源", "定价策略", "成本结构"]},
                {"title": "竞争分析", "content": ["竞争优势", "竞争壁垒", "差异化", "市场份额"]}
            ]
        }
    elif any(k in user_request for k in ["教育", "培训", "课程", "学习", "学校"]):
        return {
            "title": "教育培训",
            "subtitle": "知识启迪未来",
            "toc_title": "课程目录",
            "toc_items": ["课程概述", "教学内容", "教学方法", "学习成果"],
            "content_pages": [
                {"title": "课程概述", "content": ["课程目标", "适用对象", "课程特色", "教学大纲"]},
                {"title": "教学内容", "content": ["核心知识点", "实践技能", "案例分析", "互动环节"]},
                {"title": "教学方法", "content": ["线上教学", "线下辅导", "项目实战", "考核评估"]},
                {"title": "学习成果", "content": ["能力提升", "证书认证", "就业方向", "学员评价"]}
            ]
        }
    elif any(k in user_request for k in ["产品", "发布", "新品", "功能", "介绍"]):
        return {
            "title": "产品发布",
            "subtitle": "创新引领未来",
            "toc_title": "内容导航",
            "toc_items": ["产品介绍", "核心功能", "产品优势", "应用场景"],
            "content_pages": [
                {"title": "产品介绍", "content": ["产品定位", "设计理念", "核心卖点", "技术特点"]},
                {"title": "核心功能", "content": ["功能一", "功能二", "功能三", "功能四"]},
                {"title": "产品优势", "content": ["性能优势", "成本优势", "服务优势", "品牌优势"]},
                {"title": "应用场景", "content": ["场景一", "场景二", "场景三", "客户案例"]}
            ]
        }
    elif any(k in user_request for k in ["数据", "分析", "报告", "统计", "调研"]):
        return {
            "title": "数据分析报告",
            "subtitle": "数据驱动决策",
            "toc_title": "报告目录",
            "toc_items": ["数据概览", "关键发现", "深度分析", "建议行动"],
            "content_pages": [
                {"title": "数据概览", "content": ["数据来源", "样本规模", "时间范围", "主要指标"]},
                {"title": "关键发现", "content": ["发现一", "发现二", "发现三", "发现四"]},
                {"title": "深度分析", "content": ["趋势分析", "对比分析", "关联分析", "预测分析"]},
                {"title": "建议行动", "content": ["短期建议", "中期建议", "长期建议", "优先级排序"]}
            ]
        }
    else:
        # 默认根据用户请求提取标题
        words = user_request.replace("帮我", "").replace("做一个", "").replace("写一个", "").strip()
        if len(words) > 20:
            words = words[:20]
        return {
            "title": words if words else "演示文稿",
            "subtitle": "专业演示 · 精彩呈现",
            "toc_title": "目录概览",
            "toc_items": [
                "第一部分：行业概述",
                "第二部分：市场分析",
                "第三部分：发展趋势",
                "第四部分：总结展望"
            ],
            "content_pages": [
                {"title": "行业概述", "content": ["行业定义与内涵", "发展历史与现状", "市场规模", "政策环境"]},
                {"title": "市场分析", "content": ["市场规模及增长趋势", "竞争格局分析", "用户需求特征", "区域市场差异"]},
                {"title": "发展趋势", "content": ["技术创新方向", "商业模式创新", "产业链重构", "未来前景展望"]},
                {"title": "案例研究", "content": ["典型企业案例", "成功经验总结", "失败教训启示", "最佳实践推荐"]}
            ]
        }


def plan_ppt_stream(user_request: str, slide_count: int = 5, temperature: float = 0.7) -> Generator[str, None, None]:
    """P2修复: 流式输出支持"""
    prompt = f"""你是一个顶级的PPT策划专家。请根据用户需求设计一个专业的演示文稿。

用户需求：{user_request}

请设计{slide_count}页PPT的完整方案。

**【布局类型说明】**
- title_full: 全屏标题页
- center: 居中布局
- left_text_right_image: 左文右图
- left_image_right_text: 左图右文
- three_column: 三栏布局
- card: 卡片式布局
- thank_you: 结束页

返回JSON格式：
{{
    "slides": [
        {{"slide_type": "title", "title": "...", "layout": "title_slide"}},
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
        "temperature": temperature,
        "max_tokens": 3000,
        "stream": True
    }

    resp = None
    try:
        resp = requests.post(
            f"{VOLC_ENDPOINT}/projects/{VOLC_PROJECT_ID}/chat/completions",
            headers=headers,
            json=data,
            timeout=(5, 90),
            stream=True
        )

        if resp.status_code == 200:
            for chunk in resp.iter_lines():
                if chunk:
                    line = chunk.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            break
                        try:
                            data_obj = json.loads(data_str)
                            content = data_obj.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                yield content
                        except Exception:
                            continue
    except Exception as e:
        print(f"流式输出失败: {e}")
    finally:
        # 确保关闭HTTP连接
        if resp:
            resp.close()
