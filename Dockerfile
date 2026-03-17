# RabAi Mind Dockerfile
#
# 构建: docker build -t rabai-mind .
# 运行: docker run -p 8000:8000 -p 8080:8080 rabai-mind

# 基础镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    MCP_PORT=8080

# ==================== 系统依赖 ====================
# 安装 LibreOffice (用于 PPT 转换)
# 安装中文字体 (支持中文显示)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # 办公软件
    libreoffice \
    # 中文字体
    fonts-wqy-microhei \
    fonts-wqy-zenhei \
    # 网络工具
    curl \
    # 压缩工具
    gzip \
    # 清理缓存
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ==================== Python 依赖 ====================
# 先复制依赖文件，安装后再复制代码 (利用 Docker 缓存)
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# ==================== 应用代码 ====================
# 复制应用代码
COPY . .

# ==================== 目录设置 ====================
# 创建必要的目录
RUN mkdir -p /app/output /app/templates /app/logs /app/workspace

# 设置目录权限
RUN chmod 755 /app/output /app/templates /app/logs /app/workspace

# ==================== 暴露端口 ====================
# API 服务端口: 8000
# MCP 服务端口: 8080
EXPOSE 8000 8080

# ==================== 启动命令 ====================
# 默认启动 API 服务
CMD ["python", "api.py"]

# 可选的启动方式:
# - MCP 服务: python mcp_server.py --port 8080
# - 生产模式: gunicorn -w 4 -k uvicorn.workers.UvicornWorker api:app
