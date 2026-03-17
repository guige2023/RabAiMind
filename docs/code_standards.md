# RabAi Mind 代码规范

## 1. Python 代码规范

### 1.1 命名规范

```python
# 模块名: 小写字母 + 下划线
import rabai_mind_agent
import volc_okppt_tools

# 类名: 大驼峰命名 (PascalCase)
class RabAiMindAgent:
    class CoordinatorAgent:
    class VolcanoAgent:

# 函数名/方法名: 小写字母 + 下划线 (snake_case)
def generate_ppt(user_request: str, options: dict = None):
    def validate_svg(svg_content: str):

# 常量: 全大写 + 下划线
MAX_SLIDE_COUNT = 30
DEFAULT_THEME_COLOR = "#165DFF"

# 私有成员: 单下划线前缀
class Agent:
    def _private_method(self):
        self._internal_state = {}
```

### 1.2 类型注解

```python
from typing import Optional, List, Dict, Any

def generate_ppt(
    user_request: str,
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """生成PPT的主入口函数

    Args:
        user_request: 用户需求描述
        options: 生成选项配置

    Returns:
        包含生成结果的字典
    """
    pass
```

### 1.3 中文注释规范

```python
class VolcanoAgent:
    """火山引擎 Agent - 负责调用火山引擎 API 生成 PPT 内容"""

    def __init__(self, config: Optional[Dict] = None):
        """初始化火山引擎 Agent

        Args:
            config: 配置字典，包含 API 密钥等
        """
        self.api_key = config.get("api_key") if config else None

    def generate_presentation(
        self,
        user_request: str,
        slide_count: int = 10,
        scene: str = "business",
        style: str = "professional"
    ) -> List[Dict[str, Any]]:
        """生成演示文稿内容

        根据用户需求调用火山引擎 API 生成幻灯片内容。

        Args:
            user_request: 用户需求描述
            slide_count: 幻灯片数量，默认10页
            scene: 场景类型 (business/education/tech/creative)
            style: 风格 (professional/simple/energetic/premium)

        Returns:
            幻灯片内容列表，每页包含标题、正文、配图等信息

        Raises:
            VolcanoAPIError: API 调用失败时抛出
        """
        # 步骤 1: 构建请求参数
        request_params = self._build_request_params(
            user_request=user_request,
            slide_count=slide_count,
            scene=scene,
            style=style
        )

        # 步骤 2: 调用火山引擎 API
        try:
            response = self._call_api(request_params)
        except Exception as e:
            raise VolcanoAPIError(f"火山引擎 API 调用失败: {str(e)}")

        # 步骤 3: 解析响应内容
        slides = self._parse_response(response)

        return slides
```

### 1.4 异常处理规范

```python
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class RabAiMindError(Exception):
    """RabAi Mind 基础异常类"""
    pass

class VolcanoAPIError(RabAiMindError):
    """火山引擎 API 调用异常"""
    pass

class SVGValidationError(RabAiMindError):
    """SVG 验证异常"""
    pass

class PPTXConversionError(RabAiMindError):
    """PPTX 转换异常"""
    pass

def safe_generate(func):
    """生成任务安全装饰器

    统一处理异常和日志记录
    """
    def wrapper(*args, **kwargs):
        try:
            logger.info(f"开始执行 {func.__name__}")
            result = func(*args, **kwargs)
            logger.info(f"{func.__name__} 执行成功")
            return result
        except VolcanoAPIError as e:
            logger.error(f"火山引擎 API 错误: {str(e)}")
            # 重试逻辑
            for i in range(3):
                try:
                    logger.info(f"第 {i+1} 次重试...")
                    return func(*args, **kwargs)
                except Exception:
                    continue
            raise
        except SVGValidationError as e:
            logger.error(f"SVG 验证错误: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"未知错误: {str(e)}")
            raise RabAiMindError(f"生成失败: {str(e)}")

    return wrapper
```

---

## 2. 前端代码规范

### 2.1 Vue3 组合式 API

```typescript
// 使用组合式 API
import { ref, computed, onMounted } from 'vue'
import type { Ref } from 'vue'

// 类型定义
interface TaskState {
  taskId: string | null
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
}

interface SlideData {
  title: string
  content: string
  imageUrl?: string
}

// 组件示例
export function usePptGenerator() {
  // 响应式状态
  const taskState: Ref<TaskState> = ref({
    taskId: null,
    status: 'idle',
    progress: 0
  })

  const slides: Ref<SlideData[]> = ref([])

  // 计算属性
  const isGenerating = computed(() =>
    taskState.value.status === 'pending' ||
    taskState.value.status === 'processing'
  )

  // 方法
  const generatePpt = async (userRequest: string, options?: any) => {
    try {
      taskState.value.status = 'pending'

      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_request: userRequest, ...options })
      })

      const data = await response.json()

      if (data.success) {
        taskState.value.taskId = data.task_id
        taskState.value.status = 'processing'
        startPolling(data.task_id)
      }
    } catch (error) {
      taskState.value.status = 'failed'
      console.error('生成失败:', error)
    }
  }

  // 轮询任务状态
  const startPolling = (taskId: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/v1/task/${taskId}`)
      const data = await response.json()

      if (data.status === 'completed') {
        taskState.value.status = 'completed'
        clearInterval(interval)
      } else if (data.status === 'failed') {
        taskState.value.status = 'failed'
        clearInterval(interval)
      } else {
        taskState.value.progress = data.progress
      }
    }, 2000)
  }

  return {
    taskState,
    slides,
    isGenerating,
    generatePpt
  }
}
```

### 2.2 组件命名规范

```typescript
// 组件文件名: 大驼峰
// PptPreview.vue
// TaskProgress.vue
// SlideEditor.vue

