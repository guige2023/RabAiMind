"""
AI分析服务
需求理解、任务分解、内容规划
"""
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

logger = logging.getLogger(__name__)


@dataclass
class Task:
    """任务单元"""
    id: str
    title: str
    description: str
    status: str = "pending"  # pending, processing, completed, failed
    progress: int = 0
    result: Optional[Any] = None
    error: Optional[str] = None


@dataclass
class AnalysisResult:
    """需求分析结果"""
    original_requirement: str
    understood_requirement: str
    target_audience: str
    style: str
    tone: str
    key_points: List[str] = field(default_factory=list)
    slides_structure: List[Dict[str, str]] = field(default_factory=list)
    suggested_images: List[str] = field(default_factory=list)
    tasks: List[Task] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class PromptTemplate:
    """Prompt模板"""
    
    REQUIREMENT_ANALYSIS = """你是一个专业的PPT内容策划专家。请分析用户的需求，并生成结构化的PPT大纲。

用户需求：{requirement}

请按以下JSON格式返回分析结果：
{{
    "understood_requirement": "用一句话概括用户想要的PPT主题",
    "target_audience": "目标受众是谁",
    "style": "建议的PPT风格（如：商务简约、创意活泼、学术严谨等）",
    "tone": "语气（如：专业、亲和、幽默等）",
    "key_points": ["核心要点1", "核心要点2", "核心要点3"],
    "slides_structure": [
        {{"title": "幻灯片标题", "content": "主要内容", "type": "cover/text/image/chart"}},
        ...
    ],
    "suggested_images": ["需要的图片描述1", "需要的图片描述2"]
}}

请只返回JSON，不要其他内容。"""

    CONTENT_GENERATION = """你是一个专业的PPT内容撰写专家。根据以下大纲，为每页幻灯片生成详细内容。

PPT主题：{topic}
风格：{style}
目标受众：{audience}

幻灯片大纲：
{outline}

请为每个幻灯片生成：
1. 标题
2. 正文内容（简洁有力）
3. 关键数据或要点（如果有）
4. 配图建议

请按以下JSON格式返回：
{{
    "slides": [
        {{
            "slide_number": 1,
            "title": "标题",
            "content": "正文内容",
            "bullet_points": ["要点1", "要点2"],
            "image_suggestion": "配图建议"
        }},
        ...
    ]
}}

请只返回JSON。"""

    IMAGE_PROMPT = """你是一个AI绘画提示词专家。请根据以下内容生成详细的图片提示词。

幻灯片内容：{content}
风格：{style}

请生成适合AI绘画的英文提示词，要求：
1. 详细描述画面内容
2. 包含艺术风格
3. 适合AI图像生成

请直接返回提示词，不要其他内容。"""


