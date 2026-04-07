# -*- coding: utf-8 -*-
"""
数据模型定义

作者: Claude
日期: 2026-03-17
"""

import re
import logging
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, AliasChoices
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


# ==================== 验证器 ====================

HEX_COLOR_PATTERN = re.compile(r'^#[0-9A-Fa-f]{6}$')


def validate_hex_color(v: str, field_name: str) -> str:
    """验证hex颜色格式"""
    if not HEX_COLOR_PATTERN.match(v):
        raise ValueError(f'{field_name}必须是有效的hex颜色格式，如#FF5500')
    return v


# ==================== 枚举类型 ====================

class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SceneType(str, Enum):
    """场景类型 - 与前端 constants.ts 保持同步"""
    BUSINESS = "business"
    EDUCATION = "education"
    TECH = "tech"
    CREATIVE = "creative"
    MARKETING = "marketing"
    FINANCE = "finance"
    MEDICAL = "medical"
    GOVERNMENT = "government"


class StyleType(str, Enum):
    """风格类型 - 与前端 constants.ts 保持同步"""
    PROFESSIONAL = "professional"
    SIMPLE = "simple"
    ENERGETIC = "energetic"
    PREMIUM = "premium"
    CREATIVE = "creative"
    TECH = "tech"
    NATURE = "nature"
    ELEGANT = "elegant"
    PLAYFUL = "playful"
    MINIMALIST = "minimalist"


class TemplateType(str, Enum):
    """模板类型 - 与前端 constants.ts 保持同步"""
    DEFAULT = "default"
    MODERN = "modern"
    CLASSIC = "classic"
    TECH = "tech"
    NATURE = "nature"
    OCEAN = "ocean"
    SUNSET = "sunset"
    MINIMAL = "minimal"


class TextStyleType(str, Enum):
    """文字样式类型 - 与前端 constants.ts 保持同步"""
    TRANSPARENT_OVERLAY = "transparent_overlay"  # 半透明遮罩
    SHADOW = "shadow"  # 文字阴影
    GLOW = "glow"  # 发光效果
    OUTLINE = "outline"  # 描边效果
    GRADIENT = "gradient"  # 渐变文字
    NEON = "neon"  # 霓虹灯效


class ScriptContentType(str, Enum):
    """AI 脚本内容生成类型 - R148 AI Script & Content Generation 2.0"""
    STORY_ARC = "story_arc"  # 故事弧线生成器 - 叙事结构
    DATA_STORY = "data_story"  # 数据故事讲述者 - 数据驱动的叙事
    PERSUASION = "persuasion"  # 说服技巧 - 修辞框架
    AUDIENCE_PERSONA = "audience_persona"  # 受众画像 - 精准内容定制
    COMPETITOR_ANALYSIS = "competitor_analysis"  # 竞品分析 - 竞争格局幻灯片


class LayoutType(str, Enum):
    """布局类型 - 与前端 constants.ts 保持同步"""
    TITLE_SLIDE = "title_slide"  # 封面
    CONTENT_CARD = "content_card"  # 卡片
    TWO_COLUMN = "two_column"  # 双栏
    CENTER_RADIATION = "center_radiation"  # 中心辐射
    TIMELINE = "timeline"  # 时间线
    DATA_VISUALIZATION = "data_visualization"  # 数据可视化
    QUOTE = "quote"  # 金句
    COMPARISON = "comparison"  # 对比
    TOC = "toc"  # 目录
    THANK_YOU = "thank_you"  # 结束页
    LEFT_TEXT_RIGHT_IMAGE = "left_text_right_image"  # 左文右图
    LEFT_IMAGE_RIGHT_TEXT = "left_image_right_text"  # 左图右文
    THREE_COLUMN = "three_column"  # 三栏
    MASONRY = "masonry"  # 瀑布流
    FULL_IMAGE = "full_image"  # 全屏图
    PROCESS = "process"  # 流程图
    TEAM = "team"  # 团队介绍


# ==================== 请求模型 ====================

