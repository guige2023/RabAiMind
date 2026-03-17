"""
RabAi Mind 主 Agent 入口

整合所有 Agent，对接 MiniMax Mini-Agent 中枢
"""

import os
import sys
from typing import Dict, Any, Optional

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.coordinator_agent import CoordinatorAgent, create_coordinator
from agents.quality_agent import QualityAgent, create_quality_agent
from agents.volcano_agent import VolcanoAgent, create_volcano_agent
from agents.svg_agent import SVGAgent, create_svg_agent
from agents.okppt_agent import OkPPTAgent, create_okppt_agent
from agents.pptx_optimizer_agent import PPTXOptimizerAgent, create_optimizer_agent


class RabAiMindAgent:
    """
    RabAi Mind 主 Agent

    整合所有子 Agent，协调完成 PPT 生成流程:
    1. 火山云内容生成
    2. SVG 渲染
    3. OkPPT 转换
    4. PPTX 优化
    5. 质量控制
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

        # 初始化各 Agent
        self.coordinator = create_coordinator(self.config.get("coordinator"))
        self.quality_agent = create_quality_agent(self.config.get("quality"))
        self.volcano_agent = create_volcano_agent(self.config.get("volcano"))
        self.svg_agent = create_svg_agent(self.config.get("svg"))
        self.okppt_agent = create_okppt_agent(self.config.get("okppt"))
        self.optimizer_agent = create_optimizer_agent(self.config.get("optimizer"))

        # 设置输出目录
        self.output_dir = self.config.get("output_dir", "./output")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_ppt(
        self,
        user_request: str,
        options: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        生成 PPT 的主入口

        Args:
            user_request: 用户需求描述
            options: 生成选项

        Returns:
            生成结果
        """
        options = options or {}

        try:
            # 步骤 1: 解析需求并生成内容
            print("[1/5] 解析需求，生成内容...")
            slides = self.volcano_agent.generate_presentation(
                user_request=user_request,
                slide_count=options.get("slide_count", 10),
                scene=options.get("scene", "business"),
                style=options.get("style", "professional")
            )

            # 步骤 2: 质量检查
            print("[2/5] 内容质量检查...")
            valid_slides, reports = self.quality_agent.validate_slides(slides)

            if not valid_slides:
                return {
                    "success": False,
                    "error": "内容质量不通过，请重新生成"
                }

            # 步骤 3: 渲染 SVG
            print("[3/5] 渲染 SVG...")
            rendered_slides = self.svg_agent.render_slides(valid_slides)

            # 验证 SVG
            for slide in rendered_slides:
                svg_content = slide.get("svg_content", "")
                if svg_content:
                    report = self.quality_agent.validate_svg(svg_content)
                    if report.level.value == "fail":
                        print(f"  警告: {slide.get('title', 'untitled')} SVG 质量不通过")

            # 步骤 4: 转换为 PPTX
            print("[4/5] 转换为 PPTX...")
            result = self.okppt_agent.convert(
                slides=rendered_slides,
                output_path=os.path.join(self.output_dir, "presentation.pptx")
            )

            if result.status.value != "completed":
                return {
                    "success": False,
                    "error": f"PPTX 转换失败: {result.error}"
                }

            # 步骤 5: 优化 PPTX
            print("[5/5] 优化 PPTX...")
            optimization_result = self.optimizer_agent.optimize(
                input_path=result.pptx_path,
                level=self.config.get("optimization_level", "medium")
            )

            output_path = optimization_result.output_path or result.pptx_path

            # 检查兼容性
            compatibility = self.optimizer_agent.check_compatibility(output_path)

            return {
                "success": True,
                "pptx_path": output_path,
                "slide_count": len(valid_slides),
                "compression_ratio": optimization_result.compression_ratio,
                "compatibility": {
                    "wps": compatibility.wps_compatible,
                    "office": compatibility.office_compatible,
                    "mobile": compatibility.mobile_compatible
                }
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def generate_from_api(
        self,
        user_request: str,
        options: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """API 风格调用"""
        return self.generate_ppt(user_request, options)

    def get_agent_status(self) -> Dict[str, Any]:
        """获取 Agent 状态"""
        return {
            "coordinator": "ready",
            "quality_agent": "ready",
            "volcano_agent": "ready",
            "svg_agent": "ready",
            "okppt_agent": "ready",
            "optimizer_agent": "ready"
        }


# 全局实例
_agent_instance: Optional[RabAiMindAgent] = None


def get_agent(config: Optional[Dict] = None) -> RabAiMindAgent:
    """获取全局 Agent 实例"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = RabAiMindAgent(config)
    return _agent_instance


def generate_ppt(user_request: str, **kwargs) -> Dict[str, Any]:
    """快捷生成函数"""
    return get_agent().generate_ppt(user_request, kwargs)


# CLI 入口
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="RabAi Mind PPT 生成平台")
    parser.add_argument("--request", "-r", type=str, help="用户需求")
    parser.add_argument("--slides", "-s", type=int, default=10, help="幻灯片数量")
    parser.add_argument("--scene", type=str, default="business", help="场景类型")
    parser.add_argument("--style", type=str, default="professional", help="风格")
    parser.add_argument("--mcp", action="store_true", help="MCP 模式")
    parser.add_argument("--port", type=int, default=8080, help="MCP 端口")

    args = parser.parse_args()

    if args.mcp:
        # MCP 模式
        from mcp_server import run_mcp_server
        run_mcp_server(port=args.port)
    elif args.request:
        # CLI 模式
        result = generate_ppt(
            user_request=args.request,
            options={
                "slide_count": args.slides,
                "scene": args.scene,
                "style": args.style
            }
        )

        if result["success"]:
            print(f"PPT 生成成功: {result['pptx_path']}")
            print(f"幻灯片数量: {result['slide_count']}")
            print(f"压缩比: {result['compression_ratio']:.1f}%")
        else:
            print(f"PPT 生成失败: {result['error']}")
    else:
        # 交互模式
        print("=== RabAi Mind PPT 生成平台 ===")
        request = input("请输入 PPT 需求: ")

        if request:
            result = generate_ppt(request)

            if result["success"]:
                print(f"\n成功!")
                print(f"文件路径: {result['pptx_path']}")
            else:
                print(f"\n失败: {result['error']}")
