"""
动画管理器 - 处理动画效果

负责：
1. 幻灯片切换动画
2. 元素入场动画
3. 动画效果配置
4. SVG动画生成

作者: Claude
日期: 2026-03-20
"""

import threading
from typing import Any


class AnimationManager:
    """动画管理器"""

    # 切换动画类型
    SLIDE_TRANSITIONS = {
        'none': {'name': '无', 'duration': 0},
        'fade': {'name': '淡入淡出', 'duration': 500},
        'slide_left': {'name': '向左滑动', 'duration': 400},
        'slide_right': {'name': '向右滑动', 'duration': 400},
        'slide_up': {'name': '向上滑动', 'duration': 400},
        'slide_down': {'name': '向下滑动', 'duration': 400},
        'zoom_in': {'name': '缩放进入', 'duration': 500},
        'zoom_out': {'name': '缩放退出', 'duration': 500},
        'rotate': {'name': '旋转', 'duration': 600},
        'flip': {'name': '翻转', 'duration': 700}
    }

    # 入场动画类型
    ENTRY_ANIMATIONS = {
        'none': {'name': '无', 'duration': 0},
        'fade_in': {'name': '淡入', 'duration': 500},
        'slide_in_left': {'name': '从左进入', 'duration': 400},
        'slide_in_right': {'name': '从右进入', 'duration': 400},
        'slide_in_top': {'name': '从上方进入', 'duration': 400},
        'slide_in_bottom': {'name': '从下方进入', 'duration': 400},
        'zoom_in': {'name': '缩放进入', 'duration': 500},
        'bounce_in': {'name': '弹跳进入', 'duration': 600},
        'rotate_in': {'name': '旋转进入', 'duration': 500}
    }

    # 强调动画
    EMPHASIS_ANIMATIONS = {
        'none': {'name': '无'},
        'pulse': {'name': '脉冲'},
        'shake': {'name': '抖动'},
        'wobble': {'name': '摇摆'},
        'flash': {'name': '闪烁'},
        'bounce': {'name': '弹跳'},
        'rubber_band': {'name': '橡皮筋'},
        'tada': {'name': '欢呼'}
    }

    def __init__(self):
        """初始化动画管理器"""
        self.default_transition = 'fade'
        self.default_entry = 'fade_in'

    def get_slide_transition(
        self,
        transition_type: str = None,
        duration: int = None
    ) -> dict[str, Any]:
        """获取幻灯片切换动画配置"""
        if transition_type is None:
            transition_type = self.default_transition

        transition = self.SLIDE_TRANSITIONS.get(
            transition_type,
            self.SLIDE_TRANSITIONS['fade']
        )

        return {
            'type': transition_type,
            'name': transition['name'],
            'duration': duration or transition['duration']
        }

    def get_entry_animation(
        self,
        animation_type: str = None,
        delay: float = 0,
        duration: int = None
    ) -> dict[str, Any]:
        """获取入场动画配置"""
        if animation_type is None:
            animation_type = self.default_entry

        animation = self.ENTRY_ANIMATIONS.get(
            animation_type,
            self.ENTRY_ANIMATIONS['fade_in']
        )

        return {
            'type': animation_type,
            'name': animation['name'],
            'delay': delay,
            'duration': duration or animation['duration']
        }

    def generate_css_animation(
        self,
        animation_type: str,
        duration: int = 500,
        delay: float = 0
    ) -> str:
        """生成CSS动画代码"""
        animations = {
            'fade_in': f'''
                @keyframes fadeIn {{
                    from {{ opacity: 0; }}
                    to {{ opacity: 1; }}
                }}
                .animate-fade-in {{
                    animation: fadeIn {duration}ms ease-out {delay}ms forwards;
                }}
            ''',
            'slide_in_left': f'''
                @keyframes slideInLeft {{
                    from {{ transform: translateX(-100%); opacity: 0; }}
                    to {{ transform: translateX(0); opacity: 1; }}
                }}
                .animate-slide-in-left {{
                    animation: slideInLeft {duration}ms ease-out {delay}ms forwards;
                }}
            ''',
            'slide_in_right': f'''
                @keyframes slideInRight {{
                    from {{ transform: translateX(100%); opacity: 0; }}
                    to {{ transform: translateX(0); opacity: 1; }}
                }}
                .animate-slide-in-right {{
                    animation: slideInRight {duration}ms ease-out {delay}ms forwards;
                }}
            ''',
            'slide_in_top': f'''
                @keyframes slideInTop {{
                    from {{ transform: translateY(-100%); opacity: 0; }}
                    to {{ transform: translateY(0); opacity: 1; }}
                }}
                .animate-slide-in-top {{
                    animation: slideInTop {duration}ms ease-out {delay}ms forwards;
                }}
            ''',
            'slide_in_bottom': f'''
                @keyframes slideInBottom {{
                    from {{ transform: translateY(100%); opacity: 0; }}
                    to {{ transform: translateY(0); opacity: 1; }}
                }}
                .animate-slide-in-bottom {{
                    animation: slideInBottom {duration}ms ease-out {delay}ms forwards;
                }}
            ''',
            'zoom_in': f'''
                @keyframes zoomIn {{
                    from {{ transform: scale(0); opacity: 0; }}
                    to {{ transform: scale(1); opacity: 1; }}
                }}
                .animate-zoom-in {{
                    animation: zoomIn {duration}ms ease-out {delay}ms forwards;
                }}
            ''',
            'bounce_in': f'''
                @keyframes bounceIn {{
                    0% {{ transform: scale(0); opacity: 0; }}
                    50% {{ transform: scale(1.1); }}
                    70% {{ transform: scale(0.95); }}
                    100% {{ transform: scale(1); opacity: 1; }}
                }}
                .animate-bounce-in {{
                    animation: bounceIn {duration}ms ease-out {delay}ms forwards;
                }}
            ''',
            'rotate_in': f'''
                @keyframes rotateIn {{
                    from {{ transform: rotate(-180deg) scale(0); opacity: 0; }}
                    to {{ transform: rotate(0) scale(1); opacity: 1; }}
                }}
                .animate-rotate-in {{
                    animation: rotateIn {duration}ms ease-out {delay}ms forwards;
                }}
            '''
        }

        return animations.get(animation_type, '')

    def generate_svg_animation(
        self,
        element_id: str,
        animation_type: str,
        duration: float = 1.0
    ) -> str:
        """生成SVG动画代码"""
        animations = {
            'fade_in': f'''
                <animate attributeName="opacity" from="0" to="1" dur="{duration}s" begin="{element_id}.begin" fill="freeze"/>
            ''',
            'scale_in': f'''
                <animateTransform attributeName="transform" type="scale" from="0" to="1" dur="{duration}s" begin="{element_id}.begin" fill="freeze"/>
            ''',
            'slide_x': f'''
                <animate attributeName="x" from="-100" to="0" dur="{duration}s" begin="{element_id}.begin" fill="freeze"/>
            ''',
            'slide_y': f'''
                <animate attributeName="y" from="-100" to="0" dur="{duration}s" begin="{element_id}.begin" fill="freeze"/>
            ''',
            'rotate': f'''
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="{duration}s" repeatCount="indefinite"/>
            '''
        }

        return animations.get(animation_type, '')

    def apply_transition_effect(
        self,
        from_slide: dict[str, Any],
        to_slide: dict[str, Any],
        transition_type: str,
        duration: int = 500
    ) -> dict[str, Any]:
        """应用切换效果"""
        transition_config = self.get_slide_transition(transition_type, duration)

        return {
            'from': from_slide,
            'to': to_slide,
            'transition': transition_config,
            'css_class': f'transition-{transition_type}'
        }

    def create_sequential_animations(
        self,
        elements: list[dict[str, Any]],
        animation_type: str,
        stagger_delay: float = 0.1
    ) -> list[dict[str, Any]]:
        """创建序列动画（交错动画）"""
        animations = []

        for i, element in enumerate(elements):
            delay = i * stagger_delay
            animation = self.get_entry_animation(
                animation_type,
                delay=delay
            )
            animations.append({
                'element': element,
                'animation': animation,
                'delay': delay
            })

        return animations

    def get_animation_presets(
        self,
        preset_name: str
    ) -> dict[str, Any]:
        """获取动画预设"""
        presets = {
            'professional': {
                'transition': 'fade',
                'entry': 'fade_in',
                'duration': 500
            },
            'dynamic': {
                'transition': 'slide_left',
                'entry': 'slide_in_right',
                'duration': 400
            },
            'elegant': {
                'transition': 'zoom_in',
                'entry': 'bounce_in',
                'duration': 600
            },
            'minimal': {
                'transition': 'none',
                'entry': 'fade_in',
                'duration': 300
            }
        }

        return presets.get(preset_name, presets['professional'])

    def generate_animation_css(
        self,
        preset_name: str = 'professional'
    ) -> str:
        """生成动画CSS代码"""
        preset = self.get_animation_presets(preset_name)

        css = f'''
/* {preset_name} 动画预设 */

.slide-transition-{preset['transition']} {{
    animation-duration: {preset['duration']}ms;
}}

{self.generate_css_animation(preset['entry'], preset['duration'], 0)}
'''

        return css


# 全局实例
_animation_manager: AnimationManager | None = None
_manager_lock = threading.Lock()


def get_animation_manager() -> AnimationManager:
    """获取动画管理器实例（线程安全）"""
    global _animation_manager
    if _animation_manager is None:
        with _manager_lock:
            if _animation_manager is None:
                _animation_manager = AnimationManager()
    return _animation_manager