class SlideBackground(BaseModel):
    """单页背景设置"""
    slide_index: int = Field(..., ge=0, description="页码索引 (0-based)")
    background_type: str = Field(default="color", description="背景类型: color(颜色), image(图片), gradient(渐变)")
    background_color: Optional[str] = Field(default=None, description="背景颜色 (hex)")
    background_image: Optional[str] = Field(default=None, description="背景图片URL")
    gradient_start: Optional[str] = Field(default=None, description="渐变起始颜色")
    gradient_end: Optional[str] = Field(default=None, description="渐变结束颜色")

    @field_validator('background_color', 'gradient_start', 'gradient_end')
    @classmethod
    def validate_hex_color_optional(cls, v):
        if v is not None:
            if not HEX_COLOR_PATTERN.match(v):
                raise ValueError('颜色必须是有效的hex格式，如#FF5500')
        return v


class SlideLayout(BaseModel):
    """单页布局设置"""
    slide_index: int = Field(..., ge=0, description="页码索引 (0-based)")
    layout_type: LayoutType = Field(default=LayoutType.CONTENT_CARD, description="布局类型")


class GenerateRequest(BaseModel):
    """PPT生成请求"""
    user_request: str = Field(..., min_length=10, max_length=2000, description="用户需求描述")
    slide_count: int = Field(default=10, ge=5, le=30, description="幻灯片数量")
    scene: SceneType = Field(default=SceneType.BUSINESS, description="场景类型")
    style: StyleType = Field(default=StyleType.PROFESSIONAL, description="风格类型")
    template: TemplateType = Field(default=TemplateType.DEFAULT, description="模板类型")
    theme_color: str = Field(default="#165DFF", description="主题色")
    text_style: TextStyleType = Field(default=TextStyleType.TRANSPARENT_OVERLAY, description="文字样式方案")
    shadow_color: str = Field(default="#000000", description="阴影颜色")

    @field_validator('theme_color', 'shadow_color')
    @classmethod
    def validate_hex_color(cls, v):
        return validate_hex_color(v, '颜色')

    @field_validator('scene', mode='before')
    @classmethod
    def validate_scene(cls, v):
        if isinstance(v, str) and v not in [s.value for s in SceneType]:
            raise ValueError(f'Invalid scene: {v}. Must be one of {[s.value for s in SceneType]}')
        return v

    @field_validator('style', mode='before')
    @classmethod
    def validate_style(cls, v):
        if isinstance(v, str) and v not in [s.value for s in StyleType]:
            raise ValueError(f'Invalid style: {v}. Must be one of {[s.value for s in StyleType]}')
        return v

    @field_validator('generation_mode')
    @classmethod
    def validate_generation_mode(cls, v):
        if v not in ['standard', 'fast', 'quality', 'stream']:
            raise ValueError('generation_mode必须是 standard/fast/quality/stream 之一')
        return v

    @field_validator('output_format')
    @classmethod
    def validate_output_format(cls, v):
        if v not in ['pptx', 'pdf', 'svg', 'png']:
            raise ValueError('output_format必须是 pptx/pdf/svg/png 之一')
        return v

    @field_validator('quality')
    @classmethod
    def validate_quality(cls, v):
        if v not in ['standard', 'high', 'ultra']:
            raise ValueError('quality必须是 standard/high/ultra 之一')
        return v

    @field_validator('layout_mode')
    @classmethod
    def validate_layout_mode(cls, v):
        if v not in ['auto', 'manual']:
            raise ValueError('layout_mode必须是 auto/manual 之一')
        return v

    overlay_transparency: int = Field(default=30, ge=0, le=100, description="遮罩透明度百分比")
    use_smart_layout: bool = Field(default=False, description="是否使用智能布局模式")
    slide_backgrounds: Optional[List[SlideBackground]] = Field(default=None, description="每页背景设置")
    slide_layouts: Optional[List[SlideLayout]] = Field(default=None, description="每页布局设置")
    include_charts: bool = Field(default=False, description="是否包含数据图表")
    include_pie_chart: bool = Field(default=True, description="是否包含饼图")
    include_bar_chart: bool = Field(default=True, description="是否包含柱状图")
    include_line_chart: bool = Field(default=False, description="是否包含折线图")
    add_watermark: bool = Field(default=False, description="是否添加水印")
    # 字体系统4级设置
    font_title: Optional[str] = Field(default="思源黑体", description="一级字体（标题）")
    font_subtitle: Optional[str] = Field(default="思源黑体", description="二级字体（副标题）")
    font_content: Optional[str] = Field(default="思源宋体", description="三级字体（正文）")
    font_caption: Optional[str] = Field(default="思源黑体", description="四级字体（注释）")
    # 生成模式
    generation_mode: Optional[str] = Field(default="standard", description="生成模式: standard/fast/quality/stream")
    output_format: Optional[str] = Field(default="pptx", description="输出格式: pptx/pdf/svg/png")
    quality: Optional[str] = Field(default="standard", description="输出质量: standard/high/ultra")
    # 布局设置
    layout_mode: Optional[str] = Field(default="auto", description="布局模式: auto/manual")
    unified_layout: Optional[bool] = Field(default=True, description="是否统一布局")
    # 两阶段生成：预生成的内容（来自 OutlineEditView 用户确认后的大纲）
    pre_generated_slides: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="预生成的大纲内容，用于两阶段模式跳过 AI 内容规划步骤",
        validation_alias=AliasChoices("pre_generated_slides", "pre-generated-slides")
    )
    # R148: AI 脚本内容生成类型
    script_content_type: Optional[ScriptContentType] = Field(
        default=None,
        description="AI 脚本内容生成类型: story_arc/data_story/persuasion/audience_persona/competitor_analysis"
    )

    @field_validator('script_content_type', mode='before')
    @classmethod
    def validate_script_content_type(cls, v):
        if v is None:
            return v
        if isinstance(v, str) and v not in [s.value for s in ScriptContentType]:
            raise ValueError(f'Invalid script_content_type: {v}. Must be one of {[s.value for s in ScriptContentType]}')
        if isinstance(v, ScriptContentType):
            return v
        return ScriptContentType(v)

    @field_validator('pre_generated_slides', mode='before')
    @classmethod
    def validate_pre_generated_slides(cls, v):
        """拒绝字符串输入，确保 pre_generated_slides 是 list[dict] 且每项有 title"""
        if v is None:
            return v
        if isinstance(v, str):
            raise ValueError(
                "pre_generated_slides must be a list of dicts, not a string. "
                "Outline editor is sending plain text - fix OutlineEditView to send structured slides."
            )
        if not isinstance(v, list):
            raise ValueError(f"pre_generated_slides must be a list, got {type(v).__name__}")
        for i, item in enumerate(v):
            if not isinstance(item, dict):
                raise ValueError(f"pre_generated_slides[{i}] must be a dict, got {type(item).__name__}")
            if "title" not in item:
                raise ValueError(f"pre_generated_slides[{i}] missing required field 'title'")
            # BUG修复: 验证 content 字段必须是 list[str]，不是带换行的字符串
            if "content" in item:
                content = item["content"]
                if isinstance(content, str):
                    # 自动转换字符串为数组
                    item["content"] = [line.strip() for line in content.split('\n') if line.strip()]
                    logger.warning(f"pre_generated_slides[{i}] content 是字符串，已自动转换为数组")
                elif not isinstance(content, list):
                    raise ValueError(f"pre_generated_slides[{i}] content must be list or str, got {type(content).__name__}")
        return v


