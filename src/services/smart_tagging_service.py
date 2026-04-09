"""
智能标签服务 - R81
使用 AI 分析 PPT 内容，自动生成标签
"""

import logging
import re

logger = logging.getLogger(__name__)


class SmartTaggingService:
    """智能标签生成服务"""

    # 预定义关键词 → 标签映射
    KEYWORD_TAG_MAP = {
        # 行业标签
        r"商务|商业|企业|公司|创业|融资|商业计划": "商业",
        r"教育|培训|课件|教学|课程|学术|论文|答辩": "教育",
        r"科技|技术|产品|研发|AI|互联网|软件|代码": "科技",
        r"营销|推广|品牌|市场|策划|广告|新媒体": "营销",
        r"金融|投资|银行|证券|基金|财务|会计|审计": "金融",
        r"医疗|健康|医药|医院|保健|养生|药品": "医疗",
        r"政府|政务|党建|机关|政策|公共": "政务",
        r"地产|房地产|建筑|工程|装修|物业": "地产",
        r"制造|工业|工厂|生产|供应链|物流": "制造",
        r"农业|农村|农产品|乡村振兴|扶贫": "农业",

        # 内容类型标签
        r"年度|年中|季度|月度|年度报告": "年度汇报",
        r"计划|规划|方案|策略": "计划规划",
        r"总结|复盘|回顾|成果": "总结复盘",
        r"提案|方案|建议": "提案方案",
        r"介绍|宣传|展示|演示": "产品展示",
        r"分析|调研|调查|研究": "调研分析",
        r"会议|研讨|论坛|峰会|讲座": "会议活动",
        r"流程|工序|工艺|操作": "流程说明",
        r"预算|成本|利润|收益|支出": "财务分析",
        r"数据|统计|报表|指标|KPI": "数据分析",

        # 风格标签
        r"简约|简洁|干净|素雅": "简约风格",
        r"专业|正式|商务|企业": "专业风格",
        r"创意|创新|独特|个性": "创意风格",
        r"科技|技术|未来|智能": "科技风格",
        r"高端|奢华|精致|优雅": "高端风格",
        r"活力|青春|运动|动感": "活力风格",
        r"自然|环保|绿色|生态": "自然风格",
    }

    # 场景 → 标签映射
    SCENE_TAG_MAP = {
        "business": ["商业", "商务"],
        "education": ["教育", "培训"],
        "tech": ["科技", "技术"],
        "creative": ["创意", "设计"],
        "marketing": ["营销", "推广"],
        "finance": ["金融", "财务"],
        "medical": ["医疗", "健康"],
        "government": ["政务", "政府"],
    }

    # 风格 → 标签映射
    STYLE_TAG_MAP = {
        "professional": "专业风格",
        "simple": "简约风格",
        "energetic": "活力风格",
        "premium": "高端风格",
        "creative": "创意风格",
        "tech": "科技风格",
        "nature": "自然风格",
        "elegant": "优雅风格",
    }

    # 常见停用词（不作为标签）
    STOP_WORDS = {
        "的", "了", "是", "在", "和", "与", "或", "及", "等", "为", "以", "于",
        "这", "那", "有", "我", "你", "他", "她", "它", "们", "此", "其", "所",
        "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万",
        "年度", "季度", "月度", "本周", "本月", "本年", "今日", "昨日", "明天",
        "PPT", "PDF", "Word", "Excel", "PowerPoint", "演示", "报告",
    }

    def __init__(self):
        self._keyword_patterns = {}
        for keywords, tag in self.KEYWORD_TAG_MAP.items():
            try:
                self._keyword_patterns[re.compile(keywords)] = tag
            except re.error:
                logger.warning(f"Invalid regex pattern: {keywords}")

    def generate_tags(
        self,
        user_request: str,
        scene: str = None,
        style: str = None,
        title: str = None,
        existing_tags: list[str] = None,
    ) -> list[str]:
        """
        分析内容生成智能标签

        Args:
            user_request: 用户需求描述
            scene: 场景类型
            style: 风格类型
            title: PPT标题
            existing_tags: 已有的手动标签

        Returns:
            自动生成的标签列表（不重复）
        """
        found_tags: set[str] = set()
        text = user_request
        if title:
            text += " " + title

        # 1. 基于关键词匹配
        for pattern, tag in self._keyword_patterns.items():
            if pattern.search(text):
                found_tags.add(tag)

        # 2. 基于场景添加标签
        if scene and scene in self.SCENE_TAG_MAP:
            for tag in self.SCENE_TAG_MAP[scene]:
                found_tags.add(tag)

        # 3. 基于风格添加标签
        if style and style in self.STYLE_TAG_MAP:
            found_tags.add(self.STYLE_TAG_MAP[style])

        # 4. 智能提取名词短语（2-4字）
        words = self._extract_key_phrases(text)
        for word in words:
            if word not in self.STOP_WORDS and len(word) >= 2:
                # 过滤掉包含停用词的
                is_stop = False
                for sw in self.STOP_WORDS:
                    if word.startswith(sw) or word.endswith(sw):
                        is_stop = True
                        break
                if not is_stop:
                    found_tags.add(word)

        # 5. 合并已有标签（去重）
        if existing_tags:
            found_tags.update(existing_tags)

        # 限制最多8个标签
        result = list(found_tags)[:8]
        return result

    def _extract_key_phrases(self, text: str) -> list[str]:
        """提取关键词短语"""
        # 提取被引号、引号包围的内容
        quoted = re.findall(r'["\"\'](.+?)["\"\']', text)
        # 提取括号内容
        bracketed = re.findall(r'【(.+?)】|（(.+?)）', text)
        # 提取常见关键词组合
        phrases = []
        for q in quoted:
            if len(q) >= 2:
                phrases.append(q)
        for b in bracketed:
            if isinstance(b, tuple):
                phrases.extend([x for x in b if x])
            elif b:
                phrases.append(b)
        # 提取中文词汇（2-4字）
        chinese_words = re.findall(r'[\u4e00-\u9fa5]{2,4}', text)
        phrases.extend(chinese_words)
        return list(set(phrases))[:10]

    def suggest_folder_name(self, user_request: str, scene: str = None) -> str:
        """根据内容建议文件夹名称"""
        request_lower = user_request.lower()
        if scene == "business" or any(k in request_lower for k in ["商业", "商务", "公司"]):
            return "📊 商业汇报"
        if scene == "education" or any(k in request_lower for k in ["教育", "培训", "课程"]):
            return "📚 教学课件"
        if scene == "tech" or any(k in request_lower for k in ["科技", "技术", "产品"]):
            return "🚀 产品技术"
        if scene == "marketing" or any(k in request_lower for k in ["营销", "推广", "品牌"]):
            return "📢 市场推广"
        if scene == "finance" or any(k in request_lower for k in ["金融", "财务", "投资"]):
            return "💰 财务分析"
        return "📁 我的PPT"


# 单例
_smart_tagging_service = None


def get_smart_tagging_service() -> SmartTaggingService:
    global _smart_tagging_service
    if _smart_tagging_service is None:
        _smart_tagging_service = SmartTaggingService()
    return _smart_tagging_service
