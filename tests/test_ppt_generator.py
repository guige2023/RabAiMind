# -*- coding: utf-8 -*-
"""
PPT Generator 核心模块测试

测试 ppt_generator.py 中的核心工具函数，包括：
- SVG 占位图生成
- HTML/URL 转义（XSS 防护）
- SSRF 防护验证
- 文本/颜色提取
- 占位图 SVG 生成

注意：由于 ppt_generator.py 在模块级别导入 pptx，
测试通过 importlib 延迟导入的方式避免依赖问题。

作者: QA Agent
日期: 2026-03-29
"""

import pytest
import os
import sys
import re
import base64
from unittest.mock import patch, MagicMock

# 添加项目根目录到 Python 路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# ─── 延迟导入避免 pptx 依赖问题 ──────────────────────────────────────────────
# ppt_generator.py 在模块顶层 import pptx，为避免测试环境缺少 pptx 报错，
# 使用 importlib 在函数内部按需导入，或直接用字符串方式读取源码测试独立函数。

# 直接测试顶层函数 svg_placeholder_xml（不依赖 pptx）
# 其定义位置在 ppt_generator.py 文件靠前部分，pptx import 之前
import importlib.util


def _load_pptgen_module():
    """延迟加载 ppt_generator 模块，失败时返回 None"""
    spec = importlib.util.find_spec("pptx")
    if spec is None:
        return None
    import src.services.ppt_generator as pg
    return pg


def _svg_placeholder_xml_from_source() -> str:
    """从源码提取 svg_placeholder_xml 函数定义并执行"""
    pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
    with open(pgt_path, encoding="utf-8") as f:
        src = f.read()

    # 提取函数定义（第一个函数，在文件开头）
    # 函数定义到下一个 class 或函数之前
    match = re.search(
        r'(def svg_placeholder_xml\([^)]*\)[^:]*?:.*?)(?=\nclass |\ndef [a-zA-Z])',
        src,
        re.DOTALL
    )
    if not match:
        return None

    func_src = match.group(1)

    # 创建隔离命名空间执行函数
    namespace = {}
    exec(func_src, namespace)
    return namespace["svg_placeholder_xml"]


# ─── 加载 svg_placeholder_xml ────────────────────────────────────────────────

# 优先从模块导入（成功时），否则从源码提取
try:
    import src.services.ppt_generator as pg_module
    svg_placeholder_xml = pg_module.svg_placeholder_xml
except Exception:
    svg_placeholder_xml = _svg_placeholder_xml_from_source()


# ─── 测试 svg_placeholder_xml ────────────────────────────────────────────────

class TestSvgPlaceholderXml:
    """SVG 占位图生成测试"""

    def test_svg_placeholder_xml_basic(self):
        """测试基本 SVG 占位图生成"""
        result = svg_placeholder_xml(
            slide_num=1,
            title="测试标题",
            bg_color="#1e3a5f",
            accent_color="#60a5fa",
            icon="📄"
        )

        # 验证是有效的 SVG XML
        assert "<svg xmlns=" in result
        assert "viewBox=\"0 0 1600 900\"" in result
        assert 'width="1600"' in result
        assert 'height="900"' in result

    def test_svg_placeholder_xml_title_truncation(self):
        """测试标题超过20字符时被截断"""
        long_title = "这是一段非常非常长的标题内容超过了限制"
        result = svg_placeholder_xml(
            slide_num=5,
            title=long_title,
            bg_color="#1e3a5f",
            accent_color="#60a5fa",
            icon="📊"
        )

        # 标题被截断，应该包含省略号
        assert "…" in result or "..." in result
        # 原始长标题不应完整出现
        assert long_title not in result

    def test_svg_placeholder_xml_short_title_unchanged(self):
        """测试短标题保持不变"""
        short_title = "短标题"
        result = svg_placeholder_xml(
            slide_num=1,
            title=short_title,
        )
        assert short_title in result

    def test_svg_placeholder_xml_custom_colors(self):
        """测试自定义颜色"""
        result = svg_placeholder_xml(
            slide_num=2,
            title="颜色测试",
            bg_color="#FF0000",
            accent_color="#00FF00",
            icon="🎨"
        )

        assert "#FF0000" in result
        assert "#00FF00" in result

    def test_svg_placeholder_xml_slide_number(self):
        """测试页码正确显示"""
        result = svg_placeholder_xml(
            slide_num=99,
            title="页码测试",
        )
        assert "99" in result
        assert "/ N" in result


