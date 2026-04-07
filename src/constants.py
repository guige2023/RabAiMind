# -*- coding: utf-8 -*-
"""
Constants for RabAiMind PPT Generation Platform.

This module extracts all magic numbers and configuration constants
to provide a centralized configuration point for the application.
"""

# =============================================================================
# SVG/Slide Dimensions
# =============================================================================
DEFAULT_SLIDE_WIDTH = 1600
DEFAULT_SLIDE_HEIGHT = 900
SLIDE_ASPECT_RATIO = "16:9"
DEFAULT_GRADIENT_ANGLE = 45  # Default angle for SVG gradient fills

# =============================================================================
# Default Generation Parameters
# =============================================================================
DEFAULT_SLIDE_COUNT = 10
DEFAULT_SCENE = "business"
DEFAULT_STYLE = "professional"
DEFAULT_TEMPLATE = "default"
DEFAULT_THEME_COLOR = "#165DFF"
DEFAULT_TEXT_STYLE = "transparent_overlay"
DEFAULT_SHADOW_COLOR = "#000000"
DEFAULT_OVERLAY_TRANSPARENCY = 30
DEFAULT_FONT_TITLE = "思源黑体"
DEFAULT_FONT_SUBTITLE = "思源黑体"
DEFAULT_FONT_CONTENT = "思源宋体"
DEFAULT_FONT_CAPTION = "思源黑体"

# =============================================================================
# Generation Modes
# =============================================================================
GENERATION_MODE_STANDARD = "standard"
GENERATION_MODE_FAST = "fast"
GENERATION_MODE_QUALITY = "quality"
GENERATION_MODE_STREAM = "stream"
VALID_GENERATION_MODES = {GENERATION_MODE_STANDARD, GENERATION_MODE_FAST, GENERATION_MODE_QUALITY, GENERATION_MODE_STREAM}

# =============================================================================
# Output Formats
# =============================================================================
OUTPUT_FORMAT_PPTX = "pptx"
OUTPUT_FORMAT_PDF = "pdf"
OUTPUT_FORMAT_SVG = "svg"
OUTPUT_FORMAT_PNG = "png"
VALID_OUTPUT_FORMATS = {OUTPUT_FORMAT_PPTX, OUTPUT_FORMAT_PDF, OUTPUT_FORMAT_SVG, OUTPUT_FORMAT_PNG}

# =============================================================================
# Quality Levels
# =============================================================================
QUALITY_STANDARD = "standard"
QUALITY_HIGH = "high"
QUALITY_ULTRA = "ultra"
VALID_QUALITIES = {QUALITY_STANDARD, QUALITY_HIGH, QUALITY_ULTRA}
QUALITY_DPI = {
    QUALITY_STANDARD: 96,
    QUALITY_HIGH: 144,
    QUALITY_ULTRA: 192,
}

# =============================================================================
# Layout Modes
# =============================================================================
LAYOUT_MODE_AUTO = "auto"
LAYOUT_MODE_MANUAL = "manual"
VALID_LAYOUT_MODES = {LAYOUT_MODE_AUTO, LAYOUT_MODE_MANUAL}

# =============================================================================
# Text Styles
# =============================================================================
TEXT_STYLE_TRANSPARENT_OVERLAY = "transparent_overlay"
TEXT_STYLE_SHADOW = "shadow"
TEXT_STYLE_GLOW = "glow"
TEXT_STYLE_OUTLINE = "outline"
TEXT_STYLE_GRADIENT = "gradient"
TEXT_STYLE_NEON = "neon"
VALID_TEXT_STYLES = {
    TEXT_STYLE_TRANSPARENT_OVERLAY,
    TEXT_STYLE_SHADOW,
    TEXT_STYLE_GLOW,
    TEXT_STYLE_OUTLINE,
    TEXT_STYLE_GRADIENT,
    TEXT_STYLE_NEON,
}

# =============================================================================
# Scenes
# =============================================================================
SCENE_BUSINESS = "business"
SCENE_ACADEMIC = "academic"
SCENE_MARKETING = "marketing"
SCENE_GENERAL = "general"
VALID_SCENES = {SCENE_BUSINESS, SCENE_ACADEMIC, SCENE_MARKETING, SCENE_GENERAL}

# =============================================================================
# Styles
# =============================================================================
STYLE_PROFESSIONAL = "professional"
STYLE_CREATIVE = "creative"
STYLE_MINIMAL = "minimal"
STYLE_BOLD = "bold"
VALID_STYLES = {STYLE_PROFESSIONAL, STYLE_CREATIVE, STYLE_MINIMAL, STYLE_BOLD}