// 组件名: 大驼峰
export default {
  name: 'PptPreview',
  // ...
}

// Props 定义
interface Props {
  taskId: string
  slideCount?: number
  showProgress?: boolean
}
```

---

## 3. API 接口规范

### 3.1 RESTful 设计

```python
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1", tags=["ppt"])

# 请求模型
class GenerateRequest(BaseModel):
    """PPT生成请求模型"""
    user_request: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="用户需求描述"
    )
    slide_count: int = Field(
        default=10,
        ge=5,
        le=30,
        description="幻灯片数量"
    )
    scene: str = Field(
        default="business",
        description="场景类型"
    )
    style: str = Field(
        default="professional",
        description="风格"
    )

# 响应模型
class GenerateResponse(BaseModel):
    """PPT生成响应模型"""
    success: bool
    task_id: str
    status: str
    message: str

# 接口实现
@router.post("/generate", response_model=GenerateResponse)
async def generate_ppt(request: GenerateRequest):
    """提交 PPT 生成任务

    根据用户需求生成演示文稿。

    Args:
        request: 生成请求参数

    Returns:
        生成任务响应

    Raises:
        HTTPException: 请求参数无效或生成失败
    """
    # 参数验证
    if not request.user_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户需求不能为空"
        )

    # 创建任务
    task_id = await create_task(request.dict())

    return GenerateResponse(
        success=True,
        task_id=task_id,
        status="pending",
        message="任务已提交"
    )
```

---

## 4. 数据库/缓存规范

### 4.1 Redis 键命名规范

```python
# 键前缀: 项目:模块:标识
# 键名全部小写，使用冒号分隔

# 任务相关
TASK_PREFIX = "rabai:task:"           # 任务前缀
TASK_STATUS = "status"                # 状态
TASK_PROGRESS = "progress"           # 进度
TASK_RESULT = "result"                # 结果
TASK_CREATED_AT = "created_at"        # 创建时间

# 示例键名
# rabai:task:abc123:status = "processing"
# rabai:task:abc123:progress = 50
# rabai:task:abc123:result = {...}

# 用户相关
USER_PREFIX = "rabai:user:"           # 用户前缀

# 缓存相关
CACHE_PREFIX = "rabai:cache:"         # 缓存前缀
CACHE_TTL = 3600                      # 缓存过期时间(秒)
```

---

## 5. 日志规范

### 5.1 日志格式

```python
import logging
from logging.handlers import RotatingFileHandler

# 日志配置
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logger(name: str, log_file: str = None, level=logging.INFO):
    """日志初始化

    Args:
        name: logger 名称
        log_file: 日志文件路径
        level: 日志级别

    Returns:
        配置好的 logger 对象
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(
        logging.Formatter(LOG_FORMAT, DATE_FORMAT)
    )
    logger.addHandler(console_handler)

    # 文件处理器 (可选)
    if log_file:
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(
            logging.Formatter(LOG_FORMAT, DATE_FORMAT)
        )
        logger.addHandler(file_handler)

    return logger

# 使用示例
logger = setup_logger("rabai_mind", "./logs/rabai_mind.log")

# 记录日志
logger.info("任务提交成功")
logger.warning("火山引擎 API 响应超时")
logger.error("PPTX 转换失败")
```

---

## 6. 配置管理规范

### 6.1 YAML 配置

```yaml
# config.yaml
volcano:
  api_key: "${VOLCANO_API_KEY}"  # 环境变量引用
  text_model: "ep-xxx"
  image_model: "ep-xxx"
  endpoint: "https://ark.cn-beijing.volces.com/api/v3"
  timeout: 120

mcp:
  host: "0.0.0.0"
  port: 8080
  okppt_server_path: "/usr/local/bin/mcp-server-okppt"

web:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "*"

ppt:
  default_size:
    width: 1600
    height: 900
  default_aspect_ratio: "16:9"
  output_formats:
    - pptx
    - pdf

logging:
  level: "INFO"
  file: "./logs/rabai_mind.log"
  max_bytes: 10485760
  backup_count: 5
```

---

## 7. 测试规范

### 7.1 单元测试

```python
import pytest
from unittest.mock import Mock, patch

class TestVolcanoAgent:
    """火山引擎 Agent 单元测试"""

    @pytest.fixture
    def agent(self):
        """测试夹具"""
        config = {
            "api_key": "test-key",
            "endpoint": "https://test.volces.com"
        }
        return VolcanoAgent(config)

    def test_generate_presentation(self, agent):
        """测试内容生成"""
        # Mock API 响应
        mock_response = {
            "slides": [
                {"title": "标题1", "content": "内容1"},
                {"title": "标题2", "content": "内容2"}
            ]
        }

        with patch.object(agent, '_call_api', return_value=mock_response):
            slides = agent.generate_presentation(
                user_request="测试需求",
                slide_count=2
            )

            assert len(slides) == 2
            assert slides[0]["title"] == "标题1"

    def test_validate_params(self, agent):
        """测试参数验证"""
        with pytest.raises(ValueError):
            agent.generate_presentation(
                user_request="",  # 空请求
                slide_count=10
            )
```

---

## 8. Git 提交规范

### 8.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 8.2 类型说明

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式 |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/辅助工具 |

### 8.3 提交示例

```
feat(agent): 添加火山引擎 Agent 内容生成功能

- 实现 VolcanoAgent 类
- 添加 generate_presentation 方法
- 支持场景和风格参数

Closes #123
```
