# -*- coding: utf-8 -*-
"""
AI 分析层模块

负责：
1. 需求理解与解析
2. 任务分解
3. 内容生成服务集成
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

from volc_okppt_tools import (
    VolcanoClient,
    PromptOptimizer,
    get_volcano_client,
    VolcanoAPIError
)


class SceneType(Enum):
    """场景类型"""
    BUSINESS = "business"
    EDUCATION = "education"
    MARKETING = "marketing"
    TECHNOLOGY = "technology"
    PERSONAL = "personal"


class StyleType(Enum):
    """风格类型"""
    PROFESSIONAL = "professional"
    CREATIVE = "creative"
    MINIMAL = "minimal"
    TECH = "tech"
    ELEGANT = "elegant"


@dataclass
class RequirementAnalysis:
    """需求分析结果"""
    original_request: str
    scene: SceneType
    style: StyleType
    slide_count: int
    title: str
    description: str
    target_audience: str
    key_points: List[str]
    structure: List[Dict[str, Any]]


@dataclass
class SlideTask:
    """单页幻灯片任务"""
    index: int
    slide_type: str
    title: str
    content: List[str]
    notes: Optional[str] = None
    image_prompt: Optional[str] = None


class AIAnalyzer:
    """
    AI 分析器
    
    负责理解用户需求、分解任务
    """

    def __init__(self, client: Optional[VolcanoClient] = None):
        self.client = client or get_volcano_client()

    def analyze(self, user_request: str, options: Optional[Dict] = None) -> RequirementAnalysis:
        """
        分析用户需求
        
        Args:
            user_request: 用户原始需求
            options: 选项 (scene, style, slide_count 等)
            
        Returns:
            需求分析结果
        """
        options = options or {}
        
        # 提取选项
        scene = options.get("scene", "business")
        style = options.get("style", "professional")
        slide_count = options.get("slide_count", 10)
        
        # 使用 LLM 进行深度分析
        analysis_prompt = self._build_analysis_prompt(user_request, options)
        
        try:
            result = self.client.generate_text(
                prompt=analysis_prompt,
                system_prompt="你是一位专业的需求分析专家，擅长理解用户的PPT需求并生成结构化的需求分析报告。",
                temperature=0.7,
                max_tokens=4000
            )
            
            # 解析结果
            analysis = self._parse_analysis_result(
                result.get("content", ""),
                user_request,
                scene,
                style,
                slide_count
            )
            
            return analysis
            
        except VolcanoAPIError as e:
            # 如果 API 调用失败，返回默认分析
            return self._create_default_analysis(user_request, scene, style, slide_count)

    def _build_analysis_prompt(self, user_request: str, options: Dict) -> str:
        """构建需求分析提示词"""
        slide_count = options.get("slide_count", 10)
        
        prompt = f"""请分析以下PPT需求，提取关键信息：

## 用户需求
{user_request}

## 幻灯片数量
{slide_count} 页

## 分析要求
请从以下维度进行分析：

1. **标题 (title)**: 提炼一个简洁有力的PPT标题
2. **描述 (description)**: 一句话描述PPT的核心内容
3. **目标受众 (target_audience)**: PPT的目标观众是谁
4. **关键要点 (key_points)**: 3-5个核心要点

