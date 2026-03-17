# RabAi Mind 部署运维手册

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | RabAi Mind 部署运维手册 |
| 版本号 | v1.0.0 |
| 创建日期 | 2026-03-17 |
| 运维工程师 | 运维/部署 Agent |

---

## 一、系统要求

### 1.1 硬件要求

| 配置 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 20 GB | 100 GB SSD |
| 带宽 | 5 Mbps | 10 Mbps+ |

### 1.2 软件要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| 操作系统 | Ubuntu 20.04+ / CentOS 8+ | 推荐 Ubuntu 22.04 |
| Docker | 20.10+ | 容器运行时 |
| Docker Compose | 2.0+ | 容器编排 |

### 1.3 网络要求

- 开放端口: 8000 (API), 8080 (MCP)
- 允许访问火山引擎 API
- 允许访问 OSS (如使用)

---

## 二、快速开始

### 2.1 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/rabai-mind.git
cd rabai-mind

# 2. 配置环境变量
cp .env.example .env
vim .env  # 填写 VOLCANO_API_KEY

# 3. 一键部署
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy
```

### 2.2 手动部署

```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 检查状态
docker-compose ps
docker-compose logs -f
```

---

## 三、配置详解

### 3.1 环境变量

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| VOLCANO_API_KEY | ✅ | 火山引擎 API 密钥 | sk-xxx |
| VOLCANO_SECRET | ❌ | API 密钥私钥 | - |
| REDIS_URL | ❌ | Redis 连接地址 | redis://redis:6379/0 |
| OSS_ENDPOINT | ❌ | OSS 端点 | https://oss-cn-beijing.aliyuncs.com |
| OSS_BUCKET | ❌ | OSS Bucket | rabai-mind |
| LOG_LEVEL | ❌ | 日志级别 | INFO |

### 3.2 端口配置

| 端口 | 服务 | 说明 |
|------|------|------|
| 8000 | API | REST API 服务 |
| 8080 | MCP | MCP 协议服务 |
| 6379 | Redis | Redis 服务 (内部) |

---

## 四、服务管理

### 4.1 常用命令

```bash
# 启动服务
./scripts/deploy.sh start

# 停止服务
./scripts/deploy.sh stop

# 重启服务
./scripts/deploy.sh restart

# 查看状态
./scripts/deploy.sh status

# 查看日志
./scripts/deploy.sh logs        # 最近 100 行
./scripts/deploy.sh logs -f      # 实时日志

# 健康检查
./scripts/deploy.sh health

# 清理数据
./scripts/deploy.sh clean
```

### 4.2 Docker Compose 命令

```bash
# 查看所有容器
docker-compose ps

# 进入容器
docker-compose exec api bash
docker-compose exec redis redis-cli

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f api
docker-compose logs -f mcp
```

---

## 五、运维监控

### 5.1 健康检查

```bash
# API 健康检查
curl http://localhost:8000/health

# MCP 健康检查
curl http://localhost:8080/health
```

响应示例:
```json
{
  "status": "healthy",
  "service": "rabai-mind-api"
}
```

### 5.2 监控指标

| 指标 | 阈值 | 说明 |
|------|------|------|
| API 响应时间 | < 2s | 正常 |
| 任务失败率 | < 5% | 正常 |
| CPU 使用率 | < 80% | 正常 |
| 内存使用率 | < 85% | 正常 |
| 磁盘使用率 | < 90% | 正常 |

### 5.3 日志管理

```bash
# 查看 API 日志
docker-compose logs -f api

# 查看 MCP 日志
docker-compose logs -f mcp

# 查看所有日志
docker-compose logs -f

# 日志轮转 (Docker 默认)
# 查看日志大小
docker system df
```

---

## 六、故障排查

### 6.1 常见问题

#### 问题 1: 服务无法启动

```bash
# 检查日志
docker-compose logs

# 常见原因:
# 1. 端口被占用
netstat -tuln | grep -E "8000|8080"

# 2. 配置文件错误
docker-compose config

# 3. 磁盘空间不足
docker system df
```

#### 问题 2: API 调用失败

```bash
# 检查 API 服务状态
curl http://localhost:8000/health

# 检查环境变量
docker-compose exec api env | grep VOLCANO

# 检查日志
docker-compose logs api
```

#### 问题 3: PPT 生成超时

```bash
# 检查任务队列
docker-compose exec redis redis-cli LLEN rabai:tasks

# 增加超时时间
# 修改 docker-compose.yaml 中的 TASK_TIMEOUT
```

### 6.2 数据备份

```bash
# 备份输出文件
tar -czf rabai-backup-$(date +%Y%m%d).tar.gz output/

# 备份 Redis 数据
docker-compose exec redis redis-cli BGSAVE
docker cp rabai-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## 七、安全配置

### 7.1 防火墙配置

```bash
# Ubuntu (UFW)
ufw allow 8000/tcp  # API
ufw allow 8080/tcp  # MCP
ufw enable

# CentOS (firewalld)
firewall-cmd --permanent --add-port=8000/tcp
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

### 7.2 HTTPS 配置 (推荐)

```nginx
# Nginx 配置示例
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 7.3 密钥管理

- ✅ 不将密钥提交到 Git
- ✅ 使用环境变量或密钥管理服务
- ✅ 定期轮换 API 密钥
- ✅ 限制 Redis 访问密码

---

## 八、扩展部署

### 8.1 集群部署

```yaml
# docker-compose.prod.yaml
version: '3.8'

services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### 8.2 负载均衡

```nginx
# Nginx 负载均衡
upstream rabai_api {
    server 192.168.1.10:8000;
    server 192.168.1.11:8000;
    server 192.168.1.12:8000;
}
```

---

## 九、升级指南

### 9.1 版本升级

```bash
# 1. 备份数据
./scripts/deploy.sh backup

# 2. 拉取新代码
git pull origin main

# 3. 重新构建
docker-compose build

# 4. 重启服务
docker-compose up -d

# 5. 检查状态
./scripts/deploy.sh health
```

### 9.2 回滚

```bash
# 回滚到上一个版本
git revert HEAD
docker-compose up -d
```

---

## 十、附录

### 10.1 目录结构

```
rabai_mind/
├── api.py                    # FastAPI 入口
├── mcp_server_optimized.py    # MCP 服务
├── docker-compose.yaml        # 容器编排
├── Dockerfile                # 镜像构建
├── scripts/
│   └── deploy.sh           # 部署脚本
├── .env.example             # 环境变量示例
├── output/                   # PPT 输出
├── logs/                     # 日志
└── templates/               # PPT 模板
```

### 10.2 快速命令参考

```bash
# 部署
./scripts/deploy.sh deploy

# 启动
./scripts/deploy.sh start

# 停止
./scripts/deploy.sh stop

# 重启
./scripts/deploy.sh restart

# 状态
./scripts/deploy.sh status

# 日志
./scripts/deploy.sh logs

# 健康检查
./scripts/deploy.sh health

# 清理
./scripts/deploy.sh clean
```

---

**技术支持**: 如有问题，请提交 Issue 或联系维护者。

**版本历史**:

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v1.0.0 | 2026-03-17 | 初始版本 |
