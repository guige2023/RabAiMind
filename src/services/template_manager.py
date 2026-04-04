"""
模板系统
PPT模板管理和选择
"""
import os
import json
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

USER_TEMPLATES_FILE = Path("data/user_templates.json")


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
    applicable_scenes: List[str]  # 适用场景
    example: str  # 示例描述
    is_ugc: bool = False
    author: str = "system"
    visibility: str = "public"
    created_at: str = ""


class TemplateManager:
    """模板管理器"""

    def __init__(self):
        self.template_dir = Path(__file__).parent.parent / "templates"
        self._templates = self._load_templates()
        self._load_user_templates()

    def _load_user_templates(self):
        """加载用户模板"""
        if USER_TEMPLATES_FILE.exists():
            with open(USER_TEMPLATES_FILE, encoding="utf-8") as f:
                self.user_templates: List[dict] = json.load(f)
        else:
            self.user_templates = []

    def _save_user_templates(self):
        USER_TEMPLATES_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(USER_TEMPLATES_FILE, "w", encoding="utf-8") as f:
            json.dump(self.user_templates, f, indent=2, ensure_ascii=False)

    def add_user_template(self, template: dict):
        self.user_templates.append(template)
        self._save_user_templates()

    def remove_user_template(self, template_id: str):
        self.user_templates = [t for t in self.user_templates if t["id"] != template_id]
        self._save_user_templates()

    def rename_user_template(self, template_id: str, new_name: str):
        for t in self.user_templates:
            if t["id"] == template_id:
                t["name"] = new_name
                self._save_user_templates()
                return True
        return False

    def get_user_templates(self, user_id: str = "current_user") -> list:
        return [t for t in self.user_templates if t.get("author") == user_id or t.get("visibility") == "public"]

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
            },
            applicable_scenes=["商务汇报", "项目展示", "会议演讲"],
            example="适用于日常商务汇报"
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
            },
            applicable_scenes=["项目提案", "产品介绍", "个人展示"],
            example="适合现代感的产品发布和项目提案"
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
            },
            applicable_scenes=["技术分享", "AI演示", "科技大会"],
            example="适合科技公司技术分享和产品演示"
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
            },
            applicable_scenes=["政府汇报", "学术答辩", "正式会议"],
            example="适合正式场合的政务和学术汇报"
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
            },
            applicable_scenes=["创意提案", "品牌展示", "营销策划"],
            example="适合创意行业提案和品牌展示"
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
            },
            applicable_scenes=["教学课件", "培训演示", "学术报告"],
            example="适合学校教学和培训课件"
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
            query: 搜索关键词(匹配名称和描述)
            category: 可选,按分类筛选
            style: 可选,按风格筛选
            limit: 返回数量限制

        Returns:
            匹配的模板列表
        """
        result = list(self._templates.values())

        # 关键词搜索(不区分大小写)
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
