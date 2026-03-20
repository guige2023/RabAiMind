# -*- coding: utf-8 -*-
"""
布局策略选择模块

定义8种布局类型：封面、卡片、双栏、中心辐射、时间线、数据可视化、金句、对比

作者: Claude
日期: 2026-03-18
"""

import threading
from typing import Dict, Any, Optional

# 从统一模型导入布局类型
from ...models import LayoutType


class LayoutStrategy:
    """智能布局策略"""

    # 布局模板定义
    LAYOUT_TEMPLATES = {
        "title_slide": {
            "name": "封面布局",
            "description": "中心对齐，大标题+副标题",
            "structure": "single_center",
            "safe_zone": (200, 150, 1400, 750),
            "elements": ["主标题", "副标题", "装饰元素", "日期/作者"],
            "typical_use": ["PPT封面", "章节标题页", "开场介绍"]
        },
        "content_card": {
            "name": "卡片式布局",
            "description": "网格卡片，模块化信息",
            "structure": "grid",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "卡片组(2-4个)", "图标", "要点"],
            "typical_use": ["功能介绍", "特点展示", "优势说明", "步骤说明"]
        },
        "two_column": {
            "name": "双栏布局",
            "description": "左右分栏，对比或并列",
            "structure": "two_column",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "左栏内容", "右栏内容"],
            "typical_use": ["并列说明", "优缺点对比", "方案对比", "原因分析"]
        },
        "center_radiation": {
            "name": "中心辐射布局",
            "description": "中心核心，周围展开",
            "structure": "radial",
            "safe_zone": (100, 50, 1400, 850),
            "elements": ["中心主题", "分支节点(4-6个)", "连接线"],
            "typical_use": ["思维导图", "核心概念展开", "主要组成", "关键要素"]
        },
        "timeline": {
            "name": "时间线布局",
            "description": "横向或纵向时间轴",
            "structure": "timeline",
            "safe_zone": (100, 100, 1400, 800),
            "elements": ["时间节点", "事件描述", "连接线"],
            "typical_use": ["发展历程", "项目里程碑", "历史演进", "计划安排"]
        },
        "data_visualization": {
            "name": "数据可视化布局",
            "description": "图表为主，文字辅助",
            "structure": "chart",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "图表区域", "数据说明", "图例"],
            "typical_use": ["数据分析", "统计报告", "市场调研", "业绩展示"]
        },
        "quote": {
            "name": "金句布局",
            "description": "大面积留白，突出引用",
            "structure": "quote",
            "safe_zone": (200, 200, 1400, 700),
            "elements": ["引用文字", "来源", "装饰元素"],
            "typical_use": ["名人名言", "核心观点", "关键引用", "总结升华"]
        },
        "comparison": {
            "name": "对比布局",
            "description": "左右或上下对比",
            "structure": "comparison",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "对比项A", "对比项B", "VS标识"],
            "typical_use": ["方案对比", "优劣势分析", "新旧对比", "前后对比"]
        }
    }

    def __init__(self):
        """初始化布局策略"""
        self.current_layout: Optional[str] = None

    def select_layout(self, content_analysis: Dict[str, Any]) -> str:
        """
        根据内容分析选择最佳布局

        Args:
            content_analysis: 内容分析结果，包含以下字段：
                - type: 内容类型 (title_slide, quote, timeline, comparison, content)
                - density: 内容密度 CDI (0-10)
                - element_count: 元素数量
                - has_timeline: 是否包含时间线
                - has_comparison: 是否需要对比
                - keywords: 关键词列表

        Returns:
            布局类型字符串
        """
        slide_type = content_analysis.get("type", "content")
        content_density = content_analysis.get("density", 5)  # CDI 0-10
        element_count = content_analysis.get("element_count", 3)
        has_timeline = content_analysis.get("has_timeline", False)
        has_comparison = content_analysis.get("has_comparison", False)
        keywords = content_analysis.get("keywords", [])

        # 决策逻辑
        if slide_type == "title_slide":
            return "title_slide"
        elif slide_type == "quote":
            return "quote"
        elif slide_type == "timeline" or has_timeline:
            return "timeline"
        elif slide_type == "comparison" or has_comparison:
            return "comparison"
        # 数据可视化：包含数据、统计、增长等关键词
        elif any(k in keywords for k in ['数据', '统计', '增长', '比例', '图表', '业绩', '收入', '用户', '市场', 'data', 'growth', 'percent', 'increase']):
            return "data_visualization"
        elif content_density >= 8:
            # 高密度内容使用双栏
            return "two_column"
        elif element_count <= 3 and content_density <= 3:
            # 少元素低密度使用中心辐射
            return "center_radiation"
        elif 4 <= element_count <= 6:
            # 中等数量元素使用卡片布局
            return "content_card"
        else:
            # 默认使用卡片布局
            return "content_card"

    def get_layout_template(self, layout_type: str) -> Dict[str, Any]:
        """
        获取指定布局类型的模板

        Args:
            layout_type: 布局类型

        Returns:
            布局模板字典
        """
        return self.LAYOUT_TEMPLATES.get(layout_type, self.LAYOUT_TEMPLATES["content_card"])

    def get_all_layouts(self) -> Dict[str, Dict[str, Any]]:
        """获取所有布局模板"""
        return self.LAYOUT_TEMPLATES

    def suggest_layouts_for_content(self, content_analysis: Dict[str, Any]) -> list:
        """
        为内容推荐多个可选布局

        Args:
            content_analysis: 内容分析结果

        Returns:
            推荐的布局类型列表（按优先级排序）
        """
        primary = self.select_layout(content_analysis)
        suggestions = [primary]

        # 根据内容特征添加备选布局
        slide_type = content_analysis.get("type", "content")
        element_count = content_analysis.get("element_count", 3)

        if primary == "two_column" and element_count >= 4:
            suggestions.append("content_card")
        elif primary == "content_card":
            suggestions.append("two_column")
        elif primary == "center_radiation":
            suggestions.append("content_card")

        # 封面类型不添加备选
        if slide_type == "title_slide":
            return ["title_slide"]

        # 确保不重复
        return list(dict.fromkeys(suggestions))


# 单例实例
_layout_strategy_instance: Optional[LayoutStrategy] = None
_manager_lock = threading.Lock()


def get_layout_strategy() -> LayoutStrategy:
    """获取布局策略单例（线程安全）"""
    global _layout_strategy_instance
    if _layout_strategy_instance is None:
        with _manager_lock:
            if _layout_strategy_instance is None:
                _layout_strategy_instance = LayoutStrategy()
    return _layout_strategy_instance
