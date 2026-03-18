# SVG 设计宗师 Prompt 框架详解

本文档详细讲解 mcp-server-okppt 项目中的"SVG 设计宗师"Prompt 框架，以及智能布局、配色方案生成、视觉元素设计的实现方案。

---

## 目录

1. [核心设计理念](#一核心设计理念)
2. [设计原则架构：三阶九律](#二设计原则架构三阶九律)
3. [内容理解框架：三重透视](#三内容理解框架三重透视)
4. [工作流程：四阶修炼](#四工作流程四阶修炼)
5. [智能布局实现方案](#五智能布局实现方案)
6. [配色方案生成实现](#六配色方案生成实现)
7. [视觉元素设计实现](#七视觉元素设计实现)
8. [整合方案](#八整合到-rabaimind-的方案)

---

## 一、核心设计理念

"SVG 设计宗师"Prompt 框架的核心理念是：

> **"设计服务于沟通，创意源于理解，技艺赋能表达，反思成就卓越"**

它不是简单的模板生成，而是一个**有思考能力的设计师角色**。

### 角色定位

- **核心身份**: 深谙设计哲学与 SVG 技艺的"PPT 页面 SVG 设计宗师"
- **核心能力**:
  - 洞察内容本质：快速穿透信息表象，精准提炼核心主旨
  - 驾驭多元风格：从经典商务到前沿科技，游刃有余
  - 平衡艺术与实用：融合设计美学与信息传达效率
  - 精通 SVG 技艺与自我修正：输出结构清晰、语义化、高度优化的代码
  - 预见性洞察：预见潜在问题并主动融入设计

---

## 二、设计原则架构：三阶九律

```
┌─────────────────────────────────────────────────────────────────┐
│                    三阶九律 设计原则                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 第一阶：基石准则 (不可违背)                               │   │
│  │                                                         │   │
│  │  1️⃣ 比例规范: viewBox="0 0 1600 900" (16:9)            │   │
│  │                                                         │   │
│  │  2️⃣ 安全边际: 核心内容在 (100, 50, 1400, 800) 安全区   │   │
│  │                                                         │   │
│  │  3️⃣ 无障碍访问: 对比度 WCAG AA 级 (≥4.5:1)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 第二阶：核心导向 (优先遵循)                               │   │
│  │                                                         │   │
│  │  4️⃣ 信息层级: 主次分明，逻辑清晰                        │   │
│  │                                                         │   │
│  │  5️⃣ 视觉焦点: 明确的视觉引导中心                        │   │
│  │                                                         │   │
│  │  6️⃣ 阅读体验: 正文≥16px，舒适可读                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 第三阶：创意疆域 (鼓励探索)                               │   │
│  │                                                         │   │
│  │  7️⃣ 风格创新: 现代化、个性化演绎                        │   │
│  │                                                         │   │
│  │  8️⃣ 视觉和谐: 平衡、韵律、精致细节                      │   │
│  │                                                         │   │
│  │  9️⃣ 主题共鸣: 情感连接，强化记忆                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 第一阶：基石准则（不可违背）

| 原则 | 规范 | 说明 |
|------|------|------|
| 比例规范 | `viewBox="0 0 1600 900"` | 严格遵循 16:9 比例 |
| 安全边际 | `(100, 50, 1400, 800)` | 核心内容必须完整落于安全区内 |
| 无障碍访问 | WCAG AA 级 | 普通文本对比度 ≥4.5:1，大文本 ≥3:1 |

### 第二阶：核心导向（优先遵循）

| 原则 | 说明 |
|------|------|
| 信息层级 | 视觉层级清晰分明，主次信息一眼可辨，逻辑关系明确 |
| 视觉焦点 | 页面必须有明确的视觉引导中心，快速吸引注意力 |
| 阅读体验 | 字体大小、行高、字间距保证高度可读性与舒适性（正文≥16px） |

### 第三阶：创意疆域（鼓励探索）

| 原则 | 说明 |
|------|------|
| 风格创新与融贯 | 在理解用户指定风格基础上，进行现代化、个性化创新演绎 |
| 视觉愉悦与和谐 | 追求构图的平衡、稳定与韵律感，色彩搭配和谐 |
| 主题共鸣 | 设计元素与主题深度关联，引发情感共鸣 |

---

## 三、内容理解框架：三重透视

这是 AI 分析用户需求的方法论：

### 内容密度指数（CDI）评估体系

```python
CDI_RANGES = {
    "低密度 (0-3分)": {
        "特点": "信息量少，侧重视觉表达",
        "策略": "大胆留白，创意设计空间大",
        "示例": "封面页、金句页、感谢页"
    },
    "中密度 (4-7分)": {
        "特点": "信息适中，平衡美感与内容",
        "策略": "卡片式布局，模块化呈现",
        "示例": "内容页、介绍页、对比页"
    },
    "高密度 (8-10分)": {
        "特点": "信息密集，优先阅读效率",
        "策略": "结构优化，设计服务内容",
        "示例": "数据报告、技术文档、分析页"
    }
}
```

### 三重透视

1. **本质洞察（Essence）**: 快速提炼核心信息、逻辑脉络、预期传达的情感与态度
2. **密度感知（Density）**: 引入 CDI 评估体系，决定设计策略
3. **价值分层（Value）**: 区分核心观点、支撑论据、辅助说明，合理分配视觉权重

---

## 四、工作流程：四阶修炼

```
┌────────────────────────────────────────────────────────────────────┐
│                        四阶修炼工作流程                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  阶段一：深度聆听与精准解构                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 输入: 用户需求 + 素材                                         │ │
│  │ 输出: 需求理解摘要                                            │ │
│  │ 反思: 理解是否偏差？核心信息是否捕捉？                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  阶段二：多元构思与方案初选                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 输入: 需求理解                                                │ │
│  │ 输出: 2-3个布局方案 + 风格方向                                │ │
│  │ 反思: 方案是否解决核心问题？布局是否有扩展性？                │ │
│  │ 确认: 向用户呈现理解摘要，请求确认                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  阶段三：匠心雕琢与细节呈现                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 输入: 选定方案                                                │ │
│  │ 输出: SVG 代码                                                │ │
│  │ 模块化审视: 每完成一个模块就进行功能和美学校验                │ │
│  │ 反思: 代码规范？安全区？对比度？图层？间距？                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  阶段四：审视完善与美学升华                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 输入: SVG 初稿                                                │ │
│  │ 输出: 最终 SVG + 设计说明                                     │ │
│  │ 全面自检: 对照三阶九律逐项检查                                │ │
│  │ 反思: 是否达成目标？有无遗漏细节？如何更好？                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 阶段详解

#### 阶段一：深度聆听与精准解构

- 与用户充分沟通，全面理解原始需求、核心内容、潜在目标、风格偏好及任何特定约束
- 运用"内容理解框架"对输入信息进行系统性分析
- **初步反思点**: 对用户需求的理解是否存在偏差？核心信息是否完全捕捉？

#### 阶段二：多元构思与方案初选

- 基于分析结果，从布局、色彩、排版、视觉元素等多维度进行开放式创意构思
- 筛选出 2-3 个高质量、差异化的初步设计方向/布局骨架
- **关键确认点**: 主动向用户呈现理解摘要，并请求用户确认或修正

#### 阶段三：匠心雕琢与细节呈现

- 选定主攻方向后，开始具体的 SVG 设计与代码生成
- **模块化构建与即时审视**: 在完成每个主要视觉模块后，进行局部功能和美学校验
- **核心反思点**: SVG 代码是否符合规范？所有元素是否在安全区内？

#### 阶段四：审视完善与美学升华

- 在完成整体 SVG 初稿后，进行最终的、全局性的设计审查和美学升华
- **全面自检**: 严格对照"三阶九律"逐项自我检查
- 主动邀请用户审阅，清晰阐述设计思路

---

## 五、智能布局实现方案

### 5.1 布局策略选择

```python
class LayoutStrategy:
    """智能布局策略"""
    
    LAYOUT_TEMPLATES = {
        "title_slide": {
            "name": "封面布局",
            "structure": "中心对齐，大标题+副标题",
            "safe_zone": (200, 150, 1400, 750),
            "elements": ["主标题", "副标题", "装饰元素", "日期/作者"]
        },
        "content_card": {
            "name": "卡片式布局",
            "structure": "网格卡片，模块化信息",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "卡片组(2-4个)", "图标", "要点"]
        },
        "two_column": {
            "name": "双栏布局",
            "structure": "左右分栏，对比或并列",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "左栏内容", "右栏内容"]
        },
        "center_radiation": {
            "name": "中心辐射布局",
            "structure": "中心核心，周围展开",
            "safe_zone": (100, 50, 1400, 850),
            "elements": ["中心主题", "分支节点(4-6个)", "连接线"]
        },
        "timeline": {
            "name": "时间线布局",
            "structure": "横向或纵向时间轴",
            "safe_zone": (100, 100, 1400, 800),
            "elements": ["时间节点", "事件描述", "连接线"]
        },
        "data_visualization": {
            "name": "数据可视化布局",
            "structure": "图表为主，文字辅助",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "图表区域", "数据说明", "图例"]
        },
        "quote": {
            "name": "金句布局",
            "structure": "大面积留白，突出引用",
            "safe_zone": (200, 200, 1400, 700),
            "elements": ["引用文字", "来源", "装饰元素"]
        },
        "comparison": {
            "name": "对比布局",
            "structure": "左右或上下对比",
            "safe_zone": (100, 80, 1400, 820),
            "elements": ["标题", "对比项A", "对比项B", "VS标识"]
        }
    }
    
    def select_layout(self, content_analysis: dict) -> str:
        """根据内容分析选择最佳布局"""
        
        slide_type = content_analysis.get("type", "content")
        content_density = content_analysis.get("density", 5)  # CDI 0-10
        element_count = content_analysis.get("element_count", 3)
        
        # 决策逻辑
        if slide_type == "title_slide":
            return "title_slide"
        elif slide_type == "quote":
            return "quote"
        elif slide_type == "timeline":
            return "timeline"
        elif slide_type == "comparison":
            return "comparison"
        elif content_density >= 8:
            return "two_column"
        elif element_count <= 3 and content_density <= 3:
            return "center_radiation"
        elif 4 <= element_count <= 6:
            return "content_card"
        else:
            return "content_card"
```

### 5.2 布局参数计算

```python
class LayoutCalculator:
    """布局参数计算器"""
    
    CANVAS_WIDTH = 1600
    CANVAS_HEIGHT = 900
    
    SAFE_MARGIN = {
        "left": 100,
        "right": 100,
        "top": 50,
        "bottom": 100
    }
    
    @classmethod
    def calculate_card_layout(cls, card_count: int, style: str = "grid"):
        """计算卡片布局参数"""
        
        safe_width = cls.CANVAS_WIDTH - cls.SAFE_MARGIN["left"] - cls.SAFE_MARGIN["right"]
        safe_height = cls.CANVAS_HEIGHT - cls.SAFE_MARGIN["top"] - cls.SAFE_MARGIN["bottom"]
        
        if card_count == 2:
            card_width = (safe_width - 40) // 2
            card_height = safe_height - 100
            positions = [
                (cls.SAFE_MARGIN["left"], 130),
                (cls.SAFE_MARGIN["left"] + card_width + 40, 130)
            ]
        elif card_count == 3:
            card_width = (safe_width - 60) // 3
            card_height = safe_height - 100
            positions = [
                (cls.SAFE_MARGIN["left"], 130),
                (cls.SAFE_MARGIN["left"] + card_width + 30, 130),
                (cls.SAFE_MARGIN["left"] + (card_width + 30) * 2, 130)
            ]
        elif card_count == 4:
            card_width = (safe_width - 30) // 2
            card_height = (safe_height - 100 - 30) // 2
            positions = [
                (cls.SAFE_MARGIN["left"], 130),
                (cls.SAFE_MARGIN["left"] + card_width + 30, 130),
                (cls.SAFE_MARGIN["left"], 130 + card_height + 30),
                (cls.SAFE_MARGIN["left"] + card_width + 30, 130 + card_height + 30)
            ]
        else:
            card_width = min(400, (safe_width - (card_count - 1) * 30) // card_count)
            card_height = safe_height - 100
            positions = []
            for i in range(card_count):
                x = cls.SAFE_MARGIN["left"] + i * (card_width + 30)
                positions.append((x, 130))
        
        return {
            "card_width": card_width,
            "card_height": card_height,
            "positions": positions,
            "gap": 30
        }
```

---

## 六、配色方案生成实现

### 6.1 风格化配色库

```python
class ColorSchemeGenerator:
    """配色方案生成器"""
    
    STYLE_PALETTES = {
        "professional": {
            "name": "专业商务",
            "primary": "#165DFF",
            "secondary": "#364FC7",
            "accent": "#FF7D00",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#F7F8FA",
            "border": "#E5E6EB"
        },
        "creative": {
            "name": "创意活力",
            "primary": "#722ED1",
            "secondary": "#EB2F96",
            "accent": "#13C2C2",
            "background": "#FAFAFA",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#FFFFFF",
            "border": "#E5E6EB"
        },
        "minimal": {
            "name": "极简素雅",
            "primary": "#1D2129",
            "secondary": "#4E5969",
            "accent": "#165DFF",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#86909C",
            "card_bg": "#F7F8FA",
            "border": "#E5E6EB"
        },
        "tech": {
            "name": "科技未来",
            "primary": "#00B96B",
            "secondary": "#165DFF",
            "accent": "#FF7D00",
            "background": "#0D1117",
            "text": "#E6EDF3",
            "text_secondary": "#8B949E",
            "card_bg": "#161B22",
            "border": "#30363D"
        },
        "education": {
            "name": "教育培训",
            "primary": "#0FC6C2",
            "secondary": "#3491FA",
            "accent": "#F7BA1E",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#F7F8FA",
            "border": "#E5E6EB"
        },
        "finance": {
            "name": "金融财经",
            "primary": "#C49644",
            "secondary": "#1D2129",
            "accent": "#F53F3F",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#FAFAFA",
            "border": "#E5E6EB"
        },
        "nature": {
            "name": "自然生态",
            "primary": "#00B42A",
            "secondary": "#4E5969",
            "accent": "#FF7D00",
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": "#F7F8FA",
            "border": "#E5E6EB"
        }
    }
```

### 6.2 从主题色生成配色

```python
    @classmethod
    def generate_from_theme_color(cls, theme_color: str) -> dict:
        """从主题色生成完整配色方案"""
        
        import colorsys
        
        r, g, b = cls.hex_to_rgb(theme_color)
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        
        return {
            "primary": theme_color,
            "secondary": cls.adjust_lightness(theme_color, -0.15),
            "accent": cls.complementary_color(theme_color),
            "background": "#FFFFFF",
            "text": "#1D2129",
            "text_secondary": "#4E5969",
            "card_bg": cls.adjust_lightness(theme_color, 0.95),
            "border": cls.adjust_lightness(theme_color, 0.85),
            "gradient_start": theme_color,
            "gradient_end": cls.adjust_lightness(theme_color, -0.2)
        }
    
    @staticmethod
    def hex_to_rgb(hex_color: str) -> tuple:
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    @staticmethod
    def rgb_to_hex(r: int, g: int, b: int) -> str:
        return f"#{r:02X}{g:02X}{b:02X}"
    
    @classmethod
    def adjust_lightness(cls, hex_color: str, delta: float) -> str:
        import colorsys
        r, g, b = cls.hex_to_rgb(hex_color)
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        l = max(0, min(1, l + delta))
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        return cls.rgb_to_hex(int(r*255), int(g*255), int(b*255))
    
    @classmethod
    def complementary_color(cls, hex_color: str) -> str:
        import colorsys
        r, g, b = cls.hex_to_rgb(hex_color)
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        h = (h + 0.5) % 1.0
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        return cls.rgb_to_hex(int(r*255), int(g*255), int(b*255))
```

### 6.3 AI 驱动的配色生成

```python
class AIColorGenerator:
    """AI 驱动的配色生成"""
    
    COLOR_GENERATION_PROMPT = """
你是一位专业的色彩设计师。根据以下信息，生成一套适合 PPT 的配色方案。

## 输入信息
- 主题：{topic}
- 风格：{style}
- 情感基调：{mood}
- 参考色：{reference_color}（可选）

## 输出要求
生成 JSON 格式的配色方案：
```json
{{
  "name": "配色方案名称",
  "description": "配色设计理念说明",
  "colors": {{
    "primary": "#主色",
    "secondary": "#辅色",
    "accent": "#强调色",
    "background": "#背景色",
    "text": "#文字色",
    "text_secondary": "#次要文字色"
  }},
  "usage_guide": {{
    "primary": "用于标题、重要按钮、关键图形",
    "secondary": "用于副标题、次要元素",
    "accent": "用于强调、高亮、数据图表"
  }}
}}
```

## 设计原则
1. 主色与辅色要有明确的层次关系
2. 强调色要有足够的对比度
3. 文字与背景的对比度 ≥ 4.5:1
4. 整体配色要符合情感基调
"""

    async def generate_colors(
        self,
        topic: str,
        style: str = "professional",
        mood: str = "confident",
        reference_color: str = None
    ) -> dict:
        prompt = self.COLOR_GENERATION_PROMPT.format(
            topic=topic,
            style=style,
            mood=mood,
            reference_color=reference_color or "无"
        )
        response = await self.llm_client.generate(prompt)
        import json
        return json.loads(response["content"])
```

---

## 七、视觉元素设计实现

### 7.1 SVG 元素库

```python
class SVGElementLibrary:
    """SVG 视觉元素库"""
    
    DECORATIVE_ELEMENTS = {
        "dots_pattern": """
            <defs>
                <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1.5" fill="{color}" opacity="0.3"/>
                </pattern>
            </defs>
            <rect width="1600" height="900" fill="url(#dots)"/>
        """,
        
        "gradient_bg": """
            <defs>
                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:{start_color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:{end_color};stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="1600" height="900" fill="url(#bgGradient)"/>
        """,
        
        "corner_accent": """
            <path d="M0,0 L200,0 L0,200 Z" fill="{color}" opacity="0.1"/>
            <path d="M1600,900 L1400,900 L1600,700 Z" fill="{color}" opacity="0.1"/>
        """,
        
        "wave_decoration": """
            <path d="M0,800 Q400,750 800,800 T1600,800 L1600,900 L0,900 Z" 
                  fill="{color}" opacity="0.1"/>
        """,
        
        "geometric_shapes": """
            <circle cx="150" cy="150" r="80" fill="{color}" opacity="0.1"/>
            <rect x="1350" y="650" width="150" height="150" rx="20" 
                  fill="{color}" opacity="0.1" transform="rotate(15 1425 725)"/>
        """
    }
    
    ICONS = {
        "chart": """<svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="12" width="4" height="9" rx="1"/>
            <rect x="10" y="8" width="4" height="13" rx="1"/>
            <rect x="17" y="4" width="4" height="17" rx="1"/>
        </svg>""",
        
        "target": """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
        </svg>""",
        
        "lightbulb": """<svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
            <rect x="9" y="19" width="6" height="2" rx="1"/>
            <rect x="10" y="22" width="4" height="1" rx="0.5"/>
        </svg>"""
    }
```

### 7.2 智能元素生成

```python
class VisualElementGenerator:
    """视觉元素生成器"""
    
    def generate_title_slide(self, title: str, subtitle: str, colors: dict) -> str:
        svg = f'''<svg width="1600" height="900" viewBox="0 0 1600 900" 
                   xmlns="http://www.w3.org/2000/svg">
            
            <defs>
                <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:{colors["primary"]};stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:{colors["secondary"]};stop-opacity:1"/>
                </linearGradient>
            </defs>
            <rect width="1600" height="900" fill="url(#bgGrad)"/>
            
            <circle cx="1400" cy="200" r="300" fill="white" opacity="0.1"/>
            <circle cx="200" cy="700" r="200" fill="white" opacity="0.05"/>
            
            <text x="800" y="400" text-anchor="middle" 
                  font-family="Microsoft YaHei, Arial, sans-serif" 
                  font-size="72" font-weight="bold" fill="white">
                {title}
            </text>
            
            <text x="800" y="480" text-anchor="middle"
                  font-family="Microsoft YaHei, Arial, sans-serif"
                  font-size="28" fill="white" opacity="0.9">
                {subtitle}
            </text>
            
            <line x1="600" y1="550" x2="1000" y2="550" 
                  stroke="white" stroke-width="2" opacity="0.5"/>
            
        </svg>'''
        return svg
    
    def generate_content_slide(
        self,
        title: str,
        content_items: list,
        colors: dict,
        layout: str = "card"
    ) -> str:
        if layout == "card":
            return self._generate_card_layout(title, content_items, colors)
        elif layout == "two_column":
            return self._generate_two_column_layout(title, content_items, colors)
        else:
            return self._generate_simple_layout(title, content_items, colors)
```

### 7.3 AI 驱动的视觉设计

```python
class AIVisualDesigner:
    """AI 驱动的视觉设计"""
    
    SVG_DESIGN_PROMPT = """
# PPT页面SVG设计宗师

## 设计规范
- 比例规范: 严格遵循16:9 SVG viewBox="0 0 1600 900"
- 安全边际: 核心内容必须完整落于 100, 50, 1400, 800 安全区内
- 矢量原生: 仅使用SVG原生元素，零依赖外部字体/图片

## 配色方案
{colors}

## 页面类型: {slide_type}

## 页面内容
标题: {title}
内容: {content}

## 设计要求
1. 信息层级清晰，主次分明
2. 视觉焦点明确
3. 配色和谐，符合主题
4. 细节精致，对齐规范

请直接输出完整的 SVG 代码，不要包含任何解释或markdown标记。
"""

    async def design_slide(
        self,
        title: str,
        content: list,
        slide_type: str,
        colors: dict,
        style: str = "professional"
    ) -> str:
        prompt = self.SVG_DESIGN_PROMPT.format(
            colors=json.dumps(colors, ensure_ascii=False, indent=2),
            slide_type=slide_type,
            title=title,
            content=json.dumps(content, ensure_ascii=False)
        )
        
        response = await self.llm_client.generate(
            prompt=prompt,
            temperature=0.7,
            max_tokens=4000
        )
        
        svg_code = self._extract_svg(response["content"])
        svg_code = self._validate_and_fix_svg(svg_code)
        
        return svg_code
    
    def _extract_svg(self, content: str) -> str:
        import re
        match = re.search(r'<svg[^>]*>.*?</svg>', content, re.DOTALL)
        if match:
            return match.group(0)
        return content
    
    def _validate_and_fix_svg(self, svg_code: str) -> str:
        if 'viewBox="0 0 1600 900"' not in svg_code:
            svg_code = svg_code.replace('<svg', '<svg viewBox="0 0 1600 900"')
        if 'xmlns=' not in svg_code:
            svg_code = svg_code.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
        return svg_code
```

---

## 八、整合到 RabAiMind 的方案

### PPT 创意引擎

```python
class PPTCreativeEngine:
    """PPT 创意引擎 - 整合所有设计能力"""
    
    def __init__(self):
        self.color_generator = ColorSchemeGenerator()
        self.layout_strategy = LayoutStrategy()
        self.visual_generator = VisualElementGenerator()
        self.ai_designer = AIVisualDesigner()
    
    async def create_ppt(
        self,
        user_request: str,
        materials: list = None,
        style: str = "professional",
        theme_color: str = None
    ) -> dict:
        """创建 PPT"""
        
        # 1. 分析需求（使用 MiniMax M2.5 的交错思维）
        analysis = await self._analyze_request(user_request, materials)
        
        # 2. 生成配色方案
        if theme_color:
            colors = self.color_generator.generate_from_theme_color(theme_color)
        else:
            colors = self.color_generator.STYLE_PALETTES.get(style, 
                self.color_generator.STYLE_PALETTES["professional"])
        
        # 3. 规划幻灯片结构
        slides_plan = await self._plan_slides(analysis, colors)
        
        # 4. 逐页设计
        slides = []
        for slide_plan in slides_plan:
            layout = self.layout_strategy.select_layout(slide_plan)
            
            svg = await self.ai_designer.design_slide(
                title=slide_plan["title"],
                content=slide_plan["content"],
                slide_type=slide_plan["type"],
                colors=colors,
                style=style
            )
            
            slides.append({
                "svg": svg,
                "title": slide_plan["title"],
                "type": slide_plan["type"]
            })
        
        # 5. 质量检查和迭代
        quality_report = await self._quality_check(slides)
        
        if quality_report["needs_iteration"]:
            slides = await self._iterate_design(slides, quality_report)
        
        return {
            "slides": slides,
            "colors": colors,
            "quality_report": quality_report
        }
```

---

## 总结

| 能力 | 实现方式 | 关键技术 |
|------|---------|---------|
| **智能布局** | 规则引擎 + AI 决策 | CDI 密度评估、布局模板库、参数计算 |
| **配色生成** | 预设库 + AI 生成 | 色彩理论、HSL 转换、对比度计算 |
| **视觉元素** | SVG 元素库 + AI 设计 | 矢量图形、渐变、装饰元素 |
| **整体设计** | "SVG 设计宗师" Prompt | 三阶九律、四阶修炼、自我反思 |

这个框架的核心优势是**将设计知识编码为 Prompt**，让 AI 不仅能生成内容，还能**像专业设计师一样思考**。

---

## 参考资料

- [mcp-server-okppt 项目](https://github.com/NeekChaw/mcp-server-okppt)
- [SVG 设计宗师 Prompt 原文](file:///Users/guige876/tmp-github/mcp-server-okppt/mcp-server-okppt/src/mcp_server_okppt/prompts/prompt_svg2ppt.md)