请按以下JSON格式输出：
```json
{{
  "title": "PPT标题",
  "description": "一句话描述",
  "target_audience": "目标受众",
  "key_points": ["要点1", "要点2", "要点3", "要点4", "要点5"]
}}
```"""
        return prompt

    def _parse_analysis_result(
        self,
        content: str,
        original_request: str,
        scene: str,
        style: str,
        slide_count: int
    ) -> RequirementAnalysis:
        """解析分析结果"""
        import json
        
        # 尝试提取 JSON
        json_match = None
        in_json = False
        for line in content.split("\n"):
            if "```json" in line or "```" in line:
                if in_json:
                    break
                in_json = True
                json_match = []
                continue
            if in_json and json_match is not None:
                json_match.append(line)
        
        if json_match:
            try:
                data = json.loads("\n".join(json_match))
                return RequirementAnalysis(
                    original_request=original_request,
                    scene=SceneType(scene),
                    style=StyleType(style),
                    slide_count=slide_count,
                    title=data.get("title", original_request[:30]),
                    description=data.get("description", original_request),
                    target_audience=data.get("target_audience", "通用"),
                    key_points=data.get("key_points", []),
                    structure=[]
                )
            except json.JSONDecodeError:
                pass
        
        # 返回默认分析
        return self._create_default_analysis(original_request, scene, style, slide_count)

    def _create_default_analysis(
        self,
        user_request: str,
        scene: str,
        style: str,
        slide_count: int
    ) -> RequirementAnalysis:
        """创建默认分析"""
        return RequirementAnalysis(
            original_request=user_request,
            scene=SceneType(scene),
            style=StyleType(style),
            slide_count=slide_count,
            title=user_request[:30] if len(user_request) > 30 else user_request,
            description=user_request,
            target_audience="通用",
            key_points=[],
            structure=[]
        )


class ContentGenerator:
    """
    内容生成器
    
    负责为每个幻灯片页面生成详细内容
    """
    
    def __init__(self, client: Optional[VolcanoClient] = None):
        self.client = client or get_volcano_client()
    
    def generate_slide_content(
        self,
        slide_task: SlideTask,
        scene: str = "business",
        style: str = "professional"
    ) -> SlideTask:
        """
        为单个幻灯片生成详细内容
        
        Args:
            slide_task: 幻灯片任务
            scene: 场景类型
            style: 风格
            
        Returns:
            更新后的幻灯片任务
        """
        # 构建提示词
        prompt = self._build_content_prompt(slide_task, scene, style)
        
        try:
            result = self.client.generate_text(
                prompt=prompt,
                system_prompt=self._get_system_prompt(scene),
                temperature=0.7,
                max_tokens=4000
            )
            
            # 解析内容
            content = result.get("content", "")
            parsed_content = self._parse_content(content, slide_task.slide_type)
            
            slide_task.content = parsed_content
            
            # 如果需要图片，生成图片提示词
            if slide_task.slide_type in ["image", "chart"]:
                slide_task.image_prompt = self._generate_image_prompt(
                    slide_task.title, 
                    parsed_content
                )
            
            return slide_task
            
        except VolcanoAPIError as e:
            print(f"[ERROR] 内容生成失败: {e}")
            return slide_task

    def generate_all_slides(
        self,
        analysis: RequirementAnalysis,
        slide_count: int
    ) -> List[SlideTask]:
        """
        生成所有幻灯片的内容结构
        
        Args:
            analysis: 需求分析结果
            slide_count: 幻灯片数量
            
        Returns:
            幻灯片任务列表
        """
        # 使用 PromptOptimizer 生成结构
        optimized_prompt = PromptOptimizer.optimize_for_ppt(
            analysis.original_request,
            scene=analysis.scene.value,
            slide_count=slide_count,
            style=analysis.style.value
        )
        
        try:
            result = self.client.generate_text(
                prompt=optimized_prompt,
                system_prompt=self._get_system_prompt(analysis.scene.value),
                temperature=0.7,
                max_tokens=16000
            )
            
            # 解析幻灯片结构
            slides = self._parse_slides_structure(
                result.get("content", ""),
                slide_count
            )
            
            return slides
            
        except VolcanoAPIError as e:
            print(f"[ERROR] 生成幻灯片结构失败: {e}")
            return self._create_default_slides(slide_count, analysis.title)

    def _build_content_prompt(self, slide_task: SlideTask, scene: str, style: str) -> str:
        """构建内容生成提示词"""
        slide_type = slide_task.slide_type
        
        templates = {
            "title_slide": f"""生成封面页内容。

标题: {slide_task.title}
场景: {scene}
风格: {style}

请生成:
1. 主标题 (简洁有力)
2. 副标题 (补充说明)
3. 演讲者信息""",

            "outline": f"""生成目录页内容。

标题: {slide_task.title}
场景: {scene}
风格: {style}

请生成 5-8 个章节标题""",

            "content": f"""生成内容页内容。

标题: {slide_task.title}
场景: {scene}
风格: {style}

请生成 5-8 个详细要点，每个要点至少 50 字，包含解释和案例。""",

            "chart": f"""生成图表页内容。

