"""
幻灯片工厂 - 处理幻灯片创建逻辑

负责：
1. 不同布局类型的幻灯片创建
2. 幻灯片内容组装
3. 布局模板管理

作者: Claude
日期: 2026-03-20
"""

import threading
from typing import Any


class SlideFactory:
    """幻灯片工厂"""

    # 布局类型
    LAYOUTS = {
        'title_slide': '封面',
        'content_card': '卡片',
        'two_column': '双栏',
        'center_radiation': '中心辐射',
        'timeline': '时间线',
        'data_visualization': '数据可视化',
        'quote': '金句',
        'comparison': '对比',
        'masonry': '瀑布流',
        'full_image': '全屏图',
        'process': '流程图',
        'team': '团队介绍'
    }

    def __init__(self):
        """初始化幻灯片工厂"""
        self.current_layout = 'content_card'

    def create_slide(
        self,
        layout_type: str,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建幻灯片

        Args:
            layout_type: 布局类型
            title: 标题
            content: 内容
            theme_config: 主题配置

        Returns:
            幻灯片数据字典
        """
        layout_method = getattr(self, f'_create_{layout_type}_layout', self._create_default_layout)

        return layout_method(title, content, theme_config)

    def _create_title_slide_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建封面布局"""
        palette = theme_config.get('palette', {})
        fonts = theme_config.get('fonts', {})

        # 处理内容
        subtitle = ''
        if isinstance(content, list) and len(content) > 0:
            subtitle = content[0]
        elif isinstance(content, str):
            subtitle = content

        return {
            'layout': 'title_slide',
            'title': title,
            'subtitle': subtitle,
            'background': f"linear-gradient(135deg, {palette.get('background', '#1A1A2E')} 0%, {palette.get('primary', '#165DFF')} 100%)",
            'text_color': palette.get('text', '#FFFFFF'),
            'title_font': fonts.get('title', {}),
            'subtitle_font': fonts.get('subtitle', {})
        }

    def _create_content_card_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建卡片布局"""
        palette = theme_config.get('palette', {})
        fonts = theme_config.get('fonts', {})

        # 处理内容列表
        content_list = []
        if isinstance(content, list):
            content_list = content
        elif isinstance(content, dict):
            content_list = content.get('items', [])

        return {
            'layout': 'content_card',
            'title': title,
            'content': content_list,
            'background': palette.get('background', '#1A1A2E'),
            'card_color': palette.get('primary', '#165DFF'),
            'text_color': palette.get('text', '#FFFFFF'),
            'title_font': fonts.get('title', {}),
            'content_font': fonts.get('content', {})
        }

    def _create_two_column_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建双栏布局"""
        palette = theme_config.get('palette', {})
        fonts = theme_config.get('fonts', {})

        # 处理左右两栏内容
        left_content = []
        right_content = []

        if isinstance(content, list):
            mid = len(content) // 2
            left_content = content[:mid]
            right_content = content[mid:]
        elif isinstance(content, dict):
            left_content = content.get('left', [])
            right_content = content.get('right', [])

        return {
            'layout': 'two_column',
            'title': title,
            'left_content': left_content,
            'right_content': right_content,
            'background': palette.get('background', '#1A1A2E'),
            'text_color': palette.get('text', '#FFFFFF'),
            'title_font': fonts.get('title', {}),
            'content_font': fonts.get('content', {})
        }

    def _create_center_radiation_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建中心辐射布局"""
        palette = theme_config.get('palette', {})

        # 处理辐射点内容
        center_items = []
        if isinstance(content, list):
            center_items = content[:6]  # 最多6个
        elif isinstance(content, dict):
            center_items = content.get('items', [])

        return {
            'layout': 'center_radiation',
            'title': title,
            'center_items': center_items,
            'background': palette.get('background', '#1A1A2E'),
            'accent_color': palette.get('accent', '#00D4FF'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_timeline_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建时间线布局"""
        palette = theme_config.get('palette', {})

        # 处理时间线内容
        timeline_items = []
        if isinstance(content, list):
            timeline_items = content
        elif isinstance(content, dict):
            timeline_items = content.get('events', [])

        return {
            'layout': 'timeline',
            'title': title,
            'timeline_items': timeline_items,
            'background': palette.get('background', '#1A1A2E'),
            'accent_color': palette.get('accent', '#00D4FF'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_data_visualization_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建数据可视化布局"""
        palette = theme_config.get('palette', {})

        # 处理图表数据
        chart_data = []
        if isinstance(content, list):
            chart_data = content
        elif isinstance(content, dict):
            chart_data = content.get('data', [])

        return {
            'layout': 'data_visualization',
            'title': title,
            'chart_data': chart_data,
            'chart_type': 'bar',  # 默认柱状图
            'background': palette.get('background', '#1A1A2E'),
            'accent_color': palette.get('accent', '#00D4FF'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_quote_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建金句布局"""
        palette = theme_config.get('palette', {})

        # 金句内容
        quote_text = ''
        author = ''

        if isinstance(content, list) and len(content) > 0:
            quote_text = content[0]
            if len(content) > 1:
                author = content[1]
        elif isinstance(content, str):
            quote_text = content

        return {
            'layout': 'quote',
            'title': title,
            'quote_text': quote_text,
            'author': author,
            'background': palette.get('background', '#1A1A2E'),
            'accent_color': palette.get('accent', '#FFD700'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_comparison_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建对比布局"""
        palette = theme_config.get('palette', {})

        # 处理对比双方
        left_items = []
        right_items = []

        if isinstance(content, list):
            mid = len(content) // 2
            left_items = content[:mid]
            right_items = content[mid:]
        elif isinstance(content, dict):
            left_items = content.get('left', [])
            right_items = content.get('right', [])

        return {
            'layout': 'comparison',
            'title': title,
            'left_items': left_items,
            'right_items': right_items,
            'background': palette.get('background', '#1A1A2E'),
            'left_color': palette.get('primary', '#165DFF'),
            'right_color': palette.get('secondary', '#34C759'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_full_image_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建全屏图布局"""
        palette = theme_config.get('palette', {})

        # 图片URL
        image_url = ''
        if isinstance(content, dict):
            image_url = content.get('image', '')
        elif isinstance(content, str):
            image_url = content

        return {
            'layout': 'full_image',
            'title': title,
            'image_url': image_url,
            'background': palette.get('background', '#1A1A2E'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_process_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建流程图布局"""
        palette = theme_config.get('palette', {})

        # 处理流程步骤
        steps = []
        if isinstance(content, list):
            steps = content
        elif isinstance(content, dict):
            steps = content.get('steps', [])

        return {
            'layout': 'process',
            'title': title,
            'steps': steps,
            'background': palette.get('background', '#1A1A2E'),
            'accent_color': palette.get('accent', '#00D4FF'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_team_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建团队介绍布局"""
        palette = theme_config.get('palette', {})

        # 处理团队成员
        members = []
        if isinstance(content, list):
            members = content
        elif isinstance(content, dict):
            members = content.get('members', [])

        return {
            'layout': 'team',
            'title': title,
            'members': members,
            'background': palette.get('background', '#1A1A2E'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_masonry_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建瀑布流布局"""
        palette = theme_config.get('palette', {})

        # 处理瀑布流内容
        items = []
        if isinstance(content, list):
            items = content
        elif isinstance(content, dict):
            items = content.get('items', [])

        return {
            'layout': 'masonry',
            'title': title,
            'items': items,
            'background': palette.get('background', '#1A1A2E'),
            'accent_color': palette.get('accent', '#00D4FF'),
            'text_color': palette.get('text', '#FFFFFF')
        }

    def _create_default_layout(
        self,
        title: str,
        content: Any,
        theme_config: dict[str, Any]
    ) -> dict[str, Any]:
        """创建默认布局"""
        return self._create_content_card_layout(title, content, theme_config)

    def get_layout_options(self) -> list[dict[str, str]]:
        """获取布局选项列表"""
        return [
            {'value': k, 'name': v}
            for k, v in self.LAYOUTS.items()
        ]


# 全局实例
_slide_factory: SlideFactory | None = None
_manager_lock = threading.Lock()


def get_slide_factory() -> SlideFactory:
    """获取幻灯片工厂实例（线程安全）"""
    global _slide_factory
    if _slide_factory is None:
        with _manager_lock:
            if _slide_factory is None:
                _slide_factory = SlideFactory()
    return _slide_factory