# ─── 测试 XSS 防护 ───────────────────────────────────────────────────────────

class TestXSSEscaping:
    """HTML/URL 转义测试（XSS 防护）"""

    def setup_method(self):
        """每个测试前加载模块（避免 pptx 顶层导入问题）"""
        self.generator = None
        spec = importlib.util.find_spec("pptx")
        if spec is not None:
            try:
                import src.services.ppt_generator as pg
                self.generator = pg.PPTGenerator()
            except Exception:
                self.generator = None

    def _create_escape_test_instance(self):
        """从源码创建带 _escape_html/_escape_url 的测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        # 提取 PPTGenerator 类（包含 escape 方法）
        # 找到类定义的起点
        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)

        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def test_escape_html_basic(self):
        """测试基本 HTML 转义"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        assert gen._escape_html("<script>") == "&lt;script&gt;"
        assert gen._escape_html("a<b>c") == "a&lt;b&gt;c"

    def test_escape_html_quotes(self):
        """测试引号转义"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        assert gen._escape_html('a"b') == "a&quot;b"
        assert gen._escape_html("a'b") == "&#39;a&#39;b" or gen._escape_html("a'b") == "a&#39;b"

    def test_escape_html_ampersand(self):
        """测试 & 符号转义"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        assert gen._escape_html("a&b") == "a&amp;b"

    def test_escape_html_backtick_backslash(self):
        """测试反引号和反斜杠转义"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        assert gen._escape_html("`test`") == "&#96;test&#96;"
        assert gen._escape_html("\\test\\") == "&#92;test&#92;"

    def test_escape_html_empty(self):
        """测试空字符串"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        assert gen._escape_html("") == ""

    def test_escape_url_basic(self):
        """测试 URL 基本转义"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        result = gen._escape_url("https://example.com?a=1&b=2")
        assert "&amp;" in result
        assert "https://example.com" in result

    def test_escape_url_quotes(self):
        """测试 URL 引号转义"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        assert gen._escape_url('test"quote') == "test&quot;quote"
        assert gen._escape_url("test'quote") == "test&#39;quote"

    def test_escape_url_brackets(self):
        """测试 URL 括号转义"""
        gen = self.generator or self._create_escape_test_instance()
        if gen is None:
            pytest.skip("pptx not available and class source parse failed")

        assert gen._escape_url("<script>") == "&lt;script&gt;"
        assert gen._escape_url("a>b") == "a&gt;b"


# ─── 测试 SSRF 防护 ─────────────────────────────────────────────────────────