标题: {slide_task.title}
场景: {scene}
风格: {style}

请生成:
1. 图表标题
2. 数据说明
3. 分析要点""",

            "image": f"""生成图片展示页内容。

标题: {slide_task.title}
场景: {scene}
风格: {style}

请生成:
1. 图片描述
2. 说明文字
3. 相关要点""",

            "summary": f"""生成总结页内容。

标题: {slide_task.title}
场景: {scene}
风格: {style}

请生成:
1. 核心观点回顾 (3-5 点)
2. 行动建议
3. 结束语""",

            "thank_you": f"""生成结束页内容。

标题: {slide_task.title}
场景: {scene}
风格: {style}

请生成感谢语和联系方式。"""
        }
        
        return templates.get(slide_type, templates["content"])

    def _get_system_prompt(self, scene: str) -> str:
        """获取场景系统提示词"""
        prompts = {
            "business": "你是一位资深商业演示专家，擅长生成专业、清晰、有说服力的商业 PPT 内容。",
            "education": "你是一位教育专家，擅长生成清晰、易懂、有教学价值的课件内容。",
            "marketing": "你是一位营销专家，擅长生成有创意、吸引人的营销演示内容。",
            "technology": "你是一位技术专家，擅长生成专业、严谨的技术演示内容。",
            "personal": "你是一位个人品牌专家，擅长生成有个人特色的展示内容。"
        }
        return prompts.get(scene, prompts["business"])

    def _parse_content(self, content: str, slide_type: str) -> List[str]:
        """解析生成的内容"""
        lines = [line.strip() for line in content.split("\n") if line.strip()]
        
        # 过滤掉太短的行
        content_lines = [line for line in lines if len(line) > 20]
        
        if not content_lines:
            return ["内容待生成"]
        
        return content_lines[:8]  # 最多 8 个要点

    def _parse_slides_structure(self, content: str, slide_count: int) -> List[SlideTask]:
        """解析幻灯片结构"""
        import json
        
        # 尝试提取 JSON
        json_match = None
        in_json = False
        for line in content.split("\n"):
            if "```json" in line or "```" in line:
                if in_json:
                    break
                in_json = True
                json_match = []
                continue
            if in_json and json_match is not None:
                json_match.append(line)
        
        if json_match:
            try:
                data = json.loads("\n".join(json_match))
                slides_data = data.get("slides", [])
                
                slides = []
                for i, slide_data in enumerate(slides_data):
                    slide = SlideTask(
                        index=i,
                        slide_type=slide_data.get("type", "content"),
                        title=slide_data.get("title", f"第{i+1}页"),
                        content=slide_data.get("content", []),
                        notes=slide_data.get("notes")
                    )
                    slides.append(slide)
                
                return slides
                
            except json.JSONDecodeError:
                pass
        
        # 返回默认结构
        return self._create_default_slides(slide_count, "演示文稿")

    def _create_default_slides(self, slide_count: int, title: str) -> List[SlideTask]:
        """创建默认幻灯片结构"""
        slides = []
        
        # 封面
        slides.append(SlideTask(
            index=0,
            slide_type="title_slide",
            title=title,
            content=[]
        ))
        
        # 目录
        slides.append(SlideTask(
            index=1,
            slide_type="outline",
            title="目录",
            content=["第一章", "第二章", "第三章", "第四章", "第五章"]
        ))
        
        # 内容页
        for i in range(slide_count - 3):
            slides.append(SlideTask(
                index=i + 2,
                slide_type="content",
                title=f"第{i+1}章",
                content=[]
            ))
        
        # 总结页
        slides.append(SlideTask(
            index=slide_count - 1,
            slide_type="summary",
            title="总结",
            content=[]
        ))
        
        return slides

    def _generate_image_prompt(self, title: str, content: List[str]) -> str:
        """生成图片提示词"""
        content_text = " ".join(content[:3])
        return f"{title}: {content_text}"


# 工厂函数
def create_analyzer() -> AIAnalyzer:
    """创建 AI 分析器"""
    return AIAnalyzer()


def create_content_generator() -> ContentGenerator:
    """创建内容生成器"""
    return ContentGenerator()
