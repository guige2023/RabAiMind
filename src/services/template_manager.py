"""
模板系统
PPT模板管理和选择
"""
import os
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Template:
    """PPT模板"""
    id: str
    name: str
    description: str
    category: str  # business, education, creative, tech
    style: str  # professional, minimal, modern, classic
    thumbnail: str
    colors: List[str]  # 主题色
    fonts: List[str]  # 字体
    layout: Dict[str, Any]  # 布局配置


class TemplateManager:
    """模板管理器"""
    
    def __init__(self):
        self.template_dir = Path(__file__).parent.parent / "templates"
        self._templates = self._load_templates()
        
    def _load_templates(self) -> Dict[str, Template]:
        """加载模板"""
        templates = {}
        
        # 默认模板
        templates["default"] = Template(
            id="default",
            name="商务默认",
            description="通用商务风格模板",
            category="business",
            style="professional",
            thumbnail="/templates/default.png",
            colors=["#165DFF", "#0E42D2", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.8,
                "bullet_indent": 0.05
            }
        )
        
        templates["modern"] = Template(
            id="modern",
            name="现代简约",
            description="简约现代设计风格",
            category="business",
            style="minimal",
            thumbnail="/templates/modern.png",
            colors=["#1A1A1A", "#666666", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "left",
                "content_width": 0.75,
                "bullet_indent": 0.03
            }
        )
        
        templates["tech"] = Template(
            id="tech",
            name="科技风格",
            description="科技感风格模板",
            category="tech",
            style="modern",
            thumbnail="/templates/tech.png",
            colors=["#0066FF", "#00CCFF", "#001A33"],
            fonts=["思源黑体", "Roboto"],
            layout={
                "title_position": "left",
                "content_width": 0.7,
                "bullet_indent": 0.04
            }
        )
        
        templates["classic"] = Template(
            id="classic",
            name="经典商务",
            description="传统商务风格",
            category="business",
            style="classic",
            thumbnail="/templates/classic.png",
            colors=["#003366", "#006699", "#FFFFFF"],
            fonts=["宋体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.85,
                "bullet_indent": 0.06
            }
        )
        
        templates["creative"] = Template(
            id="creative",
            name="创意风格",
            description="创意展示风格",
            category="creative",
            style="creative",
            thumbnail="/templates/creative.png",
            colors=["#FF6B6B", "#FFB347", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.75,
                "bullet_indent": 0.03
            }
        )
        
        templates["education"] = Template(
            id="education",
            name="教育风格",
            description="教学课件风格",
            category="education",
            style="clean",
            thumbnail="/templates/education.png",
            colors=["#4CAF50", "#8BC34A", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "left",
                "content_width": 0.8,
                "bullet_indent": 0.04
            }
        )
        
        return templates
    
    def get_template(self, template_id: str) -> Optional[Template]:
        """获取模板"""
        return self._templates.get(template_id)
    
    def list_templates(
        self,
        category: Optional[str] = None,
        style: Optional[str] = None
    ) -> List[Template]:
        """列出模板"""
        result = list(self._templates.values())

        if category:
            result = [t for t in result if t.category == category]

        if style:
            result = [t for t in result if t.style == style]

        return result

    def search_templates(
        self,
        query: str = "",
        category: Optional[str] = None,
        style: Optional[str] = None,
        limit: int = 20
    ) -> List[Template]:
        """搜索模板

        Args:
            query: 搜索关键词（匹配名称和描述）
            category: 可选，按分类筛选
            style: 可选，按风格筛选
            limit: 返回数量限制

        Returns:
            匹配的模板列表
        """
        result = list(self._templates.values())

        # 关键词搜索（不区分大小写）
        if query:
            query_lower = query.lower()
            result = [
                t for t in result
                if query_lower in t.name.lower() or query_lower in t.description.lower()
            ]

        # 分类筛选
        if category:
            result = [t for t in result if t.category == category]

        # 风格筛选
        if style:
            result = [t for t in result if t.style == style]

        # 限制返回数量
        return result[:limit]

    def get_categories(self) -> List[str]:
        """获取所有分类"""
        return list(set(t.category for t in self._templates.values()))
    
    def get_styles(self) -> List[str]:
        """获取所有风格"""
        return list(set(t.style for t in self._templates.values()))
    
    def create_template(self, template: Template) -> bool:
        """创建模板"""
        if template.id in self._templates:
            return False
        self._templates[template.id] = template
        return True
    
    def update_template(self, template: Template) -> bool:
        """更新模板"""
        if template.id not in self._templates:
            return False
        self._templates[template.id] = template
        return True
    
    def delete_template(self, template_id: str) -> bool:
        """删除模板"""
        if template_id not in self._templates:
            return False
        if template_id == "default":
            return False  # 不能删除默认模板
        del self._templates[template_id]
        return True


# 全局实例
template_manager = TemplateManager()


def get_template_manager() -> TemplateManager:
    """获取模板管理器"""
    return template_manager