# ==================== 响应模型 ====================

class TaskResult(BaseModel):
    """任务结果"""
    pptx_path: str
    slide_count: int
    file_size: int = 0
    compression_ratio: float = 0.0


class TaskError(BaseModel):
    """任务错误"""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class GenerateResponse(BaseModel):
    """生成响应"""
    success: bool
    task_id: str
    status: TaskStatus
    message: str
    request_id: Optional[str] = None
    estimated_time: Optional[int] = None


class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    success: bool
    task_id: str
    status: TaskStatus
    progress: int = Field(default=0, ge=0, le=100)
    current_step: str = ""
    created_at: str
    updated_at: str
    result: Optional[TaskResult] = None
    error: Optional[TaskError] = None
    user_request: Optional[str] = Field(default=None, description="用户原始需求，用于重新生成时保留")


# ==================== 数据模型 ====================

class SlideData(BaseModel):
    """幻灯片数据"""
    index: int
    title: str
    content: str
    image_url: Optional[str] = None
    svg_content: Optional[str] = None
    # R152: Advanced Slide Notes & Annotations
    notes: Optional[str] = Field(default=None, description="备注（纯文本）")
    rich_notes: Optional[str] = Field(default=None, description="富文本备注（HTML格式）")
    speaker_notes: Optional[str] = Field(default=None, description="演讲者私有备注")
    annotations: Optional[List[Dict[str, Any]]] = Field(default=None, description="幻灯片标注数据")
    sticky_notes: Optional[List[Dict[str, Any]]] = Field(default=None, description="便签协作数据")


