#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试智能文字模式 PPT 生成
"""

import asyncio
import os
import sys

# 添加项目根目录到 sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置环境变量（不依赖火山引擎 API）
os.environ["VOLCENGINE_API_KEY"] = ""
os.environ["VOLCENGINE_PROJECT_ID"] = ""


async def test_smart_text_mode():
    """测试智能文字模式"""
    print("=" * 60)
    print("测试智能文字模式 PPT 生成")
    print("=" * 60)
    
    try:
        # 导入 PPTGenerator
        from src.services.ppt_generator import PPTGenerator
        
        # 创建生成器实例
        generator = PPTGenerator()
        print("✓ PPTGenerator 实例创建成功")
        
        # 测试数据
        task_id = "test_smart_text_001"
        user_request = "创建一个关于人工智能发展的演示文稿，包含AI历史、现状和未来趋势"
        slide_count = 3  # 测试用3页
        
        print(f"\n任务ID: {task_id}")
        print(f"用户请求: {user_request}")
        print(f"幻灯片数量: {slide_count}")
        
        # 调用生成器
        print("\n开始生成 PPT...")
        result = await generator.generate(
            task_id=task_id,
            user_request=user_request,
            slide_count=slide_count,
            scene="technology",
            style="modern",
            theme_color="#165DFF"
        )
        
        print("\n" + "=" * 60)
        print("生成结果:")
        print("=" * 60)
        print(f"状态: {'成功' if result.get('success') else '失败'}")
        print(f"输出文件: {result.get('pptx_path')}")
        print(f"幻灯片数量: {result.get('slide_count')}")
        
        # 检查文件是否存在
        output_path = result.get('pptx_path')
        if output_path and os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"文件大小: {file_size / 1024:.2f} KB")
            print("\n✓ PPT 生成成功！")
            return True
        else:
            print("\n✗ PPT 文件未生成")
            return False
            
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_smart_text_mode())
    sys.exit(0 if success else 1)
