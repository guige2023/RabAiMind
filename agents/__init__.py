"""
RabAi Mind Agent 模块

包含 9 个专业化 Agent:
- coordinator_agent: 总调度 Agent
- quality_agent: 质量管控 Agent
- volcano_agent: 火山云内容 Agent
- svg_agent: SVG 渲染 Agent
- okppt_agent: OkPPT 转换 Agent
- pptx_optimizer_agent: PPT 优化 Agent
- api_interface_agent: 多端接口 Agent
- mcp_service_agent: MCP 服务 Agent
- deploy_agent: 部署运维 Agent
"""

__version__ = "1.0.0"

from .coordinator_agent import CoordinatorAgent
from .quality_agent import QualityAgent
from .volcano_agent import VolcanoAgent
from .svg_agent import SVGAgent
from .okppt_agent import OkPPTAgent
from .pptx_optimizer_agent import PPTXOptimizerAgent
from .api_interface_agent import APIInterfaceAgent
from .mcp_service_agent import MCPServiceAgent
from .deploy_agent import DeployAgent

__all__ = [
    "CoordinatorAgent",
    "QualityAgent",
    "VolcanoAgent",
    "SVGAgent",
    "OkPPTAgent",
    "PPTXOptimizerAgent",
    "APIInterfaceAgent",
    "MCPServiceAgent",
    "DeployAgent",
]