class PPTData(BaseModel):
    """PPT数据"""
    task_id: str
    user_request: str
    slides: List[SlideData]
    scene: SceneType
    style: StyleType
    template: TemplateType
    theme_color: str


# ==================== 配置模型 ====================

class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    service: str
    version: str = "1.0.0"
    uptime: float = 0.0


class APIInfo(BaseModel):
    """API信息"""
    name: str
    version: str
    features: List[str]

# ==================== Social Engagement Models ====================

class ReactionType(str, Enum):
    """反应类型"""
    LIKE = "like"       # 👍
    FIRE = "fire"       # 🔥
    HEART = "heart"     # ❤️


class ReactionRequest(BaseModel):
    """添加反应请求"""
    task_id: str = Field(..., description="PPT任务ID")
    reaction_type: ReactionType = Field(..., description="反应类型")


class ReactionResponse(BaseModel):
    """反应响应"""
    success: bool
    task_id: str
    reaction_type: ReactionType
    total_likes: int = 0
    total_fires: int = 0
    total_hearts: int = 0
    user_reaction: Optional[ReactionType] = None


class ShareLinkRequest(BaseModel):
    """自定义分享链接请求"""
    task_id: str = Field(..., description="PPT任务ID")
    title: str = Field(default="", max_length=200, description="分享标题")
    description: str = Field(default="", max_length=500, description="分享描述")
    thumbnail: Optional[str] = Field(default=None, description="缩略图URL")


class ShareLinkResponse(BaseModel):
    """分享链接响应"""
    success: bool
    task_id: str
    share_url: str
    title: str
    description: str
    thumbnail: Optional[str] = None


class ViewCountResponse(BaseModel):
    """浏览量响应"""
    success: bool
    task_id: str
    view_count: int
    is_public: bool


class EngagementStats(BaseModel):
    """互动统计数据"""
    success: bool
    task_id: str
    view_count: int = 0
    likes: int = 0
    fires: int = 0
    hearts: int = 0
    comment_count: int = 0
    share_count: int = 0


# ==================== Data Source Models (R75) ====================

class DataSourceType(str, Enum):
    """数据源类型"""
    EXCEL = "excel"           # .xlsx / .xls 文件
    CSV = "csv"               # CSV 文件
    GOOGLE_SHEETS = "google_sheets"  # Google Sheets


class DataSourceStatus(str, Enum):
    """数据源状态"""
    ACTIVE = "active"
    SYNCING = "syncing"
    ERROR = "error"
    DISABLED = "disabled"


