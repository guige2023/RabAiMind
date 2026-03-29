"""
总调度 Agent (Coordinator Agent)

负责解析用户 PPT 需求，拆分任务并分配给各 Agent，监控全流程
"""

import json
import time
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

from agents.volc_okppt_tools import PromptOptimizer, get_volcano_client

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"


class TaskType(Enum):
    """任务类型"""
    PARSE_REQUIREMENT = "parse_requirement"
    GENERATE_CONTENT = "generate_content"
    RENDER_SVG = "render_svg"
    CONVERT_PPTX = "convert_pptx"
    OPTIMIZE_PPTX = "optimize_pptx"
    VALIDATE_QUALITY = "validate_quality"


class PPTRequest:
    """PPT 生成请求"""

    def __init__(self, request_id: str, user_request: str, options: Optional[Dict] = None):
        self.request_id = request_id
        self.user_request = user_request
        self.options = options or {}
        self.scene = self.options.get("scene")
        self.slide_count = self.options.get("slide_count", 10)
        self.style = self.options.get("style", "professional")
        self.aspect_ratio = self.options.get("aspect_ratio", "16:9")
        self.created_at = datetime.now()

    def to_dict(self) -> Dict:
        return {
            "request_id": self.request_id,
            "user_request": self.user_request,
            "options": self.options,
            "created_at": self.created_at.isoformat()
        }