# =============================================================================
# Progress Tracking
# =============================================================================
PROGRESS_START_IMAGE = 22
PROGRESS_RANGE_IMAGE = 23
PROGRESS_START_SVG = 48
PROGRESS_RANGE_SVG = 32
PROGRESS_START_PPTX = 85
PROGRESS_START_COMPLETE = 100

# =============================================================================
# Timeout Settings (in seconds)
# =============================================================================
PPTX_GENERATION_TIMEOUT = 300  # 5 minutes
API_CHECK_CACHE_TIMEOUT = 300  # 5 minutes
IMAGE_DOWNLOAD_TIMEOUT = 10  # 10 seconds
POLLING_INTERVAL_SECONDS = 5  # 5 seconds between polls
MAX_POLLING_ATTEMPTS = 60  # Maximum polling attempts

# =============================================================================
# Retry and Failure Settings
# =============================================================================
IMAGE_FAILURE_THRESHOLD = 3  # Max image generation failures before fallback
API_CACHE_DURATION = 300  # 5 minutes

# =============================================================================
# Content Limits
# =============================================================================
TITLE_MAX_LENGTH = 20
TITLE_MAX_LENGTH_CHART = 30
CONTENT_PREVIEW_LENGTH = 100
IMAGE_URL_PREVIEW_LENGTH = 50
MAX_CONTENT_ITEMS = 6  # Maximum bullet points per slide
MAX_SLIDES_DISPLAY = 120  # Max characters for display

# =============================================================================
# SVG Placeholder Settings
# =============================================================================
PLACEHOLDER_ICON_SIZE = 120
PLACEHOLDER_TITLE_FONT_SIZE = 36
PLACEHOLDER_PAGE_NUMBER_FONT_SIZE = 20
PLACEHOLDER_DECORATIVE_CIRCLE_OPACITY_1 = 0.08
PLACEHOLDER_DECORATIVE_CIRCLE_OPACITY_2 = 0.06
# SVG safe margin boundaries (content should stay within these limits)
SVG_SAFE_MARGIN_LEFT = 100
SVG_SAFE_MARGIN_TOP = 50
SVG_SAFE_MARGIN_RIGHT = 1400
SVG_SAFE_MARGIN_BOTTOM = 800

# =============================================================================
# Image Settings
# =============================================================================
IMAGE_QUALITY_JPEG = 75
IMAGE_RESIZE_WIDTH = 1920
IMAGE_RESIZE_HEIGHT = 1080
IMAGE_BRIGHTNESS_SAMPLE_SIZE = 100
IMAGE_BRIGHTNESS_THRESHOLD = 128  # Threshold for determining light/dark backgrounds
# Brightness formula coefficients: (R * 299 + G * 587 + B * 114) / 1000
BRIGHTNESS_COEFFICIENT_RED = 299
BRIGHTNESS_COEFFICIENT_GREEN = 587
BRIGHTNESS_COEFFICIENT_BLUE = 114

# =============================================================================
# Chart Theme Colors
# =============================================================================
CHART_THEME_COLORS = {
    SCENE_BUSINESS: ("#1e3a5f", "#60a5fa", "#165DFF"),
    SCENE_ACADEMIC: ("#2d3748", "#63b3ed", "#3182ce"),
    SCENE_MARKETING: ("#553c9a", "#b794f4", "#805ad5"),
    SCENE_GENERAL: ("#2d3748", "#718096", "#4a5568"),
}

# =============================================================================
# Slide Type Color Maps
# =============================================================================
SLIDE_TYPE_COLORS = {
    "title": ("#1e40af", "#60a5fa", "📊"),
    "thank_you": ("#065f46", "#34d399", "🙏"),
    "content": ("#1e3a5f", "#60a5fa", "💡"),
    "toc": ("#4c1d95", "#a78bfa", "📋"),
}

# =============================================================================
# Font Mappings (to PPT-compatible fonts)
# =============================================================================
FONT_MAP = {
    "思源黑体": "Microsoft YaHei",
    "思源宋体": "SimSun",
    "思源黑体 Heavy": "Microsoft YaHei",
    "思源黑体 Bold": "Microsoft YaHei",
    "Noto Sans": "Microsoft YaHei",
    "Source Han Sans": "Microsoft YaHei",
    "Source Han Serif": "SimSun",
}

