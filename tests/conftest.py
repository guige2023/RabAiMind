"""
Pytest 配置和 fixtures

作者: QA Agent
日期: 2026-03-17
"""

import os
import sys
import pytest
from typing import Generator

# 添加项目根目录到 Python 路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


# ==================== Fixtures ====================

@pytest.fixture
def api_base_url() -> str:
    """获取 API 基础 URL"""
    return os.environ.get("API_BASE_URL", "http://localhost:8000")


@pytest.fixture
def test_request_data() -> dict:
    """获取测试用请求数据"""
    return {
        "user_request": "创建一个关于人工智能发展趋势的演示文稿",
        "slide_count": 10,
        "scene": "tech",
        "style": "professional",
        "template": "default"
    }


@pytest.fixture
def minimal_request_data() -> dict:
    """获取最小请求数据"""
    return {
        "user_request": "测试需求",
        "slide_count": 5
    }


@pytest.fixture
def output_dir(tmp_path) -> Generator[str, None, None]:
    """创建临时输出目录"""
    output = tmp_path / "output"
    output.mkdir()
    yield str(output)


@pytest.fixture
def mock_volcano_response() -> dict:
    """模拟火山引擎响应"""
    return {
        "slides": [
            {
                "title": "人工智能发展趋势",
                "content": "人工智能技术正在快速发展...",
                "type": "title"
            },
            {
                "title": "行业现状",
                "content": "当前AI技术在各行业的应用...",
                "type": "content"
            }
        ]
    }


@pytest.fixture
def mock_svg_content() -> str:
    """模拟 SVG 内容"""
    return """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#FFFFFF"/>
  <text x="800" y="450" text-anchor="middle" font-size="48">测试标题</text>
</svg>"""


# ==================== Pytest Hooks ====================

def pytest_configure(config):
    """Pytest 配置钩子"""
    # 注册自定义标记
    config.addinivalue_line("markers", "unit: 单元测试")
    config.addinivalue_line("markers", "integration: 集成测试")
    config.addinivalue_line("markers", "api: API 测试")
    config.addinivalue_line("markers", "slow: 耗时测试")


def pytest_collection_modifyitems(config, items):
    """修改测试用例收集"""
    for item in items:
        # 为包含 api 的测试添加标记
        if "api" in item.nodeid.lower():
            item.add_marker(pytest.mark.api)

        # 为包含 integration 的测试添加标记
        if "integration" in item.nodeid.lower():
            item.add_marker(pytest.mark.integration)
