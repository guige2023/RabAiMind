# RabAiMind Backend

FastAPI + SQLAlchemy + PostgreSQL + Redis + 百度云BOS

## 环境要求

- Python 3.10+
- PostgreSQL
- Redis
- 百度云BOS

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

## 运行

```bash
# 开发环境
uvicorn app.main:app --reload --port 8000

# 生产环境
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 项目结构

```
backend/
├── app/
│   ├── api/          # API路由
│   ├── core/         # 核心配置
│   ├── models/       # 数据库模型
│   ├── schemas/      # Pydantic模型
│   ├── services/     # 业务逻辑
│   └── main.py       # 应用入口
├── tests/            # 测试
├── requirements.txt  # 依赖
└── .env              # 环境变量
```
