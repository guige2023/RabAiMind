# -*- coding: utf-8 -*-
"""
智能PPT规划器 - 让AI真正参与PPT构思
"""
import json
import logging
import requests
import time
import re
import certifi
from typing import Dict, Any, List, Optional, Generator

logger = logging.getLogger(__name__)

# 火山引擎API配置 - 延迟读取，避免模块加载时 .env 未就绪
from ..config import settings
from ..models import LayoutType


# ===== 场景化 Prompt 模板 =====
SCENE_PROMPTS = {
    "business": {
        "system": """你是一位资深商务咨询顾问，擅长为企业管理培训、市场分析、投资汇报设计专业演示文稿。
你的输出必须体现：
- 逻辑清晰、数据驱动
- 商业术语规范（OKR/KPI/ROI等）
- 简洁有力的表达风格
- 适合高管决策场景""",
        "content_template": "用户需求是商业场景：{user_request}",
        "layout_priority": ["title_full", "center", "left_text_right_image", "card"],
    },
    "education": {
        "system": """你是一位优秀的教育工作者，擅长设计课程课件、教学PPT、培训教材。
你的输出必须体现：
- 知识由浅入深、循序渐进
- 适合课堂讲解和学生理解
- 包含思考题或互动环节设计
- 视觉辅助丰富（图表、示意图）""",
        "content_template": "用户需求是教育培训场景：{user_request}",
        "layout_priority": ["title_full", "center", "left_text_right_image", "three_column", "card"],
    },
    "government": {
        "system": """你是一位政府公文写作专家，擅长撰写政策解读、工作汇报、政务宣传类演示文稿。
你的输出必须体现：
- 严谨规范、符合党政机关公文格式
- 政策依据明确
- 层次分明（总-分-总结构）
- 用词准确、不夸张""",
        "content_template": "用户需求是政府政务场景：{user_request}",
        "layout_priority": ["title_full", "center", "left_text_right_image"],
    },
    "creative": {
        "system": """你是一位顶尖创意策划师，擅长品牌营销、活动宣传、创意提案类演示文稿。
你的输出必须体现：
- 创意新颖、视觉冲击力强
- 品牌调性鲜明
- 传播性高（适合分享和展示）
- 设计感强烈""",
        "content_template": "用户需求是创意营销场景：{user_request}",
        "layout_priority": ["title_full", "left_image_right_text", "card", "three_column"],
    },
    "investment": {
        "system": """你是一位资深投融资顾问，擅长为创业者、投资人设计商业计划书和融资路演PPT。
你的输出必须体现：
- 商业模式清晰（痛点-方案-市场-盈利）
- 数据支撑充分
- 竞争分析专业
- 团队背景突出""",
        "content_template": "用户需求是投融资路演场景：{user_request}",
        "layout_priority": ["title_full", "center", "left_text_right_image", "card"],
    },
}

# ===== 风格 Prompt 补充 =====
STYLE_PROMPTS = {
    "professional": {
        "extra": "风格：专业商务，使用思源黑体/Arial，内容简洁有力，适合正式场合。"
    },
    "creative": {
        "extra": "风格：创意活力，使用潮流字体，内容富有感染力和传播性。"
    },
    "minimalist": {
        "extra": "风格：极简主义，大量留白，信息精炼，一目了然。"
    },
    "classic": {
        "extra": "风格：经典传统，版式端正，字体正式，适合正式汇报。"
    },
}


