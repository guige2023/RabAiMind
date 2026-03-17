#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 AI 分析层

运行: PYTHONPATH=/Users/guige876/RabAiMind python3 test_ai_analyzer.py
"""

import os
import sys

# 设置路径
sys.path.insert(0, "/Users/guige876/RabAiMind")
os.chdir("/Users/guige876/RabAiMind")

from src.core.ai_analyzer import create_analyzer, create_content_generator

def test_analyzer():
    """测试需求分析"""
    print("=" * 50)
    print("测试 1: AI 需求分析器")
    print("=" * 50)
    
    analyzer = create_analyzer()
    
    # 测试案例
    test_cases = [
        {
            "request": "帮我做一个关于人工智能在医疗领域应用的PPT，需要10页",
            "options": {"scene": "technology", "style": "professional", "slide_count": 10}
        },
        {
            "request": "公司季度销售汇报，5页左右",
            "options": {"scene": "business", "style": "professional", "slide_count": 5}
        },
        {
            "request": "个人简历展示",
            "options": {"scene": "personal", "style": "creative", "slide_count": 8}
        }
    ]
    
    for i, case in enumerate(test_cases):
        print(f"\n测试案例 {i+1}: {case['request']}")
        try:
            analysis = analyzer.analyze(case["request"], case["options"])
            print(f"  标题: {analysis.title}")
            print(f"  描述: {analysis.description}")
            print(f"  场景: {analysis.scene.value}")
            print(f"  风格: {analysis.style.value}")
            print(f"  要点: {analysis.key_points[:3]}...")
        except Exception as e:
            print(f"  错误: {e}")

def test_content_generator():
    """测试内容生成"""
    print("\n" + "=" * 50)
    print("测试 2: 内容生成器")
    print("=" * 50)
    
    generator = create_content_generator()
    
    from src.core.ai_analyzer import RequirementAnalysis, SceneType, StyleType
    
    # 创建测试分析结果
    analysis = RequirementAnalysis(
        original_request="人工智能在医疗领域的应用",
        scene=SceneType.TECHNOLOGY,
        style=StyleType.PROFESSIONAL,
        slide_count=5,
        title="AI医疗应用",
        description="探讨人工智能在医疗领域的发展和应用",
        target_audience="医疗从业者",
        key_points=["精准诊断", "药物研发", "健康管理"],
        structure=[]
    )
    
    try:
        slides = generator.generate_all_slides(analysis, 5)
        print(f"\n生成了 {len(slides)} 个幻灯片任务:")
        for slide in slides:
            print(f"  - 第{slide.index+1}页: {slide.title} ({slide.slide_type})")
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_analyzer()
    test_content_generator()
    print("\n测试完成!")