class DataSource(BaseModel):
    """数据源"""
    id: str = Field(..., description="数据源唯一ID")
    name: str = Field(..., max_length=200, description="数据源名称")
    source_type: DataSourceType = Field(..., description="数据源类型")
    status: DataSourceStatus = Field(default=DataSourceStatus.ACTIVE, description="状态")
    # Excel/CSV fields
    file_path: Optional[str] = Field(default=None, description="本地文件路径")
    file_name: Optional[str] = Field(default=None, description="原始文件名")
    # Google Sheets fields
    spreadsheet_url: Optional[str] = Field(default=None, description="Google Sheets URL")
    spreadsheet_id: Optional[str] = Field(default=None, description="Google Sheets ID")
    sheet_name: Optional[str] = Field(default=None, description="工作表名称")
    access_token: Optional[str] = Field(default=None, description="Google OAuth access token")
    refresh_token: Optional[str] = Field(default=None, description="Google OAuth refresh token")
    # Sync settings
    auto_update: bool = Field(default=False, description="自动更新开关")
    last_synced_at: Optional[str] = Field(default=None, description="最后同步时间 ISO8601")
    sync_interval_minutes: int = Field(default=60, ge=5, le=1440, description="同步间隔(分钟)")
    # Extracted data
    extracted_data: Optional[Dict[str, Any]] = Field(default=None, description="提取的数据内容")
    table_preview: Optional[List[List[Any]]] = Field(default=None, description="表格预览(前20行)")
    column_info: Optional[List[Dict[str, Any]]] = Field(default=None, description="列信息")
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="创建时间")
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="更新时间")
    user_id: Optional[str] = Field(default=None, description="用户ID")


class DataSourceCreateRequest(BaseModel):
    """创建数据源请求"""
    name: str = Field(..., max_length=200, description="数据源名称")
    source_type: DataSourceType = Field(..., description="数据源类型")
    spreadsheet_url: Optional[str] = Field(default=None, description="Google Sheets URL")
    auto_update: bool = Field(default=False, description="自动更新")


class DataSourceUpdateRequest(BaseModel):
    """更新数据源请求"""
    name: Optional[str] = Field(default=None, max_length=200, description="数据源名称")
    auto_update: Optional[bool] = Field(default=None, description="自动更新")
    sync_interval_minutes: Optional[int] = Field(default=None, ge=5, le=1440, description="同步间隔")
    status: Optional[DataSourceStatus] = Field(default=None, description="状态")


class DataSourceListResponse(BaseModel):
    """数据源列表响应"""
    success: bool
    data_sources: List[DataSource] = []


class DataSourceSyncResponse(BaseModel):
    """数据源同步响应"""
    success: bool
    data_source_id: str
    synced_rows: int = 0
    synced_at: str
    message: str = ""


class ExcelImportRequest(BaseModel):
    """Excel导入请求"""
    sheet_index: int = Field(default=0, ge=0, description="工作表索引")
    has_header: bool = Field(default=True, description="是否有表头行")
    max_rows: int = Field(default=1000, ge=1, le=10000, description="最大导入行数")


class TableToSlidesOptions(BaseModel):
    """表格转幻灯片选项"""
    title_col: Optional[int] = Field(default=None, description="标题列索引")
    value_cols: Optional[List[int]] = Field(default=None, description="数值列索引列表")
    chart_type: str = Field(default="auto", description="图表类型: auto/bar/line/pie/table")
    include_summary: bool = Field(default=True, description="包含汇总页")
    max_slides: int = Field(default=10, ge=1, le=20, description="最大幻灯片数")


# ==================== R81: Folders & Organization Models ====================

class LabelColor(str, Enum):
    """标签颜色枚举"""
    RED = "#FF3B30"
    ORANGE = "#FF9500"
    YELLOW = "#FFCC00"
    GREEN = "#34C759"
    TEAL = "#5AC8FA"
    BLUE = "#165DFF"
    PURPLE = "#AF52DE"
    GRAY = "#8E8E93"


class FolderModel(BaseModel):
    """文件夹模型 - 支持层级结构"""
    id: str = Field(..., description="文件夹唯一ID")
    name: str = Field(..., max_length=100, description="文件夹名称")
    parent_id: Optional[str] = Field(default=None, description="父文件夹ID，null表示根目录")
    color: Optional[str] = Field(default=None, description="文件夹颜色 hex")
    icon: str = Field(default="📁", description="文件夹图标 emoji")
    sort_order: int = Field(default=0, description="排序顺序")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="创建时间")
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="更新时间")


class FolderCreateRequest(BaseModel):
    """创建文件夹请求"""
    name: str = Field(..., max_length=100, description="文件夹名称")
    parent_id: Optional[str] = Field(default=None, description="父文件夹ID")
    color: Optional[str] = Field(default=None, description="文件夹颜色")
    icon: str = Field(default="📁", description="文件夹图标")