class TestSSRFProtection:
    """SSRF 攻击防护测试"""

    def _create_validator_instance(self):
        """从源码创建带 _validate_url 的测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        # 提取 PPTGenerator 类
        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)
        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def setup_method(self):
        self.generator = None
        spec = importlib.util.find_spec("pptx")
        if spec is not None:
            try:
                import src.services.ppt_generator as pg
                self.generator = pg.PPTGenerator()
            except Exception:
                self.generator = None

    def _get_validator(self):
        if self.generator:
            return self.generator
        return self._create_validator_instance()

    def test_ssrf_reject_http(self):
        """拒绝非 HTTPS URL"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("http://evil.com/image.jpg") is False

    def test_ssrf_reject_ftp(self):
        """拒绝 FTP 协议"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("ftp://files.server.com") is False

    def test_ssrf_reject_file_protocol(self):
        """拒绝 file:// 协议"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("file:///etc/passwd") is False

    def test_ssrf_reject_localhost(self):
        """拒绝 localhost"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://localhost/image.jpg") is False

    def test_ssrf_reject_private_ip_10(self):
        """拒绝 10.x.x.x 内网 IP"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://10.0.0.1/image.jpg") is False
        assert gen._validate_url("https://10.255.255.255/image.jpg") is False

    def test_ssrf_reject_private_ip_172(self):
        """拒绝 172.16.x.x - 172.31.x.x 内网 IP"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://172.16.0.1/image.jpg") is False
        assert gen._validate_url("https://172.31.255.255/image.jpg") is False

    def test_ssrf_reject_private_ip_192(self):
        """拒绝 192.168.x.x 内网 IP"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://192.168.1.1/image.jpg") is False
        assert gen._validate_url("https://192.168.0.100/image.jpg") is False

    def test_ssrf_reject_loopback(self):
        """拒绝回环地址"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://127.0.0.1/image.jpg") is False

    def test_ssrf_reject_link_local(self):
        """拒绝链路本地地址"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://169.254.0.1/image.jpg") is False

    def test_ssrf_reject_multicast(self):
        """拒绝多播地址"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://224.0.0.1/image.jpg") is False

    @patch("socket.getaddrinfo")
    def test_ssrf_accept_public_ip(self, mock_getaddrinfo):
        """接受公共 IP"""
        mock_getaddrinfo.return_value = [(2, 1, 6, "", ("8.8.8.8", 0))]
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://8.8.8.8/image.jpg") is True

    @patch("socket.getaddrinfo")
    def test_ssrf_accept_valid_https(self, mock_getaddrinfo):
        """接受有效的 HTTPS URL（mock DNS）"""
        mock_getaddrinfo.return_value = [
            (2, 1, 6, "", ("151.101.1.140", 0))
        ]
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        result = gen._validate_url(
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"
        )
        assert result is True

    def test_ssrf_local_domain(self):
        """拒绝 .local 等内网域名"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("https://server.local/image.jpg") is False
        assert gen._validate_url("https://machine.corp/image.jpg") is False

    def test_ssrf_invalid_url(self):
        """无效 URL 返回 False"""
        gen = self._get_validator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._validate_url("not-a-url-at-all") is False
        assert gen._validate_url("") is False


# ─── 测试 SVG 文本提取 ──────────────────────────────────────────────────────

