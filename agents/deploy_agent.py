"""
部署运维 Agent (Deploy Agent)

负责 Docker 部署、Redis/OSS 配置、端口暴露等
"""

import os
import json
import shutil
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum


class DeployMode(str, Enum):
    """部署模式"""
    LOCAL = "local"
    DOCKER = "docker"
    KUBERNETES = "kubernetes"
    CLOUD = "cloud"


@dataclass
class DeployConfig:
    """部署配置"""
    mode: DeployMode = DeployMode.DOCKER
    web_port: int = 8000
    mcp_port: int = 8080
    enable_redis: bool = False
    enable_oss: bool = False
    image_name: str = "rabai-mind-ppt"
    image_tag: str = "latest"


class DockerManager:
    """Docker 管理器"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    def build_image(
        self,
        image_name: str,
        image_tag: str = "latest",
        dockerfile: str = "Dockerfile",
        context: str = "."
    ) -> bool:
        """构建 Docker 镜像"""
        import subprocess

        tag = f"{image_name}:{image_tag}"

        try:
            result = subprocess.run(
                ["docker", "build", "-t", tag, "-f", dockerfile, context],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                print(f"镜像构建成功: {tag}")
                return True
            else:
                print(f"镜像构建失败: {result.stderr}")
                return False

        except FileNotFoundError:
            print("Docker 未安装或不在 PATH 中")
            return False

    def run_container(
        self,
        image_name: str,
        container_name: Optional[str] = None,
        ports: Optional[Dict[int, int]] = None,
        env: Optional[Dict[str, str]] = None,
        volumes: Optional[Dict[str, str]] = None,
        detach: bool = True
    ) -> bool:
        """运行容器"""
        import subprocess

        cmd = ["docker", "run"]

        if detach:
            cmd.append("-d")

        if container_name:
            cmd.extend(["--name", container_name])

        # 端口映射
        if ports:
            for host_port, container_port in ports.items():
                cmd.extend(["-p", f"{host_port}:{container_port}"])

        # 环境变量
        if env:
            for key, value in env.items():
                cmd.extend(["-e", f"{key}={value}"])

        # 卷挂载
        if volumes:
            for host_path, container_path in volumes.items():
                cmd.extend(["-v", f"{host_path}:{container_path}"])

        cmd.append(image_name)

        try:
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                print(f"容器启动成功")
                return True
            else:
                print(f"容器启动失败: {result.stderr}")
                return False

        except FileNotFoundError:
            print("Docker 未安装或不在 PATH 中")
            return False


class ComposeManager:
    """Docker Compose 管理器"""

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

    def generate_compose_file(
        self,
        web_port: int = 8000,
        mcp_port: int = 8080,
        enable_redis: bool = False,
        enable_oss: bool = False
    ) -> Dict[str, Any]:
        """生成 docker-compose 文件"""
        services = {
            "rabai-mind": {
                "build": ".",
                "ports": [
                    f"{web_port}:8000",
                    f"{mcp_port}:8080"
                ],
                "environment": [
                    "VOLCANO_API_KEY=${VOLCANO_API_KEY}",
                    "VOLCANO_SECRET=${VOLCANO_SECRET}"
                ],
                "volumes": [
                    "./output:/app/output",
                    "./templates:/app/templates"
                ],
                "restart": "unless-stopped"
            }
        }

        if enable_redis:
            services["redis"] = {
                "image": "redis:7-alpine",
                "ports": ["6379:6379"],
                "volumes": ["redis-data:/data"],
                "restart": "unless-stopped"
            }
            services["rabai-mind"]["environment"].append("REDIS_HOST=redis")
            services["rabai-mind"]["depends_on"] = ["redis"]

        if enable_oss:
            services["rabai-mind"]["environment"].extend([
                "OSS_ENDPOINT=${OSS_ENDPOINT}",
                "OSS_BUCKET=${OSS_BUCKET}",
                "OSS_ACCESS_KEY=${OSS_ACCESS_KEY}",
                "OSS_SECRET_KEY=${OSS_SECRET_KEY}"
            ])

        compose = {
            "version": "3.8",
            "services": services,
            "volumes": {}
        }

        if enable_redis:
            compose["volumes"]["redis-data"] = None

        return compose

    def save_compose_file(self, path: str = "./docker-compose.yaml"):
        """保存 docker-compose 文件"""
        compose = self.generate_compose_file()

        import yaml
        with open(path, "w", encoding="utf-8") as f:
            yaml.dump(compose, f, default_flow_style=False, allow_unicode=True)

        return path


class DeployAgent:
    """
    部署运维 Agent

    负责:
    - 编写 Dockerfile
    - 配置 Redis/OSS
    - 端口 8000/8080 暴露
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}
        self.docker_manager = DockerManager(config)
        self.compose_manager = ComposeManager(config)

    def generate_dockerfile(self) -> str:
        """生成 Dockerfile"""
        dockerfile = """FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \\
    libreoffice \\
    fonts-wqy-microhei \\
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建输出目录
RUN mkdir -p /app/output /app/templates /app/logs

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV MCP_PORT=8080

# 暴露端口
EXPOSE 8000 8080

# 启动命令
CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
"""
        return dockerfile

    def save_dockerfile(self, path: str = "./Dockerfile"):
        """保存 Dockerfile"""
        dockerfile = self.generate_dockerfile()

        with open(path, "w", encoding="utf-8") as f:
            f.write(dockerfile)

        return path

    def generate_docker_compose(
        self,
        web_port: int = 8000,
        mcp_port: int = 8080,
        enable_redis: bool = False,
        enable_oss: bool = False
    ) -> str:
        """生成 docker-compose.yaml"""
        compose = self.compose_manager.generate_compose_file(
            web_port=web_port,
            mcp_port=mcp_port,
            enable_redis=enable_redis,
            enable_oss=enable_oss
        )

        import yaml
        return yaml.dump(compose, default_flow_style=False, allow_unicode=True)

    def save_docker_compose(self, path: str = "./docker-compose.yaml"):
        """保存 docker-compose.yaml"""
        content = self.generate_docker_compose()

        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

        return path

    def deploy_local(self) -> bool:
        """本地部署"""
        # 保存必要的文件
        self.save_dockerfile()
        self.save_docker_compose()

        # 检查 Docker
        try:
            import subprocess
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True
            )
            print(f"Docker 版本: {result.stdout.strip()}")
        except FileNotFoundError:
            print("Docker 未安装")
            return False

        # 构建镜像
        image_name = self.config.get("image_name", "rabai-mind-ppt")
        image_tag = self.config.get("image_tag", "latest")

        success = self.docker_manager.build_image(image_name, image_tag)

        if success:
            # 运行容器
            ports = {
                8000: 8000,
                8080: 8080
            }

            self.docker_manager.run_container(
                f"{image_name}:{image_tag}",
                container_name="rabai-mind",
                ports=ports,
                env={
                    "VOLCANO_API_KEY": os.environ.get("VOLCANO_API_KEY", ""),
                    "VOLCANO_SECRET": os.environ.get("VOLCANO_SECRET", "")
                }
            )

        return success

    def deploy_docker_compose(self, detach: bool = True) -> bool:
        """使用 docker-compose 部署"""
        import subprocess

        # 保存文件
        self.save_dockerfile()
        self.save_docker_compose()

        cmd = ["docker-compose", "up"]
        if detach:
            cmd.append("-d")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                print("部署成功")
                return True
            else:
                print(f"部署失败: {result.stderr}")
                return False

        except FileNotFoundError:
            print("docker-compose 未安装")
            return False

    def stop(self) -> bool:
        """停止服务"""
        import subprocess

        try:
            subprocess.run(
                ["docker-compose", "down"],
                capture_output=True
            )
            return True
        except Exception:
            return False

    def logs(self, service: str = "rabai-mind", tail: int = 100) -> str:
        """查看日志"""
        import subprocess

        try:
            result = subprocess.run(
                ["docker-compose", "logs", "--tail", str(tail), service],
                capture_output=True,
                text=True
            )
            return result.stdout
        except Exception as e:
            return f"获取日志失败: {e}"

    def status(self) -> Dict[str, Any]:
        """查看服务状态"""
        import subprocess

        try:
            result = subprocess.run(
                ["docker-compose", "ps"],
                capture_output=True,
                text=True
            )
            return {
                "status": "running",
                "output": result.stdout
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    def setup_redis_config(self) -> Dict[str, Any]:
        """生成 Redis 配置"""
        return {
            "host": os.environ.get("REDIS_HOST", "localhost"),
            "port": int(os.environ.get("REDIS_PORT", "6379")),
            "db": int(os.environ.get("REDIS_DB", "0")),
            "password": os.environ.get("REDIS_PASSWORD"),
            "max_connections": 50,
            "socket_timeout": 5
        }

    def setup_oss_config(self) -> Dict[str, Any]:
        """生成 OSS 配置"""
        return {
            "enabled": True,
            "endpoint": os.environ.get("OSS_ENDPOINT", ""),
            "bucket": os.environ.get("OSS_BUCKET", ""),
            "access_key": os.environ.get("OSS_ACCESS_KEY", ""),
            "secret_key": os.environ.get("OSS_SECRET_KEY", "")
        }

    def health_check(self, url: str = "http://localhost:8000/health") -> bool:
        """健康检查"""
        import requests

        try:
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except Exception:
            return False


def create_deploy_agent(config: Optional[Dict] = None) -> DeployAgent:
    """创建部署运维 Agent"""
    return DeployAgent(config)