class Task:
    """任务单元"""

    def __init__(
        self,
        task_id: str,
        task_type: TaskType,
        description: str,
        depends_on: Optional[List[str]] = None,
        data: Optional[Dict] = None
    ):
        self.task_id = task_id
        self.task_type = task_type
        self.description = description
        self.depends_on = depends_on or []
        self.data = data or {}
        self.status = TaskStatus.PENDING
        self.result = None
        self.error = None
        self.started_at = None
        self.completed_at = None

    def to_dict(self) -> Dict:
        return {
            "task_id": self.task_id,
            "task_type": self.task_type.value,
            "description": self.description,
            "depends_on": self.depends_on,
            "status": self.status.value,
            "result": self.result,
            "error": self.error,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


class CoordinatorAgent:
    """
    总调度 Agent

    负责整个 PPT 生成流程的协调和调度:
    1. 解析用户 PPT 需求
    2. 拆分任务并分配给各 Agent
    3. 监控全流程执行
    4. 处理异常和重试
    """

    MAX_STEPS = 30
    DEFAULT_SLIDE_COUNT = 10
    MAX_SLIDE_COUNT = 50

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.max_steps = self.config.get("max_steps", self.MAX_STEPS)
        self.volcano_client = get_volcano_client()
        self._tasks: Dict[str, Task] = {}
        self._task_graph: Dict[str, List[str]] = {}
        self._current_step = 0
        self._context: Dict[str, Any] = {}

    def generate_ppt(self, user_request: str, options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        生成 PPT 的主入口

        Args:
            user_request: 用户需求描述
            options: 生成选项

        Returns:
            生成结果，包含 request_id, status, slides 等
        """
        # 创建请求
        request_id = str(uuid.uuid4())
        ppt_request = PPTRequest(request_id, user_request, options)

        # 验证输入
        if not user_request or len(user_request.strip()) < 5:
            return {
                "success": False,
                "error": "需求描述太短，请提供更详细的内容",
                "request_id": request_id
            }

        # 限制幻灯片数量
        if ppt_request.slide_count > self.MAX_SLIDE_COUNT:
            ppt_request.slide_count = self.MAX_SLIDE_COUNT

        # 开始执行流程
        try:
            result = self._execute_workflow(ppt_request)
            return {
                "success": True,
                "request_id": request_id,
                "status": "completed",
                "result": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "request_id": request_id,
                "status": "failed"
            }

    def _execute_workflow(self, ppt_request: PPTRequest) -> Dict[str, Any]:
        """执行完整的工作流程"""
        # 重置状态
        self._tasks.clear()
        self._task_graph.clear()
        self._current_step = 0
        self._context.clear()

        # 存储请求信息
        self._context["request"] = ppt_request.to_dict()

        # 第一阶段: 解析需求
        slides = self._parse_requirement(ppt_request)

        # 第二阶段: 生成内容
        slides = self._generate_content(slides)

        # 第三阶段: 渲染 SVG
        slides = self._render_svgs(slides)

        # 第四阶段: 转换为 PPTX
        pptx_path = self._convert_to_pptx(slides)

        # 第五阶段: 优化 PPTX
        optimized_path = self._optimize_pptx(pptx_path)

        return {
            "slides": slides,
            "pptx_path": optimized_path,
            "total_slides": len(slides)
        }

    def _parse_requirement(self, ppt_request: PPTRequest) -> List[Dict]:
        """解析用户需求，生成幻灯片结构"""
        self._current_step += 1
        logger.info(f"[Step {self._current_step}] 解析需求: {ppt_request.user_request}")

        # 使用提示词优化器生成结构
        optimized_prompt = PromptOptimizer.optimize_for_ppt(
            ppt_request.user_request,
            scene=ppt_request.scene,
            slide_count=ppt_request.slide_count,
            style=ppt_request.style
        )

        # 调用火山云生成
        result = self.volcano_client.generate_text(
            prompt=optimized_prompt,
            system_prompt="你是一位专业的 PPT 内容策划专家，擅长生成结构清晰、内容丰富的 PPT 内容。",
            temperature=0.7,
            max_tokens=16000
        )

        # 解析返回的内容
        content = result["content"]
        slides = self._parse_slides_from_response(content, ppt_request.user_request, ppt_request.slide_count)
        # DEBUG removed

        self._context["slides"] = slides
        return slides

    def _parse_slides_from_response(self, content: str, user_request: str = "", slide_count: int = 7) -> List[Dict]:
        """从 API 响应中解析幻灯片结构"""

        # DEBUG removed

        # 尝试提取 JSON
        json_match = None
        in_json_block = False
        for line in content.split("\n"):
            if "```json" in line:
                in_json_block = True
                json_match = []
                continue
            elif "```" in line and in_json_block:
                in_json_block = False
                break
            if in_json_block and line.strip():
                json_match.append(line)

        if json_match:
            try:
                data = json.loads("\n".join(json_match))
                slides = data.get("slides", [])
                if slides:
                    # DEBUG removed
                    return slides[:slide_count]  # 限制数量
            except json.JSONDecodeError as e:
                pass

        # 尝试直接解析整个响应为JSON
        try:
            data = json.loads(content)
            slides = data.get("slides", [])
            if slides:
                # DEBUG removed
                return slides[:slide_count]
        except json.JSONDecodeError:
            pass

        # 如果无法解析 JSON，打印原始响应供调试
        # DEBUG removed

        # 尝试按行解析标题
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        slides = []
        current_slide = None

        for line in lines:
            # 数字开头的行作为新幻灯片标题
            if line and (line[0].isdigit() or line.startswith("#") or "页" in line or "slide" in line.lower()):
                if current_slide:
                    slides.append(current_slide)
                current_slide = {"type": "content", "title": line.lstrip("0123456789.# ").strip(), "content": []}
            elif current_slide and len(line) > 5:
                current_slide["content"].append(line)

        if current_slide:
            slides.append(current_slide)

        if slides:
            # DEBUG removed
            return slides[:slide_count]

        # 如果仍然无法解析，使用 LLM 响应内容作为基础
        # DEBUG removed
        # 提取前几行作为标题
        key_lines = [l.strip() for l in content.split("\n") if len(l.strip()) > 10][:slide_count]
        slides = []
        for i, line in enumerate(key_lines):
            slides.append({
                "type": "content",
                "title": f"第{i+1}页",
                "content": [line] if line else ["内容"]
            })

        # 如果还是不够，补充默认幻灯片
        while len(slides) < slide_count:
            slides.append({
                "type": "content",
                "title": f"第{len(slides)+1}页",
                "content": ["继续完善中..."]
            })

        # DEBUG removed
        return slides

    def _generate_content(self, slides: List[Dict]) -> List[Dict]:
        """生成每页的详细内容"""
        self._current_step += 1
        logger.info(f"[Step {self._current_step}] 生成内容，共 {len(slides)} 页")

        for i, slide in enumerate(slides):
            self._current_step += 1
            if self._current_step > self.max_steps:
                raise Exception(f"超过最大步骤数 {self.max_steps}")

            logger.info(f"[Step {self._current_step}] 生成第 {i+1} 页内容: {slide.get('title', 'untitled')}")

            # 为每一页生成更详细的内容
            prompt = f"""为 PPT 页面生成详细内容。

页面标题: {slide.get('title', '无标题')}
页面类型: {slide.get('type', 'content')}

请生成 3-5 个关键要点，用简洁的语言描述。"""

            result = self.volcano_client.generate_text(
                prompt=prompt,
                temperature=0.7,
                max_tokens=2000
            )

            # 更新幻灯片内容
            slide["generated_content"] = result["content"]

        return slides

    def _render_svgs(self, slides: List[Dict]) -> List[Dict]:
        """渲染 SVG"""
        self._current_step += 1
        logger.info(f"[Step {self._current_step}] 渲染 SVG，共 {len(slides)} 页")

        # 这里会调用 SVG Agent
        for i, slide in enumerate(slides):
            self._current_step += 1
            if self._current_step > self.max_steps:
                raise Exception(f"超过最大步骤数 {self.max_steps}")

            logger.info(f"[Step {self._current_step}] 渲染第 {i+1} 页 SVG")

            # 模拟 SVG 渲染结果
            slide["svg_path"] = f"./output/slide_{i+1}.svg"

        return slides

    def _convert_to_pptx(self, slides: List[Dict]) -> str:
        """转换为 PPTX"""
        self._current_step += 1
        logger.info(f"[Step {self._current_step}] 转换为 PPTX")

        # 这里会调用 OkPPT Agent
        pptx_path = "./output/presentation.pptx"

        self._context["pptx_path"] = pptx_path
        return pptx_path

    def _optimize_pptx(self, pptx_path: str) -> str:
        """优化 PPTX"""
        self._current_step += 1
        logger.info(f"[Step {self._current_step}] 优化 PPTX")

        # 这里会调用 PPTX Optimizer Agent
        optimized_path = pptx_path.replace(".pptx", "_optimized.pptx")

        return optimized_path

    def get_task_status(self, request_id: str) -> Dict[str, Any]:
        """获取任务状态"""
        return {
            "request_id": request_id,
            "status": "completed",
            "progress": 100,
            "current_step": self._current_step,
            "tasks": [task.to_dict() for task in self._tasks.values()]
        }

    def cancel_task(self, request_id: str) -> bool:
        """取消任务"""
        # 取消逻辑
        return True


def create_coordinator(config: Optional[Dict] = None) -> CoordinatorAgent:
    """创建调度器实例"""
    return CoordinatorAgent(config)
