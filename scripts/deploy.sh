#!/bin/bash

# RabAi Mind 部署脚本
#
# 功能:
#   - 构建 Docker 镜像
#   - 启动/停止服务
#   - 查看日志
#   - 健康检查
#
# 使用方法:
#   ./deploy.sh start     - 启动服务
#   ./deploy.sh stop      - 停止服务
#   ./deploy.sh restart   - 重启服务
#   ./deploy.sh build     - 构建镜像
#   ./deploy.sh logs      - 查看日志
#   ./deploy.sh status    - 查看状态
#   ./deploy.sh health    - 健康检查
#   ./deploy.sh clean     - 清理数据

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    log_info "依赖检查完成"
}

# 检查环境变量
check_env() {
    log_info "检查环境变量..."

    if [ -z "$VOLCANO_API_KEY" ]; then
        if [ -f .env ]; then
            log_info "从 .env 文件加载环境变量"
            set -a
            source .env
            set +a
        else
            log_warn "VOLCANO_API_KEY 未设置，请创建 .env 文件或设置环境变量"
        fi
    fi
}

# 构建镜像
build() {
    log_info "构建 Docker 镜像..."
    docker-compose build --no-cache
    log_info "镜像构建完成"
}

# 启动服务
start() {
    log_info "启动服务..."

    # 检查 docker-compose 命令
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    $COMPOSE_CMD up -d
    log_info "服务已启动"
    status
}

# 停止服务
stop() {
    log_info "停止服务..."

    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    $COMPOSE_CMD down
    log_info "服务已停止"
}

# 重启服务
restart() {
    log_info "重启服务..."
    stop
    start
}

# 查看日志
logs() {
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    if [ "$1" == "-f" ]; then
        $COMPOSE_CMD logs -f
    else
        $COMPOSE_CMD logs --tail=100
    fi
}

# 查看状态
status() {
    log_info "服务状态:"
    docker-compose ps

    # 检查端口
    log_info "端口监听状态:"
    echo -n "  API (8000): "
    if netstat -tuln 2>/dev/null | grep -q ":8000 "; then
        echo -e "${GREEN}✓ 运行中${NC}"
    else
        echo -e "${RED}✗ 未运行${NC}"
    fi

    echo -n "  MCP (8080): "
    if netstat -tuln 2>/dev/null | grep -q ":8080 "; then
        echo -e "${GREEN}✓ 运行中${NC}"
    else
        echo -e "${RED}✗ 未运行${NC}"
    fi
}

# 健康检查
health() {
    log_info "执行健康检查..."

    local failed=0

    # 检查 API
    echo -n "  API 健康检查: "
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo -e "${GREEN}✓ 通过${NC}"
    else
        echo -e "${RED}✗ 失败${NC}"
        failed=1
    fi

    # 检查 MCP
    echo -n "  MCP 健康检查: "
    if curl -s http://localhost:8080/health | grep -q "healthy"; then
        echo -e "${GREEN}✓ 通过${NC}"
    else
        echo -e "${RED}✗ 失败${NC}"
        failed=1
    fi

    # 检查 Redis
    echo -n "  Redis 健康检查: "
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✓ 通过${NC}"
    else
        echo -e "${RED}✗ 失败${NC}"
        failed=1
    fi

    if [ $failed -eq 0 ]; then
        log_info "所有健康检查通过"
    else
        log_error "部分健康检查失败，请查看日志"
    fi
}

# 清理
clean() {
    log_warn "清理所有数据卷和容器..."
    docker-compose down -v
    docker system prune -f
    log_info "清理完成"
}

# 快速部署
deploy() {
    check_dependencies
    check_env
    build
    start
    health
}

# 显示帮助
help() {
    echo "RabAi Mind 部署脚本"
    echo ""
    echo "使用方法: $0 <命令>"
    echo ""
    echo "命令:"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  build     构建镜像"
    echo "  logs      查看日志 (使用 -f 跟踪日志)"
    echo "  status    查看状态"
    echo "  health    健康检查"
    echo "  clean     清理数据"
    echo "  deploy    一键部署 (构建+启动+检查)"
    echo ""
}

# 主入口
case "${1:-help}" in
    start)
        check_dependencies
        check_env
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    build)
        check_dependencies
        check_env
        build
        ;;
    logs)
        logs ${2:-}
        ;;
    status)
        status
        ;;
    health)
        health
        ;;
    clean)
        clean
        ;;
    deploy)
        deploy
        ;;
    *)
        help
        ;;
esac
