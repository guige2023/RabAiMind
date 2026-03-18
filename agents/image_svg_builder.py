"""
支持图片的SVG Builder扩展
添加图文结合的幻灯片布局
"""
from agents.svg_agent import SVGBuilder, SVGStyle, SVGConfig


class ImageSVGBuilder(SVGBuilder):
    """支持图片的SVG构建器"""
    
    def build_content_with_image(
        self,
        title: str,
        content: List[str],
        image_url: Optional[str] = None,
        image_prompt: Optional[str] = None,
        layout: str = "right",  # "right": 文字在左图片在右, "bottom": 文字在上图片在下
        style: Optional[SVGStyle] = None
    ) -> str:
        """
        构建图文结合的幻灯片
        
        Args:
            title: 标题
            content: 内容列表
            image_url: 图片URL（如果已有）
            image_prompt: 图片提示词（用于生成）
            layout: 布局方式 right/bottom
            style: 风格
        """
        if style:
            self.set_style(style)
            
        colors = self.get_colors()
        width, height = self.config.width, self.config.height
        
        if layout == "right":
            return self._build_layout_right(title, content, colors, width, height)
        else:
            return self._build_layout_bottom(title, content, colors, width, height)
    
    def _build_layout_right(
        self,
        title: str,
        content: List[str],
        colors: dict,
        width: int,
        height: int
    ) -> str:
        """右侧图片布局 - 文字左，图片右"""
        
        # 文字区域宽度占比
        text_width = int(width * 0.55)
        image_x = int(width * 0.58)
        image_width = int(width * 0.38)
        image_height = int(height * 0.5)
        
        from datetime import datetime
        now_str = datetime.now().strftime("%Y-%m-%d")
        
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.config.viewbox}" width="{width}" height="{height}">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:{colors['primary']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{colors['secondary']};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{colors['background']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F8F9FA;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="url(#bgGradient)" />

  <!-- 装饰背景 -->
  <circle cx="{width-100}" cy="150" r="180" fill="{colors['secondary']}" opacity="0.05" />
  <rect x="0" y="{height-60}" width="{width}" height="60" fill="{colors['primary']}" opacity="0.03" />

  <!-- 顶部标题栏 -->
  <rect x="0" y="0" width="{width}" height="90" fill="url(#headerGradient)" />
  <rect x="0" y="85" width="{width}" height="5" fill="{colors['accent']}" />

  <!-- 标题 -->
  <text x="50" y="60"
        font-family="{self.config.font_family}"
        font-size="38"
        font-weight="bold"
        fill="#FFFFFF">{self._escape_xml(title)}</text>

  <!-- 左侧装饰线 -->
  <rect x="0" y="0" width="8" height="90" fill="{colors['accent']}" />

  <!-- 文字区域 -->
  <g transform="translate(50, 120)">'''
        
        # 生成内容项
        for i, item in enumerate(content[:5]):  # 最多5个要点
            y_pos = i * 100
            accent = [colors['primary'], colors['secondary'], colors['accent'], '#27AE60', '#8E44AD'][i % 5]
            
            svg += f'''
    <!-- 要点 {i+1} -->
    <g>
      <circle cx="20" cy="{y_pos + 20}" r="12" fill="{accent}" />
      <text x="45" y="{y_pos + 28}" font-family="{self.config.font_family}" font-size="20" font-weight="bold" fill="{colors['text']}">{i+1}</text>
      <text x="80" y="{y_pos + 28}" font-family="{self.config.font_family}" font-size="18" fill="{colors['text']}" xml:space="preserve">{self._escape_xml(item[:60])}</text>
    </g>'''
        
        svg += '''
  </g>
  
  <!-- 图片区域 -->
  <g transform="translate({}, {})">
    <rect x="0" y="0" width="{}" height="{}" rx="12" fill="#F0F0F0" filter="url(#shadow)" />
    <text x="{}" y="{}" font-family="Arial" font-size="24" fill="#999999" text-anchor="middle">🖼️ AI Generated Image</text>
  </g>
</svg>'''.format(
            image_x, height * 0.25,
            image_width, image_height,
            image_width // 2, image_height // 2
        )
        
        return svg
    
    def _build_layout_bottom(
        self,
        title: str,
        content: List[str],
        colors: dict,
        width: int,
        height: int
    ) -> str:
        """底部图片布局 - 文字在上，图片在下"""
        
        content_height = int(height * 0.45)
        image_y = int(height * 0.48)
        image_height = int(height * 0.45)
        
        from datetime import datetime
        now_str = datetime.now().strftime("%Y-%m-%d")
        
        svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{self.config.viewbox}" width="{width}" height="{height}">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:{colors['primary']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{colors['secondary']};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{colors['background']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F8F9FA;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="{width}" height="{height}" fill="url(#bgGradient)" />

  <!-- 顶部标题栏 -->
  <rect x="0" y="0" width="{width}" height="90" fill="url(#headerGradient)" />
  <rect x="0" y="85" width="{width}" height="5" fill="{colors['accent']}" />

  <!-- 标题 -->
  <text x="50" y="60"
        font-family="{self.config.font_family}"
        font-size="38"
        font-weight="bold"
        fill="#FFFFFF">{self._escape_xml(title)}</text>

  <!-- 左侧装饰线 -->
  <rect x="0" y="0" width="8" height="90" fill="{colors['accent']}" />

  <!-- 文字区域 -->
  <g transform="translate(50, 120)">'''
        
        # 生成内容项
        for i, item in enumerate(content[:4]):
            y_pos = i * 70
            accent = [colors['primary'], colors['secondary'], colors['accent'], '#27AE60'][i % 4]
            
            svg += f'''
    <g>
      <circle cx="20" cy="{y_pos + 15}" r="10" fill="{accent}" />
      <text x="45" y="{y_pos + 22}" font-family="{self.config.font_family}" font-size="18" font-weight="bold" fill="{colors['text']}">•</text>
      <text x="65" y="{y_pos + 22}" font-family="{self.config.font_family}" font-size="16" fill="{colors['text']}" xml:space="preserve">{self._escape_xml(item[:70])}</text>
    </g>'''
        
        svg += f'''
  </g>
  
  <!-- 图片区域 -->
  <g transform="translate(50, {image_y})">
    <rect x="0" y="0" width="{width-100}" height="{image_height}" rx="12" fill="#F0F0F0" filter="url(#shadow)" />
    <text x="{(width-100)//2}" y="{image_height//2}" font-family="Arial" font-size="24" fill="#999999" text-anchor="middle">🖼️ AI Generated Image</text>
  </g>
</svg>'''
        
        return svg


# 创建全局实例
image_svg_builder = ImageSVGBuilder()


def get_image_svg_builder() -> ImageSVGBuilder:
    """获取图片SVG构建器"""
    return image_svg_builder