class TestSvgTextExtraction:
    """SVG 文本提取功能测试"""

    def _create_extractor_instance(self):
        """从源码创建测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)
        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def setup_method(self):
        self.generator = None
        spec = importlib.util.find_spec("pptx")
        if spec is not None:
            try:
                import src.services.ppt_generator as pg
                self.generator = pg.PPTGenerator()
            except Exception:
                self.generator = None

    def _get_extractor(self):
        if self.generator:
            return self.generator
        return self._create_extractor_instance()

    def test_extract_image_url_unsplash(self):
        """测试从 SVG 提取 Unsplash 图片 URL"""
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <image href="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"/>
</svg>'''
        gen = self._get_extractor()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        url = gen._extract_image_url(svg)
        assert url is not None
        assert "unsplash" in url

    def test_extract_image_url_with_xlink(self):
        """测试从 SVG 提取 xlink:href 图片 URL"""
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <image xlink:href="https://example.com/image.jpg" width="1600" height="900"/>
</svg>'''
        gen = self._get_extractor()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        url = gen._extract_image_url(svg)
        assert url is not None
        assert "example.com" in url

    def test_extract_image_url_no_image(self):
        """SVG 中无图片时返回 None"""
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <text>Test</text>
</svg>'''
        gen = self._get_extractor()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        url = gen._extract_image_url(svg)
        assert url is None

    def test_extract_svg_background_color_from_rect(self):
        """从 SVG rect fill 属性提取背景色"""
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#1e3a5f"/>
</svg>'''
        gen = self._get_extractor()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        color = gen._extract_svg_background_color(svg)
        assert color is not None
        assert color.lower() == "1e3a5f"

    def test_extract_svg_background_color_from_gradient(self):
        """从 SVG 渐变 stop-color 提取背景色"""
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad">
      <stop offset="0%" style="stop-color:#165DFF"/>
      <stop offset="100%" style="stop-color:#0D47E8"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bgGrad)"/>
</svg>'''
        gen = self._get_extractor()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        color = gen._extract_svg_background_color(svg)
        assert color is not None

    def test_extract_text_from_svg_with_tspan(self):
        """从带 tspan 的 SVG 提取文本"""
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <text x="800" y="100" text-anchor="middle" fill="white" font-size="52">
    <tspan>主标题</tspan>
  </text>
  <text x="100" y="400" text-anchor="middle" fill="white" font-size="28">
    <tspan>内容要点1</tspan>
  </text>
  <text x="1550" y="870" text-anchor="end">99</text>
</svg>'''
        gen = self._get_extractor()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        title, contents = gen._extract_text_from_svg(svg)
        assert title != ""
        for c in contents:
            assert not re.match(r"^\d+$", c)

    def test_extract_text_from_svg_filters_page_numbers(self):
        """SVG 文本提取应过滤页码"""
        svg = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <text x="800" y="100">实际标题</text>
  <text x="1550" y="870">42</text>
  <text x="50" y="880">RabAi Mind</text>
</svg>'''
        gen = self._get_extractor()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        title, contents = gen._extract_text_from_svg(svg)
        assert "42" not in contents
        assert "RabAi Mind" not in contents


# ─── 测试颜色工具函数 ───────────────────────────────────────────────────────

class TestColorUtils:
    """颜色工具函数测试"""

    def _create_color_instance(self):
        """从源码创建测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)
        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def setup_method(self):
        self.generator = None
        spec = importlib.util.find_spec("pptx")
        if spec is not None:
            try:
                import src.services.ppt_generator as pg
                self.generator = pg.PPTGenerator()
            except Exception:
                self.generator = None

    def _get_color_tool(self):
        if self.generator:
            return self.generator
        return self._create_color_instance()

    def test_hex_to_rgb_valid(self):
        """测试有效十六进制颜色转换"""
        gen = self._get_color_tool()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        rgb = gen._hex_to_rgb("#165DFF")
        assert rgb.red == 0x16
        assert rgb.green == 0x5D
        assert rgb.blue == 0xFF

    def test_hex_to_rgb_without_hash(self):
        """测试无 # 前缀的颜色转换"""
        gen = self._get_color_tool()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        rgb = gen._hex_to_rgb("FF0000")
        assert rgb.red == 255
        assert rgb.green == 0
        assert rgb.blue == 0

    def test_hex_to_rgb_invalid(self):
        """测试无效颜色返回黑色"""
        gen = self._get_color_tool()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        rgb = gen._hex_to_rgb("invalid")
        assert rgb.red == 0
        assert rgb.green == 0
        assert rgb.blue == 0

    def test_hex_to_rgb_short_string(self):
        """测试过短颜色字符串"""
        gen = self._get_color_tool()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        rgb = gen._hex_to_rgb("#12")
        assert rgb.red == 0
        assert rgb.green == 0
        assert rgb.blue == 0


# ─── 测试占位图 SVG 生成 ────────────────────────────────────────────────────

