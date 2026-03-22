#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
RabAi Mind Agent 单元测试

测试各个 Agent 的功能

作者: QA Agent
日期: 2026-03-17
"""

import os
import sys
import pytest
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any

# 添加项目根目录到 Python 路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


# ==================== 测试用例 ====================

class TestVolcanoAgent:
    """火山引擎 Agent 测试"""

    @pytest.fixture
    def agent(self):
        """创建 Agent 实例"""
        from agents.volcano_agent import VolcanoAgent
        config = {
            "api_key": "test-key",
            "endpoint": "https://test.volces.com/api/v3",
            "model": "test-model"
        }
        return VolcanoAgent(config)

    def test_agent_initialization(self, agent):
        """测试 Agent 初始化"""
        assert agent is not None
        assert agent.api_key == "test-key"

    def test_generate_presentation_with_mock(self, agent, mock_volcano_response):
        """测试内容生成 (Mock)"""
        with patch.object(agent, '_call_api', return_value=mock_volcano_response):
            slides = agent.generate_presentation(
                user_request="测试需求",
                slide_count=5,
                scene="tech",
                style="professional"
            )

            assert len(slides) == 2
            assert slides[0]["title"] == "人工智能发展趋势"

    def test_validate_request_empty(self, agent):
        """测试空请求验证"""
        with pytest.raises(ValueError):
            agent.generate_presentation(user_request="", slide_count=10)

    def test_validate_request_too_short(self, agent):
        """测试请求过短验证"""
        with pytest.raises(ValueError):
            agent.generate_presentation(user_request="短", slide_count=10)


class TestSVGAgent:
    """SVG Agent 测试"""

    @pytest.fixture
    def agent(self):
        """创建 Agent 实例"""
        from agents.svg_agent import SVGAgent
        config = {
            "template_dir": "./templates",
            "output_dir": "./output"
        }
        return SVGAgent(config)

    def test_agent_initialization(self, agent):
        """测试 Agent 初始化"""
        assert agent is not None
        assert agent.template_dir == "./templates"

    def test_render_slides_with_mock(self, agent, mock_svg_content):
        """测试幻灯片渲染 (Mock)"""
        slides = [
            {"title": "测试1", "content": "内容1"},
            {"title": "测试2", "content": "内容2"}
        ]

        with patch.object(agent, '_render_slide', return_value=mock_svg_content):
            rendered = agent.render_slides(slides)
            assert len(rendered) == 2
            assert "svg_content" in rendered[0]


class TestOkPPTAgent:
    """OkPPT Agent 测试"""

    @pytest.fixture
    def agent(self):
        """创建 Agent 实例"""
        from agents.okppt_agent import OkPPTAgent
        config = {
            "output_dir": "./output"
        }
        return OkPPTAgent(config)

    def test_agent_initialization(self, agent):
        """测试 Agent 初始化"""
        assert agent is not None
        assert agent.output_dir == "./output"


class TestQualityAgent:
    """质量检查 Agent 测试"""

    @pytest.fixture
    def agent(self):
        """创建 Agent 实例"""
        from agents.quality_agent import QualityAgent
        return QualityAgent()

    def test_agent_initialization(self, agent):
        """测试 Agent 初始化"""
        assert agent is not None

    def test_validate_svg_valid(self, agent, mock_svg_content):
        """测试有效 SVG 验证"""
        report = agent.validate_svg(mock_svg_content)
        assert report is not None

    def test_validate_svg_empty(self, agent):
        """测试空 SVG 验证"""
        report = agent.validate_svg("")
        assert report is not None


class TestCoordinatorAgent:
    """协调 Agent 测试"""

    @pytest.fixture
    def agent(self):
        """创建 Agent 实例"""
        from agents.coordinator_agent import CoordinatorAgent
        config = {
            "max_steps": 10,
            "workspace_dir": "./workspace"
        }
        return CoordinatorAgent(config)

    def test_agent_initialization(self, agent):
        """测试 Agent 初始化"""
        assert agent is not None
        assert agent.max_steps == 10


# ==================== 集成测试 ====================

@pytest.mark.integration
class TestIntegration:
    """集成测试"""

    def test_full_generation_flow(self, api_base_url, test_request_data):
        """测试完整生成流程"""
        import requests

        # 跳过如果服务未运行
        try:
            response = requests.get(f"{api_base_url}/health", timeout=5)
            if response.status_code != 200:
                pytest.skip("API 服务未运行")
        except Exception:
            pytest.skip("API 服务未运行")

        # 提交任务
        response = requests.post(
            f"{api_base_url}/api/v1/generate",
            json=test_request_data,
            timeout=10
        )

        assert response.status_code in [200, 202]
        data = response.json()
        assert data.get("success") is True
        assert "task_id" in data


# ==================== 运行测试 ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
