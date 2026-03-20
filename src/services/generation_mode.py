# -*- coding: utf-8 -*-
"""
生成模式处理器 - 处理不同生成模式的逻辑

负责：
1. 标准模式处理
2. 快速模式处理
3. 高清模式处理
4. 流式模式处理
5. 输出格式处理

作者: Claude
日期: 2026-03-20
"""

from typing import Dict, Any, List, Optional, Callable, Generator
import asyncio


class GenerationModeHandler:
    """生成模式处理器"""

    # 模式配置
    MODE_CONFIGS = {
        'standard': {
            'name': '标准模式',
            'max_workers': 4,
            'ai_quality': 'medium',
            'timeout': 300,
            'description': '平衡速度和质量'
        },
        'fast': {
            'name': '快速模式',
            'max_workers': 8,
            'ai_quality': 'low',
            'timeout': 120,
            'description': '快速生成预览'
        },
        'quality': {
            'name': '高清模式',
            'max_workers': 2,
            'ai_quality': 'high',
            'timeout': 600,
            'description': '高质量输出'
        },
        'stream': {
            'name': '流式模式',
            'max_workers': 1,
            'ai_quality': 'medium',
            'timeout': 0,  # 无超时，流式输出
            'description': '边生成边输出'
        }
    }

    # 格式配置
    FORMAT_CONFIGS = {
        'pptx': {
            'name': 'PPTX',
            'extension': '.pptx',
            'mime': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        },
        'pdf': {
            'name': 'PDF',
            'extension': '.pdf',
            'mime': 'application/pdf'
        },
        'svg': {
            'name': 'SVG',
            'extension': '.svg',
            'mime': 'image/svg+xml'
        },
        'png': {
            'name': 'PNG',
            'extension': '.png',
            'mime': 'image/png'
        }
    }

    # 质量配置
    QUALITY_CONFIGS = {
        'standard': {
            'name': '标准',
            'dpi': 96,
            'width': 1280,
            'height': 720,
            'scale': 1.0
        },
        'high': {
            'name': '高清',
            'dpi': 144,
            'width': 1920,
            'height': 1080,
            'scale': 1.5
        },
        'ultra': {
            'name': '超清',
            'dpi': 192,
            'width': 3840,
            'height': 2160,
            'scale': 2.0
        }
    }

    def __init__(self):
        """初始化生成模式处理器"""
        self.current_mode = 'standard'
        self.current_format = 'pptx'
        self.current_quality = 'standard'

    def set_mode(self, mode: str) -> Dict[str, Any]:
        """设置生成模式"""
        if mode not in self.MODE_CONFIGS:
            mode = 'standard'
        self.current_mode = mode
        return self.get_mode_config()

    def set_format(self, format_type: str) -> Dict[str, Any]:
        """设置输出格式"""
        if format_type not in self.FORMAT_CONFIGS:
            format_type = 'pptx'
        self.current_format = format_type
        return self.get_format_config()

    def set_quality(self, quality: str) -> Dict[str, Any]:
        """设置输出质量"""
        if quality not in self.QUALITY_CONFIGS:
            quality = 'standard'
        self.current_quality = quality
        return self.get_quality_config()

    def get_mode_config(self) -> Dict[str, Any]:
        """获取当前模式配置"""
        return self.MODE_CONFIGS.get(self.current_mode, self.MODE_CONFIGS['standard'])

    def get_format_config(self) -> Dict[str, Any]:
        """获取当前格式配置"""
        return self.FORMAT_CONFIGS.get(self.current_format, self.FORMAT_CONFIGS['pptx'])

    def get_quality_config(self) -> Dict[str, Any]:
        """获取当前质量配置"""
        return self.QUALITY_CONFIGS.get(self.current_quality, self.QUALITY_CONFIGS['standard'])

    def get_generation_config(self) -> Dict[str, Any]:
        """获取完整生成配置"""
        return {
            'mode': self.get_mode_config(),
            'format': self.get_format_config(),
            'quality': self.get_quality_config()
        }

    def should_use_parallel(self) -> bool:
        """是否使用并行处理"""
        return self.current_mode in ['standard', 'fast']

    def get_max_workers(self) -> int:
        """获取最大并行数"""
        config = self.get_mode_config()
        return config.get('max_workers', 4)

    def get_ai_quality(self) -> str:
        """获取AI质量级别"""
        config = self.get_mode_config()
        return config.get('ai_quality', 'medium')

    def get_timeout(self) -> int:
        """获取超时时间"""
        config = self.get_mode_config()
        return config.get('timeout', 300)

    def get_output_dimensions(self) -> tuple:
        """获取输出尺寸"""
        quality = self.get_quality_config()
        return (quality.get('width', 1920), quality.get('height', 1080))

    def get_dpi(self) -> int:
        """获取DPI"""
        quality = self.get_quality_config()
        return quality.get('dpi', 96)

    def is_stream_mode(self) -> bool:
        """是否是流式模式"""
        return self.current_mode == 'stream'

    def is_fast_mode(self) -> bool:
        """是否是快速模式"""
        return self.current_mode == 'fast'

    def is_quality_mode(self) -> bool:
        """是否是高清模式"""
        return self.current_mode == 'quality'

    def get_svg_quality_params(self) -> Dict[str, Any]:
        """获取SVG质量参数"""
        quality = self.get_quality_config()

        return {
            'scale': quality.get('scale', 1.0),
            'detail_level': 'high' if self.current_mode == 'quality' else 'medium',
            'optimize': self.current_mode == 'fast',
            'compress': self.current_format in ['svg', 'png']
        }

    def apply_mode_to_generation(
        self,
        generate_func: Callable,
        slides: List[Dict[str, Any]]
    ) -> List[Any]:
        """应用生成模式处理

        Args:
            generate_func: 生成函数
            slides: 幻灯片列表

        Returns:
            生成结果列表
        """
        if self.current_mode == 'fast':
            # 快速模式：减少并行，使用低质量
            return self._fast_generation(generate_func, slides)
        elif self.current_mode == 'quality':
            # 高清模式：串行生成，高质量
            return self._quality_generation(generate_func, slides)
        elif self.current_mode == 'stream':
            # 流式模式：返回生成器
            return self._stream_generation(generate_func, slides)
        else:
            # 标准模式：正常并行
            return self._standard_generation(generate_func, slides)

    def _standard_generation(
        self,
        generate_func: Callable,
        slides: List[Dict[str, Any]]
    ) -> List[Any]:
        """标准生成"""
        from concurrent.futures import ThreadPoolExecutor

        max_workers = self.get_max_workers()
        results = []

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(generate_func, slide): i for i, slide in enumerate(slides)}
            for future in futures:
                results.append(future.result())

        return results

    def _fast_generation(
        self,
        generate_func: Callable,
        slides: List[Dict[str, Any]]
    ) -> List[Any]:
        """快速生成 - 减少并行数"""
        from concurrent.futures import ThreadPoolExecutor

        max_workers = min(self.get_max_workers(), 4)
        results = []

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(generate_func, slide): i for i, slide in enumerate(slides)}
            for future in futures:
                results.append(future.result())

        return results

    def _quality_generation(
        self,
        generate_func: Callable,
        slides: List[Dict[str, Any]]
    ) -> List[Any]:
        """高质量生成 - 串行"""
        results = []
        for slide in slides:
            result = generate_func(slide)
            results.append(result)
        return results

    def _stream_generation(
        self,
        generate_func: Callable,
        slides: List[Dict[str, Any]]
    ) -> Generator:
        """流式生成"""
        for slide in slides:
            yield generate_func(slide)

    def get_output_filename(self, task_id: str) -> str:
        """获取输出文件名"""
        format_config = self.get_format_config()
        extension = format_config.get('extension', '.pptx')
        return f"presentation_{task_id}{extension}"


# 全局实例
_generation_mode_handler: Optional[GenerationModeHandler] = None


def get_generation_mode_handler() -> GenerationModeHandler:
    """获取生成模式处理器实例"""
    global _generation_mode_handler
    if _generation_mode_handler is None:
        _generation_mode_handler = GenerationModeHandler()
    return _generation_mode_handler