class TestSvgPlaceholder:
    """SVG 占位图生成测试"""

    def _create_placeholder_instance(self):
        """从源码创建测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)
        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def setup_method(self):
        self.generator = None
        spec = importlib.util.find_spec("pptx")
        if spec is not None:
            try:
                import src.services.ppt_generator as pg
                self.generator = pg.PPTGenerator()
            except Exception:
                self.generator = None

    def _get_placeholder(self):
        if self.generator:
            return self.generator
        return self._create_placeholder_instance()

    def test_generate_svg_placeholder_content_type(self):
        """测试内容页占位图生成"""
        gen = self._get_placeholder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        slide = {"title": "内容页测试", "slide_type": "content"}
        result = gen._generate_svg_placeholder(slide, 1)
        assert result.startswith("data:image/svg+xml;base64,")

    def test_generate_svg_placeholder_title_type(self):
        """测试封面页占位图生成"""
        gen = self._get_placeholder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        slide = {"title": "封面标题", "slide_type": "title"}
        result = gen._generate_svg_placeholder(slide, 1)
        assert result.startswith("data:image/svg+xml;base64,")

    def test_generate_svg_placeholder_thank_you_type(self):
        """测试尾页占位图生成"""
        gen = self._get_placeholder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        slide = {"title": "感谢页", "slide_type": "thank_you"}
        result = gen._generate_svg_placeholder(slide, 10)
        assert result.startswith("data:image/svg+xml;base64,")

    def test_generate_svg_placeholder_base64_decodes(self):
        """测试生成的 Base64 可以正确解码"""
        gen = self._get_placeholder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        slide = {"title": "解码测试", "slide_type": "content"}
        result = gen._generate_svg_placeholder(slide, 5)
        assert result.startswith("data:image/svg+xml;base64,")

        b64_data = result.replace("data:image/svg+xml;base64,", "")
        decoded = base64.b64decode(b64_data).decode("utf-8")
        assert "<svg" in decoded
        assert "解码测试" in decoded

    def test_generate_svg_placeholder_escapes_title(self):
        """测试占位图标题被正确转义（XSS防护）"""
        gen = self._get_placeholder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        slide = {"title": "<script>alert('xss')</script>", "slide_type": "content"}
        result = gen._generate_svg_placeholder(slide, 1)

        b64_data = result.replace("data:image/svg+xml;base64,", "")
        decoded = base64.b64decode(b64_data).decode("utf-8")
        # XSS payload 已被转义
        assert "<script>" not in decoded
        assert "&lt;script&gt;" in decoded


# ─── 测试中文翻译 ────────────────────────────────────────────────────────────

class TestChineseTranslation:
    """中文关键词翻译测试"""

    def _create_translator_instance(self):
        """从源码创建测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)
        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def setup_method(self):
        self.generator = None
        spec = importlib.util.find_spec("pptx")
        if spec is not None:
            try:
                import src.services.ppt_generator as pg
                self.generator = pg.PPTGenerator()
            except Exception:
                self.generator = None

    def _get_translator(self):
        if self.generator:
            return self.generator
        return self._create_translator_instance()

    def test_translate_business_keywords(self):
        """测试商务类关键词翻译"""
        gen = self._get_translator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._translate_to_english("商业发展") == "business"
        assert gen._translate_to_english("企业管理") == "management"
        assert gen._translate_to_english("公司战略") == "corporate"

    def test_translate_tech_keywords(self):
        """测试科技类关键词翻译"""
        gen = self._get_translator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._translate_to_english("技术创新") == "innovation"
        assert gen._translate_to_english("AI人工智能") == "technology"

    def test_translate_education_keywords(self):
        """测试教育类关键词翻译"""
        gen = self._get_translator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        assert gen._translate_to_english("教学培训") == "training"
        assert gen._translate_to_english("学习资料") == "learning"

    def test_translate_no_match(self):
        """无匹配时返回原文"""
        gen = self._get_translator()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        result = gen._translate_to_english("完全未知文本XYZ")
        assert result == "完全未知文本XYZ"


# ─── 测试 Prompt 构建 ────────────────────────────────────────────────────────

