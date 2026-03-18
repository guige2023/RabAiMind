# -*- coding: utf-8 -*-
"""
内容分析模块

分析幻灯片内容，确定最佳的布局策略

作者: Claude
日期: 2026-03-18
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import re


@dataclass
class ContentAnalysisResult:
    """内容分析结果"""
    type: str                    # 内容类型
    density: int                 # 内容密度 CDI (0-10)
    element_count: int           # 元素数量
    has_timeline: bool           # 是否包含时间线
    has_comparison: bool         # 是否需要对比
    has_quote: bool              # 是否为引用内容
    is_title_slide: bool         # 是否为封面
    keywords: List[str]          # 关键词列表
    recommended_layout: str      # 推荐的布局


class ContentAnalyzer:
    """内容分析器"""

    # 内容类型关键词映射
    TYPE_KEYWORDS = {
        "title_slide": ["封面", "标题", "介绍", "开场", "欢迎", "关于", "公司", "团队", "产品", "项目"],
        "quote": ["引用", "名言", "说过", "认为", "观点", "格言", "金句", "总结", "核心"],
        "timeline": ["历史", "发展", "历程", "时间", "阶段", "演变", "过去", "现在", "未来", "年度", "季度", "月份"],
        "comparison": ["对比", "比较", "优缺点", "优势", "劣势", "区别", "差异", "不同", "方案A", "方案B", "新旧", "前后"],
        "data": ["数据", "统计", "分析", "报告", "增长", "下降", "占比", "比例", "图表", "数字", "金额", "百分比"]
    }

    # 时间相关词汇
    TIMELINE_KEYWORDS = [
        "年", "月", "日", "期", "阶段", "步骤", "流程", "顺序",
        "首先", "然后", "最后", "第一", "第二", "第三",
        "过去", "现在", "未来", "传统", "现代", "将来"
    ]

    # 对比相关词汇
    COMPARISON_KEYWORDS = [
        "对比", "比较", "vs", " Versus ", "优缺点", "优势", "劣势",
        "区别", "差异", "不同", "区别于", "相比", "另一方面",
        "一方面", "既...又...", "一方面...另一方面..."
    ]

    def __init__(self):
        """初始化内容分析器"""
        pass

    def analyze(self, title: str, content: str) -> ContentAnalysisResult:
        """
        分析内容并返回分析结果

        Args:
            title: 标题
            content: 内容

        Returns:
            ContentAnalysisResult 对象
        """
        # 合并标题和内容进行分析
        full_text = f"{title} {content}"

        # 判断是否为封面
        is_title_slide = self._is_title_slide(title, content)

        # 判断是否为引用
        has_quote = self._has_quote(title, content)

        # 判断是否包含时间线
        has_timeline = self._has_timeline(full_text)

        # 判断是否需要对比
        has_comparison = self._has_comparison(full_text)

        # 提取关键词
        keywords = self._extract_keywords(full_text)

        # 计算元素数量
        element_count = self._count_elements(content)

        # 计算内容密度
        density = self._calculate_density(content, element_count)

        # 确定内容类型
        content_type = self._determine_type(
            is_title_slide=is_title_slide,
            has_quote=has_quote,
            has_timeline=has_timeline,
            has_comparison=has_comparison,
            keywords=keywords
        )

        # 构建分析结果
        result = ContentAnalysisResult(
            type=content_type,
            density=density,
            element_count=element_count,
            has_timeline=has_timeline,
            has_comparison=has_comparison,
            has_quote=has_quote,
            is_title_slide=is_title_slide,
            keywords=keywords,
            recommended_layout=""
        )

        # 获取推荐布局
        from .layout_strategy import get_layout_strategy
        strategy = get_layout_strategy()
        result.recommended_layout = strategy.select_layout({
            "type": content_type,
            "density": density,
            "element_count": element_count,
            "has_timeline": has_timeline,
            "has_comparison": has_comparison
        })

        return result

    def _is_title_slide(self, title: str, content: str) -> bool:
        """判断是否为封面"""
        title_lower = title.lower()
        content_lower = content.lower()

        # 封面特征：内容为空或很短，标题包含封面关键词
        if len(content.strip()) < 20:
            for keyword in self.TYPE_KEYWORDS["title_slide"]:
                if keyword in title:
                    return True

        return False

    def _has_quote(self, title: str, content: str) -> bool:
        """判断是否为引用内容"""
        text = f"{title} {content}"

        for keyword in self.TYPE_KEYWORDS["quote"]:
            if keyword in text:
                return True

        # 检查是否包含引号
        if '"' in content or '"' in content or '"' in content:
            return True

        return False

    def _has_timeline(self, text: str) -> bool:
        """判断是否包含时间线"""
        for keyword in self.TIMELINE_KEYWORDS:
            if keyword in text:
                return True

        # 检查年份模式
        year_pattern = r'\d{4}'
        if re.search(year_pattern, text):
            years = re.findall(year_pattern, text)
            if len(years) >= 2:
                return True

        return False

    def _has_comparison(self, text: str) -> bool:
        """判断是否需要对比"""
        for keyword in self.COMPARISON_KEYWORDS:
            if keyword.lower() in text.lower():
                return True

        return False

    def _extract_keywords(self, text: str) -> List[str]:
        """提取关键词"""
        keywords = []

        # 提取所有匹配到的类型关键词
        for type_name, type_keywords in self.TYPE_KEYWORDS.items():
            for keyword in type_keywords:
                if keyword in text:
                    if keyword not in keywords:
                        keywords.append(keyword)

        # 提取数字（可能是数据相关）
        numbers = re.findall(r'\d+', text)
        if len(numbers) >= 2:
            keywords.append("数据")

        return keywords[:10]  # 限制关键词数量

    def _count_elements(self, content: str) -> int:
        """计算元素数量"""
        # 尝试识别列表项
        lines = content.split('\n')
        bullet_count = 0

        for line in lines:
            line = line.strip()
            if not line:
                continue
            # 检查是否为列表项
            if line.startswith(('-', '•', '·', '1.', '2.', '3.', '4.', '5.')):
                bullet_count += 1
            elif len(line) > 5:  # 较长的文本行也算一个元素
                bullet_count += 1

        # 至少返回1
        return max(1, bullet_count)

    def _calculate_density(self, content: str, element_count: int) -> int:
        """计算内容密度 CDI (0-10)"""
        # 内容长度
        length = len(content)

        # 密度因素：内容长度和元素数量
        # 短内容 + 少元素 = 低密度
        # 长内容 + 多元素 = 高密度

        length_score = min(10, length / 100)  # 0-10
        element_score = min(10, element_count * 2)  # 0-10

        # 综合密度
        density = int((length_score + element_score) / 2)

        return max(0, min(10, density))

    def _determine_type(
        self,
        is_title_slide: bool,
        has_quote: bool,
        has_timeline: bool,
        has_comparison: bool,
        keywords: List[str]
    ) -> str:
        """确定内容类型"""
        if is_title_slide:
            return "title_slide"
        elif has_quote:
            return "quote"
        elif has_timeline:
            return "timeline"
        elif has_comparison:
            return "comparison"
        else:
            return "content"

    def batch_analyze(self, slides: List[Dict[str, str]]) -> List[ContentAnalysisResult]:
        """
        批量分析多个幻灯片

        Args:
            slides: 幻灯片列表，每项包含 title 和 content

        Returns:
            分析结果列表
        """
        results = []
        for slide in slides:
            result = self.analyze(
                slide.get("title", ""),
                slide.get("content", "")
            )
            results.append(result)

        return results


# 单例实例
_content_analyzer_instance: Optional[ContentAnalyzer] = None


def get_content_analyzer() -> ContentAnalyzer:
    """获取内容分析器单例"""
    global _content_analyzer_instance
    if _content_analyzer_instance is None:
        _content_analyzer_instance = ContentAnalyzer()
    return _content_analyzer_instance
