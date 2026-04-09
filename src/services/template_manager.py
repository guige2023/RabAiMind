"""
模板系统
PPT模板管理和选择
"""
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

USER_TEMPLATES_FILE = Path("data/user_templates.json")
DOWNLOAD_COUNTS_FILE = Path("data/template_download_counts.json")


@dataclass
class RatingBreakdown:
    """评分细分（设计/易用性/功能）"""
    design: float = 0.0  # 设计评分 1-5
    usability: float = 0.0  # 易用性评分 1-5
    features: float = 0.0  # 功能评分 1-5
    total: float = 0.0  # 综合评分 1-5
    count: int = 0  # 评分人数


@dataclass
class Template:
    """PPT模板"""
    id: str
    name: str
    description: str
    category: str  # business, education, creative, tech
    style: str  # professional, minimal, modern, classic
    thumbnail: str
    colors: list[str]  # 主题色
    fonts: list[str]  # 字体
    layout: dict[str, Any]  # 布局配置
    applicable_scenes: list[str]  # 适用场景
    example: str  # 示例描述
    # R128: 新增字段
    subcategory: str = ""  # 子分类，如 "季度报告", "会议议程"
    download_count: int = 0  # 下载次数
    rating_breakdown: RatingBreakdown | None = None  # 评分细分
    is_ugc: bool = False
    author: str = "system"
    visibility: str = "public"
    created_at: str = ""
    tags: list[str] = None  # 标签列表，如 ["免费", "热门", "新品"]
    use_count: int = 0  # 使用次数（生成PPT次数）

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        # Auto-generate tags based on category, style, and properties
        if not self.tags:
            auto_tags = []
            # Category-based tags
            category_tag_map = {
                "business": ["商务"],
                "education": ["教育"],
                "tech": ["科技"],
                "creative": ["创意"],
                "personal": ["个人"],
                "government": ["政府"],
                "finance": ["金融"],
                "marketing": ["营销"],
                "medical": ["医疗"],
            }
            if self.category in category_tag_map:
                auto_tags.extend(category_tag_map[self.category])
            # Style-based tags
            style_tag_map = {
                "professional": ["商务"],
                "minimal": ["简约"],
                "modern": ["现代"],
                "classic": ["经典"],
                "creative": ["创意"],
                "elegant": ["优雅"],
                "energetic": ["活力"],
            }
            if self.style in style_tag_map:
                auto_tags.extend(style_tag_map[self.style])
            # Popularity-based tag
            if self.download_count > 1500:
                auto_tags.append("热门")
            # UGC tag
            if self.is_ugc:
                auto_tags.append("用户上传")
            # Remove duplicates
            self.tags = list(set(auto_tags))

    def to_dict(self) -> dict:
        """转换为字典，包含新增字段"""
        d = asdict(self)
        if self.rating_breakdown:
            d["rating_breakdown"] = asdict(self.rating_breakdown)
        return d


# ─── 分类+子分类定义 ────────────────────────────────────────────────────────
CATEGORY_SUBCATEGORIES: dict[str, list[str]] = {
    "business": ["年度总结", "季度报告", "项目提案", "公司介绍", "投资路演", "会议议程", "销售提案", "市场分析", "团队建设", "商务谈判"],
    "education": ["培训课件", "学术答辩", "教学教案", "校园活动", "毕业典礼", "课程介绍", "考试复习", "学术报告"],
    "tech": ["产品发布", "技术分享", "AI演示", "科技大会", "互联网峰会", "产品介绍", "技术文档", "开发者大会"],
    "creative": ["创意展示", "品牌设计", "营销提案", "活动策划", "艺术展示", "个人简历", "作品集", "创意写作"],
    "personal": ["生日派对", "婚礼请柬", "旅行分享", "美食记录", "家庭相册", "纪念日", "个人日记"],
    "government": ["政府汇报", "党建工作", "政务公开", "政策解读", "会议报告", "规划展示"],
    "finance": ["财务报告", "投资分析", "市场研究", "商业计划", "审计汇报", "预算方案", "基金路演"],
    "marketing": ["品牌推广", "产品促销", "广告创意", "社交媒体", "内容营销", "活动宣传", "媒体投放"],
    "medical": ["医疗汇报", "健康讲座", "药品介绍", "医院展示", "医学研究", "健康科普"],
}