def _get_volc_config() -> dict:
    """延迟获取火山引擎配置，避免模块级读取 .env"""
    return {
        "api_key": settings.VOLCANO_API_KEY,
        "endpoint": settings.VOLCANO_ENDPOINT,
        "project_id": settings.VOLCANO_PROJECT_ID,
        "model": settings.VOLCANO_TEXT_MODEL,
    }


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
        r'\[INST\]',  # Llama jailbreak
        r'<<SYS>>',  # Llama system prompt injection
        r'<\|end\|>',  # Generic end token
        r'<\|user\|>',  # Generic user token
        r'<\|assistant\|>',  # Generic assistant token
        r'<SYST',  # System prompt prefix
        r'<AI>',  # AI turn prefix
        r'</AI>',  # AI turn suffix
        r'####.*',  # Markdown header injection
    ]

    result = user_input
    detected_patterns = []
    for pattern in dangerous_patterns:
        if re.search(pattern, result, flags=re.IGNORECASE):
            detected_patterns.append(pattern)
        result = re.sub(pattern, '', result, flags=re.IGNORECASE)

    if detected_patterns:
        logger.warning(f"检测到潜在Prompt注入，已移除{len(detected_patterns)}个危险模式")

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
    cfg = _get_volc_config()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {cfg['api_key']}"
    }

    data = {
        "model": cfg["model"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    if stream:
        data["stream"] = True

    for attempt in range(max_retries):
        try:
            resp = requests.post(
                (cfg['endpoint'].rstrip('/') + "/chat/completions") if not cfg['project_id'] else (cfg['endpoint'].rstrip('/') + f"/projects/{cfg['project_id']}/chat/completions"),
                headers=headers,
                json=data,
                timeout=(30, 120),
                verify=False
            )

            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                # 速率限制，等待后重试
                wait_time = (attempt + 1) * 2
                logger.warning(f"API速率限制，状态码429，等待{wait_time}秒后重试...")
                time.sleep(wait_time)
                continue
            else:
                logger.error(f"API错误，状态码: {resp.status_code}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
        except requests.exceptions.Timeout:
            logger.warning(f"API超时，尝试 {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
        except Exception as e:
            logger.error(f"API调用失败: {type(e).__name__}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue

    return None


def plan_ppt(user_request: str, slide_count: int = 5, scene: str = "business",
              style: str = "professional", temperature: float = 0.7) -> List[Dict]:
    """
    让AI规划PPT的完整结构

    P0修复: 默认方案现在会结合用户需求
    P2修复: temperature可配置
    场景化: scene/style 参数支持不同场景定制

    包括：
    1. 每页的布局类型
    2. 每页的具体内容
    3. 文字和图片的互补关系
    """

    # 获取场景 Prompt
    scene_config = SCENE_PROMPTS.get(scene, SCENE_PROMPTS["business"])
    style_config = STYLE_PROMPTS.get(style, STYLE_PROMPTS["professional"])

    # 构建完整 Prompt
    system_prompt = scene_config["system"] + "\n" + style_config["extra"]

    # 【关键修复】把用户需求展开成具体内容方向，引导AI生成有深度的真实内容
    # 而不是空洞的"行业概述、市场分析"泛泛而谈
    user_prompt = scene_config["content_template"].format(user_request=user_request)

    # 分析用户请求，提取关键词，决定内容方向
    request_lower = user_request.lower()
    topic_context = _get_topic_context(user_request)

    # 加入布局指导
    layout_guide = "优先使用的布局类型：" + "、".join(scene_config["layout_priority"])

    prompt = f"""{system_prompt}

{user_prompt}

{topic_context}

请根据以上背景，设计{slide_count}页PPT的完整方案。

**【布局类型说明】**
- title_full: 全屏标题页，适合封面
- center: 居中布局，适合目录页
- left_text_right_image: 左文右图
- left_image_right_text: 左图右文
- three_column: 三栏布局，适合对比或特点展示
- card: 卡片式布局，适合案例或团队介绍
- thank_you: 结束页

{layout_guide}

**【重要要求】**
1. 内容必须专业、实用、有深度
2. 标题要简洁有力，能吸引注意力
3. 内容要点要具体、真实、贴合用户需求，不要泛泛而谈
4. 每页内容要有实质信息，具体到可执行、可操作
5. 合理选择布局类型，让内容呈现更专业
6. content数组中每项应该是完整的句子或短语，而不是标题

**【绝对禁止】**
- 不要使用"根据用户需求"、"按照要求"这类套话
- 不要生成空洞的万能模板内容（如"行业概述"、"市场分析"）
- 不要编造具体数据，如需列举请用"XX"占位

返回JSON格式：
{{
    "slides": [
        {{
            "slide_type": "title",
            "title": "主标题",
            "subtitle": "副标题",
            "layout": "title_slide"
        }},
        {{
            "slide_type": "toc",
            "title": "目录",
            "content": ["具体内容项1", "具体内容项2", "具体内容项3", "具体内容项4"],
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
            logger.warning(f"解析响应失败: {type(e).__name__}")

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

    # 内容页数量 = slide_count - 2 (封面 + 尾页), 如果有目录还要减1
    has_toc = slide_count > 2
    content_count = slide_count - 2 - (1 if has_toc else 0)

    for i in range(content_count):
        content_idx = i % len(content_pages)
        page_content = content_pages[content_idx]
        layout = layouts[i % len(layouts)]

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

    return slides


def _get_topic_context(user_request: str) -> str:
    """
    根据用户请求，生成具体的背景上下文，让AI能生成真实、有深度的内容，
    而不是泛泛的"行业概述、市场分析"万能模板。
    """
    req = user_request.lower()

    # OpenClaw 相关
    if 'openclaw' in req or 'ai assistant' in req or 'agent' in req:
        return """【背景上下文】
OpenClaw 是一款 AI Agent 开发与运行平台，主要功能：
- 允许用户创建 AI Agent，配置 Skills（技能）和 Tools（工具）
- 支持多种 LLM 后端：Claude、GPT、MiniMax、火山引擎等
- 支持插件扩展：浏览器自动化、文件系统、代码执行、即时通讯（飞书/Telegram/Discord）等
- 可在本地 Mac/服务器 7×24 小时运行，支持心跳任务
- 社区技能市场 clawhub.ai 提供第三方技能可一键安装
- 核心使用场景：个人效率工具、自动化工作流、AI助手定制

请围绕以上特性，生成贴合 OpenClaw 的具体内容（如安装配置、核心功能、插件使用、实战案例）。"""

    # 商业计划 / 融资
    if any(k in req for k in ['商业计划', '融资', '创业', '商业', 'bp', 'pitch']):
        return """【背景上下文】
这是一份创业融资商业计划书/路演PPT。请围绕：
- 核心产品与商业模式（解决什么痛点）
- 市场规模与增长潜力（具体数字）
- 竞争优势与护城河
- 团队背景与牛人
- 融资计划与估值逻辑
生成真实、具体的商业分析，不要空泛概念。"""

    # 教育 / 培训 / 课程
    if any(k in req for k in ['教育', '培训', '课程', '教学', '学习', '课件']):
        return """【背景上下文】
这是一份教育培训类演示文稿。请围绕：
- 核心知识点与教学目标
- 适合目标学员的接收水平
- 具体案例与实践操作
- 互动环节与思考题设计
生成有教学价值、能让学员真正学到东西的内容。"""

    # 政府 / 政务 / 公文
    if any(k in req for k in ['政府', '政务', '党建', '机关', '汇报', '公文']):
        return """【背景上下文】
这是一份政务工作汇报/政策解读类PPT。请围绕：
- 政策背景与出台意义
- 核心内容与工作部署
- 落实举措与责任分工
- 成效指标与时间节点
生成严谨、专业、符合政务规范的内容。"""

    # 产品发布 / 介绍
    if any(k in req for k in ['产品发布', '新品', '产品介绍', '功能介绍']):
        return """【背景上下文】
这是一份产品介绍/发布PPT。请围绕：
- 产品的核心卖点与差异化优势
- 目标用户与使用场景
- 主要功能与使用方法
- 价格策略与上市时间
生成能打动用户、突出产品亮点的高质量内容。"""

    # 通用泛需求
    return f"""【背景上下文】
用户需求是："{user_request}"
请围绕这个主题，生成深度、有见地、具体的内容。
避免"行业概述、市场分析"这类万能空洞标题，要具体到这个主题的核心知识、关键方法、真实案例。"""


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


def plan_ppt_stream(user_request: str, slide_count: int = 5, scene: str = "business",
                     style: str = "professional", temperature: float = 0.7) -> Generator[str, None, None]:
    """P2修复: 流式输出支持，场景化"""

    # 获取场景 Prompt
    scene_config = SCENE_PROMPTS.get(scene, SCENE_PROMPTS["business"])
    style_config = STYLE_PROMPTS.get(style, STYLE_PROMPTS["professional"])

    # 构建完整 Prompt
    system_prompt = scene_config["system"] + "\n" + style_config["extra"]
    user_prompt = scene_config["content_template"].format(user_request=user_request)

    # 加入布局指导
    layout_guide = "优先使用的布局类型：" + "、".join(scene_config["layout_priority"])

    prompt = f"""{system_prompt}

{user_prompt}

请设计{slide_count}页PPT的完整方案。

**【布局类型说明】**
- title_full: 全屏标题页
- center: 居中布局
- left_text_right_image: 左文右图
- left_image_right_text: 左图右文
- three_column: 三栏布局
- card: 卡片式布局
- thank_you: 结束页

{layout_guide}

返回JSON格式：
{{
    "slides": [
        {{"slide_type": "title", "title": "...", "layout": "title_slide"}},
        ...
    ]
}}

只返回JSON！"""

    cfg = _get_volc_config()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {cfg['api_key']}"
    }

    data = {
        "model": cfg["model"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": 3000,
        "stream": True
    }

    resp = None
    try:
        resp = requests.post(
            f"{cfg['endpoint']}/chat/completions" if not cfg['project_id'] else f"{cfg['endpoint']}/projects/{cfg['project_id']}/chat/completions",
            headers=headers,
            json=data,
            timeout=(5, 90),
            stream=True,
            verify=False
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
        logger.error(f"流式输出失败: {type(e).__name__}")
    finally:
        # 确保关闭HTTP连接
        if resp:
            resp.close()