class FolderUpdateRequest(BaseModel):
    """更新文件夹请求"""
    name: Optional[str] = Field(default=None, max_length=100, description="文件夹名称")
    parent_id: Optional[str] = Field(default=None, description="父文件夹ID")
    color: Optional[str] = Field(default=None, description="文件夹颜色")
    icon: Optional[str] = Field(default=None, description="文件夹图标")
    sort_order: Optional[int] = Field(default=None, description="排序顺序")


class FolderListResponse(BaseModel):
    """文件夹列表响应"""
    success: bool
    folders: List[FolderModel]


class LabelUpdateRequest(BaseModel):
    """更新标签颜色请求"""
    label_color: Optional[str] = Field(default=None, description="标签颜色 hex，null表示清除")


class SmartTagResponse(BaseModel):
    """智能标签响应"""
    success: bool
    task_id: str
    auto_tags: List[str] = Field(default_factory=list, description="AI自动生成的标签")


class RecentlyViewedItem(BaseModel):
    """最近浏览项目"""
    task_id: str
    title: str
    thumbnail_url: Optional[str] = None
    viewed_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    folder_id: Optional[str] = None
    label_color: Optional[str] = None


class RecentlyViewedResponse(BaseModel):
    """最近浏览响应"""
    success: bool
    items: List[RecentlyViewedItem]
    limit: int = 10


class OrganizationUpdateRequest(BaseModel):
    """组织更新请求 - 移动到文件夹/更新标签"""
    folder_id: Optional[str] = Field(default=None, description="目标文件夹ID，null表示移到根目录")
    label_color: Optional[str] = Field(default=None, description="标签颜色 hex")
    tags: Optional[List[str]] = Field(default=None, description="标签列表（手动+AI标签）")


# ==================== R108: Custom Widgets & Embeddable Components ====================

class PollWidgetConfig(BaseModel):
    """投票组件配置"""
    poll_id: Optional[str] = Field(default=None, description="投票ID")
    question: str = Field(default="", description="投票问题")
    options: List[str] = Field(default_factory=list, description="投票选项列表")
    is_active: bool = Field(default=True, description="投票是否激活")
    show_results: bool = Field(default=False, description="是否显示实时结果")


class QAWidgetConfig(BaseModel):
    """问答组件配置"""
    qa_id: Optional[str] = Field(default=None, description="问答ID")
    question: str = Field(default="", description="问题内容")
    asker: str = Field(default="匿名用户", description="提问者")
    is_answered: bool = Field(default=False, description="是否已回答")
    created_at: Optional[str] = Field(default=None, description="创建时间")


class PollVoteRequest(BaseModel):
    """投票请求"""
    poll_id: str = Field(..., description="投票ID")
    option_index: int = Field(..., ge=0, description="选择的选项索引")


class PollVoteResponse(BaseModel):
    """投票响应"""
    success: bool
    poll_id: str
    total_votes: int
    option_results: Dict[str, int]  # option_index -> vote_count
    user_voted_option: Optional[int] = None


class QASubmitRequest(BaseModel):
    """Q&A提交请求"""
    question: str = Field(..., min_length=1, max_length=500, description="问题内容")
    asker_name: Optional[str] = Field(default="匿名用户", description="提问者名称")


class QASubmitResponse(BaseModel):
    """Q&A提交响应"""
    success: bool
    qa_id: str
    question: str
    asker: str
    created_at: str


class LivePollResult(BaseModel):
    """实时投票结果"""
    poll_id: str
    question: str
    options: List[str]
    option_votes: Dict[str, int]  # option_index -> vote_count
    total_votes: int
    percentage: Dict[str, float]  # option_index -> percentage
    is_active: bool


class EmbedSlideConfigRequest(BaseModel):
    """单页嵌入配置"""
    slide_index: int = Field(default=1, ge=1, description="幻灯片索引（1-based）")
    width: Optional[str] = "100%"
    height: Optional[str] = "600px"
    theme: Optional[str] = "light"
    interactive: Optional[bool] = True