def _load_download_counts() -> dict[str, int]:
    """加载下载计数"""
    if DOWNLOAD_COUNTS_FILE.exists():
        with open(DOWNLOAD_COUNTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_download_counts(counts: dict[str, int]):
    """保存下载计数"""
    DOWNLOAD_COUNTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DOWNLOAD_COUNTS_FILE, "w", encoding="utf-8") as f:
        json.dump(counts, f, indent=2, ensure_ascii=False)


class TemplateManager:
    """模板管理器"""

    def __init__(self):
        self.template_dir = Path(__file__).parent.parent / "templates"
        self._download_counts = _load_download_counts()
        self._templates = self._load_templates()
        self._load_user_templates()

    def _load_user_templates(self):
        """加载用户模板"""
        if USER_TEMPLATES_FILE.exists():
            with open(USER_TEMPLATES_FILE, encoding="utf-8") as f:
                self.user_templates: list[dict] = json.load(f)
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

    def _load_templates(self) -> dict[str, Template]:
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
            example="适用于日常商务汇报",
            subcategory="年度总结",
            download_count=1247,
            rating_breakdown=RatingBreakdown(design=4.2, usability=4.5, features=4.0, total=4.2, count=312),
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
            example="适合现代感的产品发布和项目提案",
            subcategory="项目提案",
            download_count=892,
            rating_breakdown=RatingBreakdown(design=4.6, usability=4.8, features=4.3, total=4.6, count=198),
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
            example="适合科技发布会和技术分享",
            subcategory="技术分享",
            download_count=2103,
            rating_breakdown=RatingBreakdown(design=4.7, usability=4.4, features=4.9, total=4.7, count=456),
        )

        templates["creative"] = Template(
            id="creative",
            name="创意艺术",
            description="富有创意的艺术风格模板",
            category="creative",
            style="creative",
            thumbnail="/templates/creative.png",
            colors=["#FF6B6B", "#FFD93D", "#6BCB77"],
            fonts=["思源黑体", "艺术字体"],
            layout={
                "title_position": "center",
                "content_width": 0.65,
                "bullet_indent": 0.02
            },
            applicable_scenes=["艺术展示", "创意提案", "个人作品"],
            example="适合艺术展示和创意提案",
            subcategory="创意展示",
            download_count=756,
            rating_breakdown=RatingBreakdown(design=4.9, usability=4.3, features=4.5, total=4.6, count=167),
        )

        templates["education"] = Template(
            id="education",
            name="教育培训",
            description="教育培训专用模板",
            category="education",
            style="simple",
            thumbnail="/templates/education.png",
            colors=["#11998E", "#38EF7D", "#FFFFFF"],
            fonts=["思源黑体", "楷体"],
            layout={
                "title_position": "left",
                "content_width": 0.8,
                "bullet_indent": 0.05
            },
            applicable_scenes=["课程培训", "教学课件", "学术报告"],
            example="适合教育培训和学术报告",
            subcategory="培训课件",
            download_count=1567,
            rating_breakdown=RatingBreakdown(design=4.3, usability=4.7, features=4.4, total=4.5, count=389),
        )

        templates["government"] = Template(
            id="government",
            name="政务汇报",
            description="政务风格模板",
            category="government",
            style="professional",
            thumbnail="/templates/government.png",
            colors=["#003366", "#006699", "#FFFFFF"],
            fonts=["思源黑体", "楷体"],
            layout={
                "title_position": "center",
                "content_width": 0.85,
                "bullet_indent": 0.04
            },
            applicable_scenes=["政府汇报", "党建工作", "政务公开"],
            example="适合政务汇报和党建展示",
            subcategory="政府汇报",
            download_count=634,
            rating_breakdown=RatingBreakdown(design=4.0, usability=4.2, features=4.1, total=4.1, count=98),
        )

        templates["product"] = Template(
            id="product",
            name="产品发布",
            description="科技感十足的产品发布会模板",
            category="tech",
            style="modern",
            thumbnail="/templates/product.png",
            colors=["#0F2027", "#203A43", "#2C5364"],
            fonts=["思源黑体", "Roboto"],
            layout={
                "title_position": "center",
                "content_width": 0.7,
                "bullet_indent": 0.03
            },
            applicable_scenes=["产品发布", "新品展示", "科技大会"],
            example="适合新品发布会和科技展示",
            subcategory="产品发布",
            download_count=1834,
            rating_breakdown=RatingBreakdown(design=4.8, usability=4.5, features=4.9, total=4.7, count=521),
        )

        templates["annual"] = Template(
            id="annual",
            name="年度总结",
            description="清晰直观的年度工作总结模板",
            category="business",
            style="professional",
            thumbnail="/templates/annual.png",
            colors=["#1E3A5F", "#2D5A87", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.8,
                "bullet_indent": 0.05
            },
            applicable_scenes=["年度总结", "季度汇报", "工作汇报"],
            example="适合年度工作总结和汇报",
            subcategory="年度总结",
            download_count=2341,
            rating_breakdown=RatingBreakdown(design=4.4, usability=4.6, features=4.5, total=4.5, count=678),
        )

        templates["proposal"] = Template(
            id="proposal",
            name="项目提案",
            description="逻辑清晰的项目提案模板",
            category="business",
            style="professional",
            thumbnail="/templates/proposal.png",
            colors=["#667EEA", "#764BA2", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "left",
                "content_width": 0.75,
                "bullet_indent": 0.04
            },
            applicable_scenes=["项目提案", "项目立项", "资源申请"],
            example="适合项目立项和资源申请",
            subcategory="项目提案",
            download_count=987,
            rating_breakdown=RatingBreakdown(design=4.5, usability=4.7, features=4.6, total=4.6, count=245),
        )

        templates["meeting"] = Template(
            id="meeting",
            name="会议议程",
            description="清晰高效的会议议程模板",
            category="business",
            style="simple",
            thumbnail="/templates/meeting.png",
            colors=["#11998E", "#38EF7D", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "left",
                "content_width": 0.8,
                "bullet_indent": 0.05
            },
            applicable_scenes=["会议管理", "团队协作", "日程安排"],
            example="适合会议安排和行动项管理",
            subcategory="会议议程",
            download_count=1563,
            rating_breakdown=RatingBreakdown(design=4.3, usability=4.9, features=4.6, total=4.6, count=412),
        )

        templates["quarterly"] = Template(
            id="quarterly",
            name="季度报告",
            description="专业季度报告模板，支持数据自动填充",
            category="business",
            style="professional",
            thumbnail="/templates/quarterly.png",
            colors=["#0F2027", "#203A43", "#2C5364"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.8,
                "bullet_indent": 0.05
            },
            applicable_scenes=["季度总结", "财务汇报", "运营分析"],
            example="适合季度财务和运营数据汇报",
            subcategory="季度报告",
            download_count=1876,
            rating_breakdown=RatingBreakdown(design=4.5, usability=4.7, features=4.8, total=4.7, count=534),
        )

        templates["sales"] = Template(
            id="sales",
            name="销售提案",
            description="结构化销售提案模板，基于AIDA说服模型",
            category="marketing",
            style="energetic",
            thumbnail="/templates/sales.png",
            colors=["#FF6B6B", "#EE5A24", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.75,
                "bullet_indent": 0.04
            },
            applicable_scenes=["销售演示", "客户提案", "商务谈判"],
            example="适合销售演示和客户提案",
            subcategory="销售提案",
            download_count=1432,
            rating_breakdown=RatingBreakdown(design=4.6, usability=4.4, features=4.7, total=4.6, count=321),
        )

        templates["training"] = Template(
            id="training",
            name="培训手册",
            description="章节导航式培训手册模板",
            category="education",
            style="simple",
            thumbnail="/templates/training.png",
            colors=["#E0F7FA", "#B2EBF2", "#80DEEA"],
            fonts=["思源黑体", "楷体"],
            layout={
                "title_position": "left",
                "content_width": 0.8,
                "bullet_indent": 0.05
            },
            applicable_scenes=["企业培训", "教学课件", "课程设计"],
            example="适合企业内训和教学课件",
            subcategory="培训课件",
            download_count=1123,
            rating_breakdown=RatingBreakdown(design=4.4, usability=4.8, features=4.5, total=4.6, count=287),
        )

        templates["chinese"] = Template(
            id="chinese",
            name="中国风",
            description="典雅水墨风格的中国风模板",
            category="creative",
            style="elegant",
            thumbnail="/templates/chinese.png",
            colors=["#5D4037", "#8D6E63", "#D7CCC8"],
            fonts=["思源宋体", "楷体"],
            layout={
                "title_position": "center",
                "content_width": 0.7,
                "bullet_indent": 0.04
            },
            applicable_scenes=["传统文化", "水墨展示", "艺术分享"],
            example="适合中国传统文化展示",
            subcategory="艺术展示",
            download_count=678,
            rating_breakdown=RatingBreakdown(design=4.9, usability=4.2, features=4.3, total=4.5, count=156),
        )

        templates["data_report"] = Template(
            id="data_report",
            name="数据报告",
            description="专业数据分析报告模板",
            category="business",
            style="tech",
            thumbnail="/templates/data_report.png",
            colors=["#1E3C72", "#2A5298", "#FFFFFF"],
            fonts=["思源黑体", "Roboto"],
            layout={
                "title_position": "left",
                "content_width": 0.75,
                "bullet_indent": 0.04
            },
            applicable_scenes=["数据分析", "BI报告", "商业 intelligence"],
            example="适合数据分析和商业 intelligence",
            subcategory="市场分析",
            download_count=1654,
            rating_breakdown=RatingBreakdown(design=4.5, usability=4.6, features=4.8, total=4.6, count=423),
        )

        templates["team_intro"] = Template(
            id="team_intro",
            name="团队介绍",
            description="展示团队成员和企业文化的介绍模板",
            category="business",
            style="simple",
            thumbnail="/templates/team_intro.png",
            colors=["#667EEA", "#764BA2", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.8,
                "bullet_indent": 0.05
            },
            applicable_scenes=["团队展示", "企业文化", "人员介绍"],
            example="适合团队介绍和企业文化展示",
            subcategory="团队建设",
            download_count=876,
            rating_breakdown=RatingBreakdown(design=4.4, usability=4.7, features=4.3, total=4.5, count=234),
        )

        templates["ai_future"] = Template(
            id="ai_future",
            name="AI未来",
            description="充满未来感的AI主题模板",
            category="tech",
            style="tech",
            thumbnail="/templates/ai_future.png",
            colors=["#0F0C29", "#302B63", "#24243E"],
            fonts=["思源黑体", "Roboto"],
            layout={
                "title_position": "center",
                "content_width": 0.7,
                "bullet_indent": 0.03
            },
            applicable_scenes=["AI展示", "技术分享", "智能科技"],
            example="适合AI产品展示和技术分享",
            subcategory="AI演示",
            download_count=2543,
            rating_breakdown=RatingBreakdown(design=4.8, usability=4.5, features=4.9, total=4.7, count=612),
        )

        templates["wedding"] = Template(
            id="wedding",
            name="婚礼请柬",
            description="温馨浪漫的婚礼邀请函模板",
            category="personal",
            style="elegant",
            thumbnail="/templates/wedding.png",
            colors=["#FF9A9E", "#FECFEF", "#FFFFFF"],
            fonts=["思源宋体", "楷体"],
            layout={
                "title_position": "center",
                "content_width": 0.65,
                "bullet_indent": 0.02
            },
            applicable_scenes=["婚礼邀请", "喜宴请柬", "纪念日"],
            example="适合婚礼邀请函和纪念日",
            subcategory="纪念日",
            download_count=543,
            rating_breakdown=RatingBreakdown(design=4.9, usability=4.6, features=4.2, total=4.6, count=132),
        )

        templates["academic"] = Template(
            id="academic",
            name="学术答辩",
            description="严谨规范的学术论文答辩模板",
            category="education",
            style="simple",
            thumbnail="/templates/academic.png",
            colors=["#1E3A5F", "#2D5A87", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "center",
                "content_width": 0.8,
                "bullet_indent": 0.05
            },
            applicable_scenes=["学术答辩", "论文汇报", "毕业答辩"],
            example="适合学术论文答辩和毕业汇报",
            subcategory="学术答辩",
            download_count=1087,
            rating_breakdown=RatingBreakdown(design=4.2, usability=4.5, features=4.4, total=4.4, count=298),
        )

        templates["internet"] = Template(
            id="internet",
            name="互联网大会",
            description="高端大气的行业大会演讲模板",
            category="tech",
            style="premium",
            thumbnail="/templates/internet.png",
            colors=["#0F2027", "#203A43", "#2C5364"],
            fonts=["思源黑体", "Roboto"],
            layout={
                "title_position": "center",
                "content_width": 0.75,
                "bullet_indent": 0.04
            },
            applicable_scenes=["行业大会", "互联网峰会", "技术论坛"],
            example="适合大型行业会议和峰会",
            subcategory="科技大会",
            download_count=1765,
            rating_breakdown=RatingBreakdown(design=4.7, usability=4.4, features=4.6, total=4.6, count=389),
        )

        templates["finance_report"] = Template(
            id="finance_report",
            name="财务分析",
            description="专业的财务分析报告模板",
            category="finance",
            style="professional",
            thumbnail="/templates/finance_report.png",
            colors=["#1A1A2E", "#16213E", "#0F3460"],
            fonts=["思源黑体", "Arial"],
            layout={
                "title_position": "left",
                "content_width": 0.75,
                "bullet_indent": 0.04
            },
            applicable_scenes=["财务分析", "投资报告", "审计汇报"],
            example="适合财务分析和投资报告",
            subcategory="财务报告",
            download_count=1321,
            rating_breakdown=RatingBreakdown(design=4.4, usability=4.5, features=4.7, total=4.5, count=345),
        )

        # R86: Document generation templates
        templates["doc1"] = Template(
            id="doc1",
            name="季度报告",
            description="专业季度报告模板，支持从数据源自动填充财务/运营数据",
            category="business",
            style="professional",
            thumbnail="/templates/doc1.png",
            colors=["#0F2027", "#203A43", "#2C5364"],
            fonts=["思源黑体", "Arial"],
            layout={"title_position": "center", "content_width": 0.8, "bullet_indent": 0.05},
            applicable_scenes=["季度总结", "财务汇报"],
            example="适合季度财务和运营数据汇报",
            subcategory="季度报告",
            download_count=1876,
            rating_breakdown=RatingBreakdown(design=4.5, usability=4.7, features=4.8, total=4.7, count=534),
        )

        templates["doc2"] = Template(
            id="doc2",
            name="会议议程",
            description="清晰高效的会议议程模板，包含时间分配和行动项",
            category="business",
            style="simple",
            thumbnail="/templates/doc2.png",
            colors=["#11998E", "#38EF7D", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={"title_position": "left", "content_width": 0.8, "bullet_indent": 0.05},
            applicable_scenes=["会议管理", "团队协作"],
            example="适合会议安排和行动项管理",
            subcategory="会议议程",
            download_count=1563,
            rating_breakdown=RatingBreakdown(design=4.3, usability=4.9, features=4.6, total=4.6, count=412),
        )

        templates["doc3"] = Template(
            id="doc3",
            name="销售提案",
            description="结构化销售提案模板，基于AIDA说服模型设计",
            category="marketing",
            style="energetic",
            thumbnail="/templates/doc3.png",
            colors=["#FF6B6B", "#EE5A24", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={"title_position": "center", "content_width": 0.75, "bullet_indent": 0.04},
            applicable_scenes=["销售演示", "客户提案"],
            example="适合销售演示和客户提案",
            subcategory="销售提案",
            download_count=1432,
            rating_breakdown=RatingBreakdown(design=4.6, usability=4.4, features=4.7, total=4.6, count=321),
        )

        templates["doc4"] = Template(
            id="doc4",
            name="项目提案",
            description="完整项目提案模板，适合项目立项和资源申请",
            category="business",
            style="professional",
            thumbnail="/templates/doc4.png",
            colors=["#667EEA", "#764BA2", "#FFFFFF"],
            fonts=["思源黑体", "Arial"],
            layout={"title_position": "left", "content_width": 0.75, "bullet_indent": 0.04},
            applicable_scenes=["项目立项", "资源申请"],
            example="适合项目立项和资源申请",
            subcategory="项目提案",
            download_count=987,
            rating_breakdown=RatingBreakdown(design=4.5, usability=4.7, features=4.6, total=4.6, count=245),
        )

        templates["doc5"] = Template(
            id="doc5",
            name="培训手册",
            description="章节导航式培训手册模板，适合企业内训和教学课件",
            category="education",
            style="simple",
            thumbnail="/templates/doc5.png",
            colors=["#E0F7FA", "#B2EBF2", "#80DEEA"],
            fonts=["思源黑体", "楷体"],
            layout={"title_position": "left", "content_width": 0.8, "bullet_indent": 0.05},
            applicable_scenes=["企业培训", "教学课件"],
            example="适合企业内训和教学课件",
            subcategory="培训课件",
            download_count=1123,
            rating_breakdown=RatingBreakdown(design=4.4, usability=4.8, features=4.5, total=4.6, count=287),
        )

        # 为所有模板注入下载计数
        for tid in templates:
            templates[tid].download_count = self._download_counts.get(tid, templates[tid].download_count)

        return templates

    def get_template(self, template_id: str) -> Template | None:
        """获取模板"""
        return self._templates.get(template_id)

    def list_templates(
        self,
        category: str | None = None,
        style: str | None = None,
        subcategory: str | None = None,
    ) -> list[Template]:
        """列出模板"""
        result = list(self._templates.values())

        if category:
            result = [t for t in result if t.category == category]

        if style:
            result = [t for t in result if t.style == style]

        if subcategory:
            result = [t for t in result if t.subcategory == subcategory]

        return result

    def search_templates(
        self,
        query: str = "",
        category: str | None = None,
        style: str | None = None,
        subcategory: str | None = None,
        tags: list[str] | None = None,
        limit: int = 20
    ) -> list[Template]:
        """搜索模板，支持标签过滤"""
        result = list(self._templates.values())

        if query:
            query_lower = query.lower()
            result = [
                t for t in result
                if query_lower in t.name.lower() or query_lower in t.description.lower()
            ]

        if category:
            result = [t for t in result if t.category == category]

        if style:
            result = [t for t in result if t.style == style]

        if subcategory:
            result = [t for t in result if t.subcategory == subcategory]

        if tags:
            # Filter by tags (template must have ALL specified tags)
            result = [t for t in result if all(tag in t.tags for tag in tags)]

        return result[:limit]

    def get_all_tags(self) -> list[str]:
        """获取所有模板标签及其使用次数"""
        tag_counts: dict[str, int] = {}
        for t in self._templates.values():
            for tag in t.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        return sorted(tag_counts.keys())

    def get_categories(self) -> list[str]:
        """获取所有分类"""
        return list(set(t.category for t in self._templates.values()))

    def get_subcategories(self, category: str | None = None) -> dict[str, list[str]]:
        """获取子分类映射"""
        if category:
            return {category: CATEGORY_SUBCATEGORIES.get(category, [])}
        return CATEGORY_SUBCATEGORIES

    def get_styles(self) -> list[str]:
        """获取所有风格"""
        return list(set(t.style for t in self._templates.values()))

    def get_download_count(self, template_id: str) -> int:
        """获取下载次数"""
        return self._download_counts.get(template_id,
            self._templates.get(template_id, None) and self._templates[template_id].download_count or 0)

    def increment_download_count(self, template_id: str) -> int:
        """增加下载计数"""
        current = self.get_download_count(template_id)
        self._download_counts[template_id] = current + 1
        _save_download_counts(self._download_counts)
        return self._download_counts[template_id]

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
            return False
        del self._templates[template_id]
        return True


# 全局实例
template_manager = TemplateManager()


def get_template_manager() -> TemplateManager:
    """获取模板管理器"""
    return template_manager
