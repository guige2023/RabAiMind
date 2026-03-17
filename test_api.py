#!/usr/bin/env python3
"""
测试脚本 - 验证火山引擎 API 连接和基本功能
"""

import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from volc_okppt_tools import (
    Config,
    VolcanoClient,
    PromptOptimizer
)


def test_config():
    """测试配置加载"""
    print("=" * 50)
    print("测试 1: 配置加载")
    print("=" * 50)

    config = Config()
    print(f"API Key: {config.get('volcano.api_key')[:20]}...")
    print(f"文本模型: {config.get('volcano.text_model')}")
    print(f"图片模型: {config.get('volcano.image_model')}")
    print(f"API 端点: {config.get('volcano.endpoint')}")
    print("✓ 配置加载成功\n")


def test_text_generation():
    """测试文本生成"""
    print("=" * 50)
    print("测试 2: 文本生成 (火山引擎)")
    print("=" * 50)

    client = VolcanoClient()

    try:
        result = client.generate_text(
            prompt="你好，请用一句话介绍自己",
            temperature=0.7,
            max_tokens=500
        )
        print(f"生成结果: {result['content']}")
        print(f"使用模型: {result.get('model')}")
        print(f"Token 使用: {result.get('usage', {}).get('total_tokens', 'N/A')}")
        print("✓ 文本生成成功\n")
        return True
    except Exception as e:
        print(f"✗ 文本生成失败: {e}\n")
        return False


def test_image_generation():
    """测试图片生成"""
    print("=" * 50)
    print("测试 3: 图片生成 (火山引擎)")
    print("=" * 50)

    client = VolcanoClient()

    try:
        # 不传 size 参数，使用默认值
        result = client.generate_image(
            prompt="一只可爱的橙色小猫"
        )
        print(f"图片 URL: {result['url']}")
        print("✓ 图片生成成功\n")
        return True
    except Exception as e:
        print(f"✗ 图片生成失败: {e}\n")
        return False


def test_prompt_optimizer():
    """测试提示词优化"""
    print("=" * 50)
    print("测试 4: 提示词优化")
    print("=" * 50)

    # 测试 PPT 内容优化
    prompt = PromptOptimizer.optimize_for_ppt(
        user_request="生成一份关于2024年公司年度总结的PPT",
        scene="business",
        slide_count=10,
        style="professional"
    )
    print(f"优化后提示词长度: {len(prompt)} 字符")
    print("✓ 提示词优化成功\n")

    # 测试 SVG 提示词优化
    svg_prompt = PromptOptimizer.optimize_svg_prompt(
        content="2024年度总结 - 销售额突破1亿",
        slide_type="title_slide"
    )
    print(f"SVG 提示词长度: {len(svg_prompt)} 字符")
    print("✓ SVG 提示词优化成功\n")


if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("RabAi Mind API 测试 (火山引擎)")
    print("=" * 50 + "\n")

    # 运行测试
    test_config()
    test_prompt_optimizer()

    # 测试文本生成
    test_text_generation()

    # 测试图片生成
    test_image_generation()

    print("=" * 50)
    print("测试完成")
    print("=" * 50)