class TestPromptBuilding:
    """AI Prompt 构建测试"""

    def _create_prompt_instance(self):
        """从源码创建测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)
        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def setup_method(self):
        self.generator = None
        spec = importlib.util.find_spec("pptx")
        if spec is not None:
            try:
                import src.services.ppt_generator as pg
                self.generator = pg.PPTGenerator()
            except Exception:
                self.generator = None

    def _get_prompt_builder(self):
        if self.generator:
            return self.generator
        return self._create_prompt_instance()

    def test_build_image_prompt_title_slide(self):
        """测试封面页图片提示词"""
        gen = self._get_prompt_builder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        prompt = gen._build_image_prompt(
            title="产品发布会",
            content=[],
            slide_type="title"
        )
        assert "business" in prompt.lower() or "professional" in prompt.lower()

    def test_build_image_prompt_content_slide(self):
        """测试内容页图片提示词"""
        gen = self._get_prompt_builder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        prompt = gen._build_image_prompt(
            title="市场分析",
            content=["增长趋势", "竞争对手", "用户画像"],
            slide_type="content"
        )
        assert len(prompt) > 0
        assert "16:9" in prompt

    def test_build_svg_prompt_title_page(self):
        """测试 SVG 封面提示词"""
        gen = self._get_prompt_builder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        slide = {
            "title": "年度报告",
            "subtitle": "2026",
            "image_url": "",
            "slide_type": "title"
        }
        prompt = gen._build_svg_prompt(slide, 1)
        assert "年度报告" in prompt
        assert "封面页" in prompt

    def test_build_svg_prompt_content_page(self):
        """测试 SVG 内容页提示词"""
        gen = self._get_prompt_builder()
        if gen is None:
            pytest.skip("Cannot load PPTGenerator")
        slide = {
            "title": "核心要点",
            "content": ["要点一", "要点二", "要点三"],
            "image_url": "",
            "slide_type": "content"
        }
        prompt = gen._build_svg_prompt(slide, 2)
        assert "核心要点" in prompt
        assert "内容页" in prompt


# ─── 测试 PPTGenerator 初始化 ───────────────────────────────────────────────

class TestPPTGeneratorInit:
    """PPTGenerator 初始化测试"""

    def _create_instance(self):
        """从源码创建测试对象"""
        pgt_path = os.path.join(PROJECT_ROOT, "src", "services", "ppt_generator.py")
        with open(pgt_path, encoding="utf-8") as f:
            src = f.read()

        class_match = re.search(
            r'(class PPTGenerator:.*?)((?=^class |\n_ppt_generator|\Z))',
            src,
            re.DOTALL | re.MULTILINE
        )
        if not class_match:
            return None

        class_src = "from pptx.dml.color import RGBColor\n" + class_match.group(1)
        namespace = {}
        try:
            exec(class_src, namespace)
            return namespace["PPTGenerator"]()
        except Exception:
            return None

    def test_generator_init_creates_instance(self):
        """测试初始化"""
        spec = importlib.util.find_spec("pptx")
        if spec is None:
            gen = self._create_instance()
            if gen is None:
                pytest.skip("Cannot create PPTGenerator from source")
        else:
            try:
                import src.services.ppt_generator as pg
                gen = pg.PPTGenerator()
            except Exception:
                gen = self._create_instance()
                if gen is None:
                    pytest.skip("Cannot create PPTGenerator")

        assert gen._image_failure_count == 0
        assert gen._image_failure_threshold == 3

    def test_generator_init_thread_lock(self):
        """测试初始化包含线程锁"""
        spec = importlib.util.find_spec("pptx")
        if spec is None:
            gen = self._create_instance()
            if gen is None:
                pytest.skip("Cannot create PPTGenerator from source")
        else:
            try:
                import src.services.ppt_generator as pg
                gen = pg.PPTGenerator()
            except Exception:
                gen = self._create_instance()
                if gen is None:
                    pytest.skip("Cannot create PPTGenerator")

        import threading
        assert isinstance(gen._layout_lock, threading.Lock)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