class AIAnalyzer:
    """AI分析器"""
    
    def __init__(self, volc_api=None):
        self.volc_api = volc_api
        self.task_counter = 0
        
    def analyze_requirement(self, requirement: str) -> AnalysisResult:
        """
        分析用户需求
        
        Args:
            requirement: 用户输入的需求
            
        Returns:
            分析结果
        """
        from .volc_api import get_volc_api
        
        api = self.volc_api or get_volc_api()
        
        # 调用API分析需求
        prompt = PromptTemplate.REQUIREMENT_ANALYSIS.format(requirement=requirement)
        response = api.text_generation(prompt=prompt)
        
        if response.get("success"):
            content = response.get("content", "")
            # 解析JSON
            try:
                # 尝试提取JSON
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                    
                data = json.loads(content.strip())
                
                # 生成任务列表
                tasks = self._generate_tasks(data, requirement)
                
                return AnalysisResult(
                    original_requirement=requirement,
                    understood_requirement=data.get("understood_requirement", ""),
                    target_audience=data.get("target_audience", ""),
                    style=data.get("style", "商务简约"),
                    tone=data.get("tone", "专业"),
                    key_points=data.get("key_points", []),
                    slides_structure=data.get("slides_structure", []),
                    suggested_images=data.get("suggested_images", []),
                    tasks=tasks,
                    metadata={
                        "analysis_time": datetime.now().isoformat(),
                        "model": response.get("model", "unknown")
                    }
                )
            except json.JSONDecodeError as e:
                logger.warning(f"JSON解析失败: {type(e).__name__}")
                return self._create_default_result(requirement, "JSON解析失败")
        else:
            # error已由volc_api脱敏，直接使用
            error_msg = response.get("error", "API调用失败")
            return self._create_default_result(requirement, error_msg)
    
    def generate_content(self, topic: str, outline: List[Dict], style: str, audience: str) -> Dict[str, Any]:
        """
        生成PPT内容
        
        Args:
            topic: PPT主题
            outline: 大纲
            style: 风格
            audience: 目标受众
            
        Returns:
            生成的内容
        """
        from .volc_api import get_volc_api
        
        api = self.volc_api or get_volc_api()
        
        outline_str = json.dumps(outline, ensure_ascii=False, indent=2)
        prompt = PromptTemplate.CONTENT_GENERATION.format(
            topic=topic,
            style=style,
            audience=audience,
            outline=outline_str
        )
        
        response = api.text_generation(prompt=prompt)
        
        if response.get("success"):
            content = response.get("content", "")
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                    
                return {
                    "success": True,
                    "slides": json.loads(content.strip()).get("slides", []),
                    "model": response.get("model", "unknown")
                }
            except json.JSONDecodeError:
                return {"success": False, "error": "内容解析失败"}
        else:
            return {"success": False, "error": response.get("error", "API调用失败")}
    
    def generate_image_prompt(self, content: str, style: str) -> str:
        """
        生成图片提示词
        
        Args:
            content: 幻灯片内容
            style: 风格
            
        Returns:
            英文提示词
        """
        from .volc_api import get_volc_api
        
        api = self.volc_api or get_volc_api()
        
        prompt = PromptTemplate.IMAGE_PROMPT.format(
            content=content,
            style=style
        )
        
        response = api.text_generation(prompt=prompt, max_tokens=512)
        
        if response.get("success"):
            return response.get("content", "").strip()
        return ""
    
    def _generate_tasks(self, analysis_data: Dict, requirement: str) -> List[Task]:
        """根据分析结果生成任务列表"""
        tasks = []
        self.task_counter += 1
        
        slides = analysis_data.get("slides_structure", [])
        
        # 任务1: 内容生成
        tasks.append(Task(
            id=f"task_{self.task_counter}_content",
            title="生成PPT内容",
            description="根据分析结果生成每页幻灯片的详细内容",
            status="pending"
        ))
        
        # 任务2: 图片生成（如果需要）
        if analysis_data.get("suggested_images"):
            self.task_counter += 1
            tasks.append(Task(
                id=f"task_{self.task_counter}_images",
                title="生成配图",
                description="为幻灯片生成AI配图",
                status="pending"
            ))
        
        # 任务3: PPT组装
        self.task_counter += 1
        tasks.append(Task(
            id=f"task_{self.task_counter}_assembly",
            title="组装PPT",
            description="将内容和图片组装成完整的PPT",
            status="pending"
        ))
        
        return tasks
    
    def _create_default_result(self, requirement: str, error: str) -> AnalysisResult:
        """创建默认结果（当API调用失败时）"""
        return AnalysisResult(
            original_requirement=requirement,
            understood_requirement=requirement,
            target_audience="通用",
            style="商务简约",
            tone="专业",
            key_points=[requirement],
            slides_structure=[
                {"title": "封面", "content": requirement, "type": "cover"},
                {"title": "内容", "content": requirement, "type": "text"}
            ],
            tasks=[],
            metadata={"error": error}
        )


# 全局实例
ai_analyzer = AIAnalyzer()


def get_ai_analyzer() -> AIAnalyzer:
    """获取AI分析器实例"""
    return ai_analyzer
