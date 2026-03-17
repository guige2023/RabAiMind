"""
火山云工具封装模块 (火山引擎/MiniMax)

提供火山引擎 API 调用、提示词优化等功能
"""

import os
from typing import Optional, Dict, Any, List
import yaml

# 火山引擎 SDK
try:
    from volcenginesdkarkruntime import Ark
    VOLC_SDK_AVAILABLE = True
except ImportError:
    VOLC_SDK_AVAILABLE = False


class Config:
    """配置加载器"""

    _instance = None
    _config = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._config is None:
            self._load_config()

    def _load_config(self):
        """加载配置文件"""
        possible_paths = [
            "config.yaml",
            os.path.join(os.getcwd(), "config.yaml"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml"),
        ]

        config_path = None
        for path in possible_paths:
            if os.path.exists(path):
                config_path = path
                break

        if not config_path:
            raise FileNotFoundError(f"配置文件未找到，搜索路径: {possible_paths}")

        with open(config_path, "r", encoding="utf-8") as f:
            self._config = yaml.safe_load(f)

        self._replace_env_vars()

    def _replace_env_vars(self):
        """替换环境变量"""
        def replace_value(value):
            if isinstance(value, dict):
                return {k: replace_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [replace_value(v) for v in value]
            elif isinstance(value, str) and value.startswith("${") and value.endswith("}"):
                env_var = value[2:-1]
                return os.environ.get(env_var, "")
            return value

        self._config = replace_value(self._config)

    def get(self, key: str, default: Any = None) -> Any:
        """获取配置项"""
        keys = key.split(".")
        value = self._config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
            if value is None:
                return default
        return value

    @property
    def config(self) -> Dict:
        """获取完整配置"""
        return self._config


class VolcanoAPIError(Exception):
    """火山云 API 异常"""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class VolcanoClient:
    """火山引擎 API 客户端"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or Config()
        self.api_key = self.config.get("volcano.api_key")
        self.base_url = self.config.get("volcano.endpoint", "https://ark.cn-beijing.volces.com/api/v3")
        self.text_model = self.config.get("volcano.text_model", "ep-20260303221115-dk4rt")
        self.image_model = self.config.get("volcano.image_model", "ep-20260314123401-jwqhn")
        self.timeout = self.config.get("volcano.timeout", 120)

        # 初始化客户端
        self._client = None
        self._init_client()

    def _init_client(self):
        """初始化火山引擎客户端"""
        if not VOLC_SDK_AVAILABLE:
            raise ImportError("请安装火山引擎 SDK: pip install 'volcengine-python-sdk[ark]'")

        self._client = Ark(
            base_url=self.base_url,
            api_key=self.api_key,
        )

    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 32000,
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """
        调用文本生成 API

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词
            temperature: 温度参数
            max_tokens: 最大 token 数
            stream: 是否流式返回
            **kwargs: 其他参数

        Returns:
            生成的文本结果
        """
        messages = []

        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })

        messages.append({
            "role": "user",
            "content": prompt
        })

        extra_headers = kwargs.get("extra_headers", {})
        # 免费开启推理会话应用层加密
        extra_headers.setdefault("x-is-encrypted", "true")

        try:
            if stream:
                # 流式调用
                stream_response = self._client.chat.completions.create(
                    model=self.text_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                    extra_headers=extra_headers,
                    **kwargs
                )

                content = ""
                for chunk in stream_response:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        content += delta.content

                return {
                    "content": content,
                    "usage": {},
                    "model": self.text_model,
                    "id": ""
                }
            else:
                # 非流式调用
                completion = self._client.chat.completions.create(
                    model=self.text_model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    extra_headers=extra_headers,
                    **kwargs
                )

                # 处理 usage 对象
                usage = completion.usage
                if usage:
                    usage_dict = {
                        "prompt_tokens": usage.prompt_tokens,
                        "completion_tokens": usage.completion_tokens,
                        "total_tokens": usage.total_tokens
                    }
                else:
                    usage_dict = {}

                return {
                    "content": completion.choices[0].message.content,
                    "usage": usage_dict,
                    "model": completion.model,
                    "id": completion.id
                }

        except Exception as e:
            raise VolcanoAPIError(f"文本生成失败: {str(e)}")

    def generate_image(
        self,
        prompt: str,
        size: Optional[str] = None,
        style: str = "natural",
        **kwargs
    ) -> Dict[str, Any]:
        """
        调用图片生成 API

        Args:
            prompt: 图片描述
            size: 图片尺寸 (可选，如 "1920x1080")
            style: 风格
            **kwargs: 其他参数

        Returns:
            生成的图片 URL 或 Base64
        """
        try:
            # 使用用户指定的 size 或不传（使用默认值）
            image_size = kwargs.pop("size", size)

            response = self._client.images.generate(
                model=self.image_model,
                prompt=prompt,
                sequential_image_generation=kwargs.get("sequential_image_generation", "disabled"),
                response_format=kwargs.get("response_format", "url"),
                size=image_size,
                stream=False,
                watermark=kwargs.get("watermark", True),
            )

            # 处理返回的 Image 对象
            image_data = response.data[0]
            return {
                "url": image_data.url,
                "b64_json": getattr(image_data, "b64_json", None),
                "revised_prompt": getattr(image_data, "revised_prompt", prompt)
            }

        except Exception as e:
            raise VolcanoAPIError(f"图片生成失败: {str(e)}")

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 32000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        对话接口

        Args:
            messages: 消息列表 [{"role": "user/assistant/system", "content": "..."}]
            temperature: 温度参数
            max_tokens: 最大 token 数
            **kwargs: 其他参数

        Returns:
            对话结果
        """
        extra_headers = kwargs.get("extra_headers", {})
        extra_headers.setdefault("x-is-encrypted", "true")

        try:
            completion = self._client.chat.completions.create(
                model=self.text_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                extra_headers=extra_headers,
                timeout=30,  # 添加30秒超时
                **kwargs
            )

            # 处理 usage 对象
            usage = completion.usage
            if usage:
                usage_dict = {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                }
            else:
                usage_dict = {}

            return {
                "content": completion.choices[0].message.content,
                "usage": usage_dict,
                "finish_reason": completion.choices[0].finish_reason,
                "model": completion.model,
                "id": completion.id
            }

        except Exception as e:
            raise VolcanoAPIError(f"对话失败: {str(e)}")


class PromptOptimizer:
    """提示词优化器"""

    # PPT 场景关键词
    PPT_SCENE_KEYWORDS = {
        "business": ["商业", "公司", "企业", "汇报", "方案", "计划", "报告"],
        "education": ["教学", "课程", "课件", "培训", "学习", "学术"],
        "marketing": ["营销", "推广", "宣传", "广告", "品牌", "活动"],
        "technology": ["技术", "产品", "开发", "创新", "科技"],
        "personal": ["个人", "简历", "简介", "展示", "演讲"]
    }

    # 常用 PPT 结构
    PPT_STRUCTURES = {
        "title_slide": ["封面", "标题页", "标题"],
        "outline": ["目录", "大纲", "概览"],
        "content": ["内容", "正文", "详情"],
        "chart": ["图表", "数据", "统计", "分析"],
        "image": ["图片", "图片页", "配图"],
        "quote": ["引用", "名言", "语录"],
        "summary": ["总结", "回顾", "要点"],
        "thank_you": ["感谢", "致谢", "再见", "结束页"]
    }

    @classmethod
    def optimize_for_ppt(
        cls,
        user_request: str,
        scene: Optional[str] = None,
        slide_count: int = 10,
        style: str = "professional"
    ) -> str:
        """
        优化提示词以适配 PPT 生成场景

        Args:
            user_request: 用户原始需求
            scene: 场景类型 (business/education/marketing/technology/personal)
            slide_count: 期望的幻灯片数量
            style: 风格

        Returns:
            优化后的提示词
        """
        # 检测场景
        if not scene:
            scene = cls._detect_scene(user_request)

        # 构建优化提示词
        optimized = f"""你是一位专业的 PPT 内容策划专家。请根据以下需求，生成适合 PPT 展示的详细内容。

## 原始需求
{user_request}

## 场景类型
{scene}

## 幻灯片数量
约 {slide_count} 页

## 风格要求
{style}

## 重要输出要求 - 详细内容生成
1. **每一页内容必须详细丰富**：每个要点至少 50-100 字，包含具体解释、案例或数据
2. **禁止生成空洞内容**：不要只列出 2-3 个字的简短要点，如"人工智能"、"机器学习"等
3. **内容结构**：每个要点应该包含：
   - 核心概念解释
   - 实际应用场景或案例
   - 具体数据或效果描述
4. **内容页模板**（至少 5-8 个要点）：
   - 要点名称（标题）
   - 详细解释（50-100 字）
   - 适用场景或案例
   - 预期效果或数据支持
5. **图表页**：需要包含具体的数据占位符和图表类型建议

## 推荐幻灯片结构（{slide_count} 页）
- 第1页：封面页（标题、副标题、演讲者信息）
- 第2页：目录/大纲页
- 第3-8页：内容页（核心内容，每个要点详细展开）
- 第9页：图表/数据页
- 第10页：总结与展望
- 第11页：结束页/致谢

请按以下 JSON 格式输出，确保每个 content 数组中的每个元素都是完整的句子或段落（不是简短词语）：
```json
{{
  "slides": [
    {{
      "type": "title_slide/outline/content/chart/summary/thank_you",
      "title": "页面主标题",
      "content": [
        "详细要点1：包含具体解释、案例或数据的完整句子，至少50字...",
        "详细要点2：包含具体解释、案例或数据的完整句子，至少50字...",
        "详细要点3：包含具体解释、案例或数据的完整句子，至少50字...",
        "详细要点4：包含具体解释、案例或数据的完整句子，至少50字...",
        "详细要点5：包含具体解释、案例或数据的完整句子，至少50字..."
      ],
      "notes": "演讲备注（可选）"
    }}
  ]
}}
```

请确保输出的内容充实、有价值，避免空洞简短的回答。"""
        return optimized

    @classmethod
    def _detect_scene(cls, text: str) -> str:
        """检测场景类型"""
        text_lower = text.lower()

        for scene, keywords in cls.PPT_SCENE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return scene

        return "business"  # 默认商业场景

    @classmethod
    def optimize_svg_prompt(
        cls,
        content: str,
        slide_type: str = "content",
        aspect_ratio: str = "16:9"
    ) -> str:
        """
        优化 SVG 渲染提示词 (基于 mcp-server-okppt 的 PPT 页面 SVG 设计框架)

        Args:
            content: 页面内容
            slide_type: 页面类型
            aspect_ratio: 宽高比

        Returns:
            优化后的 SVG 提示词
        """
        width, height = cls._parse_aspect_ratio(aspect_ratio)

        prompt = f"""# PPT页面SVG设计宗师

## 设计规范
- 比例规范: 严格遵循16:9 SVG viewBox="0 0 1600 900"
- 安全边际: 核心内容必须完整落于 100, 50, 1400, 800 安全区内
- 矢量原生: 仅使用SVG原生元素，零依赖外部字体/图片

## 配色建议
- 专业商务: 主色 #2C3E50，辅色 #3498DB，点缀色 #E74C3C
- 背景色: #FFFFFF 或渐变

## 字体规范
- 标题: 48-72px
- 正文: 24-32px
- 注释: 16-18px
- 使用系统字体: Microsoft YaHei, Arial, sans-serif

## 页面类型: {slide_type}

页面内容:
{content}

请直接输出完整的 SVG 代码，不要包含任何解释或markdown标记。"""

        return prompt

    @classmethod
    def _parse_aspect_ratio(cls, ratio: str) -> tuple:
        """解析宽高比"""
        if ratio == "16:9":
            return 1600, 900
        elif ratio == "4:3":
            return 1024, 768
        elif ratio == "21:9":
            return 1920, 817
        else:
            return 1600, 900


# 全局客户端实例
_default_client: Optional[VolcanoClient] = None


def get_volcano_client() -> VolcanoClient:
    """获取全局火山云客户端"""
    global _default_client
    if _default_client is None:
        _default_client = VolcanoClient()
    return _default_client


def generate_text(prompt: str, **kwargs) -> Dict[str, Any]:
    """快捷文本生成函数"""
    return get_volcano_client().generate_text(prompt, **kwargs)


def generate_image(prompt: str, **kwargs) -> Dict[str, Any]:
    """快捷图片生成函数"""
    return get_volcano_client().generate_image(prompt, **kwargs)


def optimize_prompt(request: str, **kwargs) -> str:
    """快捷提示词优化函数"""
    return PromptOptimizer.optimize_for_ppt(request, **kwargs)
