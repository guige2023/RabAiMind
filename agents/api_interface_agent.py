"""
多端接口 Agent (API Interface Agent)

负责 FastAPI 接口开发、文件下载、跨域、异步任务等
"""

import os
import uuid
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Task:
    """任务"""
    task_id: str
    status: TaskStatus
    request: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    progress: float = 0.0


class PPTGenerateRequest(BaseModel):
    """PPT 生成请求"""
    user_request: str = Field(..., description="用户需求描述", min_length=5)
    slide_count: int = Field(10, description="幻灯片数量", ge=1, le=50)
    scene: Optional[str] = Field("business", description="场景类型")
    style: str = Field("professional", description="风格")
    aspect_ratio: str = Field("16:9", description="宽高比")
    output_format: str = Field("pptx", description="输出格式")
    callback_url: Optional[str] = Field(None, description="回调 URL")


class PPTGenerateResponse(BaseModel):
    """PPT 生成响应"""
    request_id: str = Field(..., description="请求 ID")
    status: str = Field(..., description="任务状态")
    task_id: Optional[str] = Field(None, description="任务 ID")
    message: str = Field(..., description="响应消息")
    download_url: Optional[str] = Field(None, description="下载 URL")


class TaskManager:
    """任务管理器"""

    def __init__(self):
        self._tasks: Dict[str, Task] = {}
        self._max_tasks = 1000

    def create_task(self, request: Dict[str, Any]) -> str:
        """创建任务"""
        if len(self._tasks) >= self._max_tasks:
            # 清理已完成的任务
            self._cleanup()

        task_id = str(uuid.uuid4())
        task = Task(
            task_id=task_id,
            status=TaskStatus.PENDING,
            request=request
        )
        self._tasks[task_id] = task
        return task_id

    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务"""
        return self._tasks.get(task_id)

    def update_task(
        self,
        task_id: str,
        status: Optional[TaskStatus] = None,
        result: Optional[Dict] = None,
        error: Optional[str] = None,
        progress: Optional[float] = None
    ):
        """更新任务"""
        task = self._tasks.get(task_id)
        if task:
            if status:
                task.status = status
            if result is not None:
                task.result = result
            if error:
                task.error = error
            if progress is not None:
                task.progress = progress
            task.updated_at = datetime.now()

    def _cleanup(self):
        """清理已完成的任务"""
        completed = [
            tid for tid, task in self._tasks.items()
            if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED)
        ]
        for tid in completed[:100]:
            del self._tasks[tid]


class APIInterfaceAgent:
    """
    多端接口 Agent

    负责:
    - FastAPI 接口开发
    - 文件下载、跨域、异步任务
    - PPTGenerateRequest/PPTGenerateResponse 模型
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.app = None
        self.task_manager = TaskManager()
        self.output_dir = self.config.get("output_dir", "./output")
        self._coordinator = None

    def set_coordinator(self, coordinator):
        """设置调度器"""
        self._coordinator = coordinator

    def create_app(self) -> FastAPI:
        """创建 FastAPI 应用"""
        app = FastAPI(
            title="RabAi Mind PPT API",
            description="AI PPT 生成平台接口",
            version="1.0.0"
        )

        # 配置 CORS
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # 注册路由
        self._register_routes(app)

        self.app = app
        return app

    def _register_routes(self, app: FastAPI):
        """注册路由"""

        @app.get("/")
        async def root():
            """根路径"""
            return {
                "name": "RabAi Mind PPT API",
                "version": "1.0.0",
                "status": "running"
            }

        @app.get("/health")
        async def health():
            """健康检查"""
            return {"status": "healthy"}

        @app.post("/api/v1/ppt/generate", response_model=PPTGenerateResponse)
        async def generate_ppt(
            request: PPTGenerateRequest,
            background_tasks: BackgroundTasks
        ):
            """生成 PPT"""
            # 创建任务
            task_id = self.task_manager.create_task(request.dict())

            # 异步执行
            background_tasks.add_task(
                self._process_ppt_generation,
                task_id,
                request.dict()
            )

            return PPTGenerateResponse(
                request_id=task_id,
                status="pending",
                task_id=task_id,
                message="PPT 生成任务已创建"
            )

        @app.get("/api/v1/ppt/task/{task_id}")
        async def get_status(task_id: str):
            """获取任务状态"""
            task = self.task_manager.get_task(task_id)

            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")

            response = {
                "task_id": task.task_id,
                "status": task.status.value,
                "progress": task.progress,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            }

            if task.status == TaskStatus.COMPLETED and task.result:
                response["result"] = task.result

            if task.error:
                response["error"] = task.error

            return response

        @app.get("/api/v1/ppt/download/{task_id}")
        async def download_ppt(task_id: str):
            """下载 PPT"""
            task = self.task_manager.get_task(task_id)

            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")

            if task.status != TaskStatus.COMPLETED:
                raise HTTPException(status_code=400, detail="任务未完成")

            if not task.result or not task.result.get("pptx_path"):
                raise HTTPException(status_code=404, detail="文件不存在")

            file_path = task.result["pptx_path"]

            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="文件不存在")

            return FileResponse(
                file_path,
                media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                filename=os.path.basename(file_path)
            )

        @app.delete("/api/v1/ppt/task/{task_id}")
        async def cancel_task(task_id: str):
            """取消任务"""
            task = self.task_manager.get_task(task_id)

            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")

            if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                raise HTTPException(status_code=400, detail="任务已完成或失败")

            task.status = TaskStatus.FAILED
            task.error = "用户取消"
            task.updated_at = datetime.now()

            return {"message": "任务已取消"}

        @app.get("/api/v1/templates")
        async def list_templates():
            """获取模板列表"""
            templates = []

            template_dir = self.config.get("template_dir", "./templates")
            if os.path.exists(template_dir):
                for file in os.listdir(template_dir):
                    if file.endswith((".pptx", ".ppt")):
                        templates.append({
                            "name": os.path.splitext(file)[0],
                            "path": os.path.join(template_dir, file)
                        })

            return {"templates": templates}

        @app.post("/api/v1/upload/template")
        async def upload_template(file: UploadFile = File(...)):
            """上传模板"""
            template_dir = self.config.get("template_dir", "./templates")
            os.makedirs(template_dir, exist_ok=True)

            file_path = os.path.join(template_dir, file.filename)

            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)

            return {
                "message": "模板上传成功",
                "path": file_path
            }

    async def _process_ppt_generation(self, task_id: str, request: Dict):
        """处理 PPT 生成任务"""
        import logging
        logging.basicConfig(level=logging.INFO, filename='/Users/guige876/RabAiMind/ppt_generation.log')
        logger = logging.getLogger(__name__)

        try:
            logger.info(f"[{task_id}] 开始处理任务...")
            # 更新状态
            self.task_manager.update_task(task_id, status=TaskStatus.PROCESSING, progress=10)
            logger.info(f"[{task_id}] 状态更新为 PROCESSING")

            if not self._coordinator:
                logger.error(f"[{task_id}] 调度器未设置!")
                raise Exception("调度器未设置")

            logger.info(f"[{task_id}] 调用调度器生成PPT...")
            # 调用调度器
            result = self._coordinator.generate_ppt(
                user_request=request.get("user_request", ""),
                options={
                    "slide_count": request.get("slide_count", 10),
                    "scene": request.get("scene", "business"),
                    "style": request.get("style", "professional"),
                    "aspect_ratio": request.get("aspect_ratio", "16:9")
                }
            )

            logger.info(f"[{task_id}] 生成完成，结果: {result}")
            # 更新结果
            self.task_manager.update_task(
                task_id,
                status=TaskStatus.COMPLETED,
                result=result,
                progress=100
            )
            logger.info(f"[{task_id}] 任务完成!")

        except Exception as e:
            self.task_manager.update_task(
                task_id,
                status=TaskStatus.FAILED,
                error=str(e)
            )


def create_api_agent(config: Optional[Dict] = None) -> APIInterfaceAgent:
    """创建 API 接口 Agent"""
    return APIInterfaceAgent(config)