# =============================================================================
# PPTX Settings
# =============================================================================
PPTX_SLIDE_WIDTH_INCHES = 16
PPTX_SLIDE_HEIGHT_INCHES = 9
PPTX_TITLE_FONT_SIZE = 48
PPTX_CONTENT_FONT_SIZE = 26
PPTX_CONTENT_LINE_SPACING = 18
PPTX_ALPHA_MULTIPLIER = 1000  # Transparency percentage to PPTX alpha value multiplier
PPTX_SHADOW_OFFSET = 3  # Default shadow offset for text shadow effect

# =============================================================================
# Branding Settings
# =============================================================================
BRAND_LOGO_SIZE_INCHES = (1.2, 0.8)
BRAND_FOOTER_FONT_SIZE = 10
BRAND_POWERED_BY_FONT_SIZE = 9
BRAND_TEXT_COLOR = RGBColor(0x99, 0x99, 0x99) if False else None  # Placeholder

# =============================================================================
# Keyword Translation Map
# =============================================================================
KEYWORD_TRANSLATIONS = {
    "商业": "business",
    "企业": "corporate",
    "公司": "company",
    "产品": "product",
    "服务": "service",
    "市场": "market",
    "营销": "marketing",
    "销售": "sales",
    "技术": "technology",
    "创新": "innovation",
    "发展": "development",
    "团队": "team",
    "领导": "leadership",
    "管理": "management",
    "培训": "training",
    "教育": "education",
    "学习": "learning",
    "财务": "finance",
    "数据": "data",
    "分析": "analysis",
    "报告": "report",
    "总结": "summary",
    "计划": "plan",
    "目标": "goal",
    "战略": "strategy",
    "优势": "advantage",
    "挑战": "challenge",
    "解决方案": "solution",
    "案例": "case study",
    "谢谢": "thank you",
    "感谢": "thank you",
    "结束": "ending",
}

# =============================================================================
# Internal Domain Blocking List (for SSRF protection)
# =============================================================================
INTERNAL_DOMAINS = (
    "localhost",
    "127.",
    "10.",
    "192.168.",
    "172.16.",
    "169.254.",
    "::1",
    "fe80:",
    ".local",
    ".intranet.",
    ".corp",
    ".home.",
    "metadata.google.internal",
)

# =============================================================================
# Compression Settings
# =============================================================================
COMPRESSION_LEVEL = 9  # Maximum ZIP compression

# =============================================================================
# Thread Pool Settings
# =============================================================================
SVG_GENERATION_THREAD_WORKERS = 4  # ThreadPoolExecutor for parallel SVG generation
PPTX_CONVERSION_THREAD_WORKERS = 1  # ThreadPoolExecutor for PPTX conversion

# =============================================================================
# Task Manager Settings
# =============================================================================
MAX_TASKS = 1000  # Maximum task queue capacity
MAX_COMPLETED_CLEANUP = 100  # Number of old completed tasks to clean up per cycle
CLEANUP_INTERVAL = 10  # Cleanup interval (every N operations)
MAX_TASK_AGE_MINUTES = 30  # Maximum task age before cleanup (in minutes)
MAX_ACTION_LOG = 100  # Maximum action log entries
MAX_UNDO_STACK = 100  # Maximum undo stack size
MAX_ACTION_TIMELINE = 200  # Maximum action timeline entries
MAX_CHECKPOINTS = 50  # Maximum checkpoints per task
MAX_SLIDE_CHANGES = 200  # Maximum slide changes recorded

# =============================================================================
# Async Operation Settings
# =============================================================================
THREAD_JOIN_TIMEOUT = 1.0  # Timeout for joining threads (in seconds)
CANCEL_TASK_TIMEOUT = 5.0  # Timeout for async task cancellation
BACKGROUND_IMAGE_TIMEOUT = 15  # Timeout for background image downloads

# =============================================================================
# A/B Testing Settings
# =============================================================================
DEFAULT_VARIANT_COUNT = 2  # Default number of A/B test variants
MIN_SLIDE_CONTENT_LENGTH = 20  # Minimum content length before warning
MAX_SLIDE_CONTENT_LENGTH = 500  # Maximum content length before warning
MAX_SLIDE_TITLE_LENGTH = 40  # Maximum title length before warning

# =============================================================================
# Language Detection Settings
# =============================================================================
LANGUAGE_DETECTION_TEXT_LIMIT = 2000  # Text limit for language detection
LANGUAGE_DETECTION_SAMPLE_LENGTH = 200  # Sample length for display

# =============================================================================
# Slide Layout Thresholds
# =============================================================================
SLIDE_NUMBER_DISPLAY_THRESHOLD = 800  # Y position threshold for slide number filtering
OUTLINE_LINE_DIFF_THRESHOLD = 3  # Minimum line difference for outline change detection
