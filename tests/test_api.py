#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
RabAi Mind 自动化测试脚本

功能:
- 接口自动化测试
- 任务流程测试
- 异常场景测试

作者: QA Agent
日期: 2026-03-17
"""

import os
import sys
import time
import json
import unittest
import requests
from typing import Dict, Any, Optional
from datetime import datetime

# 添加项目根目录到路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


# ==================== 配置 ====================

# API 基础地址
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")

# 请求超时时间
REQUEST_TIMEOUT = 30

# 测试超时时间
GENERATION_TIMEOUT = 180


# ==================== 工具函数 ====================

def format_response(response: requests.Response) -> str:
    """格式化响应用于日志"""
    try:
        data = response.json()
        return json.dumps(data, ensure_ascii=False, indent=2)
    except Exception:
        return response.text


class APIClient:
    """API 客户端封装"""

    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        timeout: int = REQUEST_TIMEOUT
    ) -> requests.Response:
        """发送请求"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                timeout=timeout
            )
            return response
        except requests.exceptions.Timeout:
            raise Exception(f"请求超时: {url}")
        except requests.exceptions.ConnectionError:
            raise Exception(f"连接失败: {url}")
        except Exception as e:
            raise Exception(f"请求异常: {str(e)}")

    def generate_ppt(self, user_request: str, **options) -> Dict:
        """提交 PPT 生成任务"""
        data = {
            "user_request": user_request,
            **options
        }
        response = self._request("POST", "/api/v1/generate", data)
        return response

    def get_task_status(self, task_id: str) -> Dict:
        """查询任务状态"""
        response = self._request("GET", f"/api/v1/task/{task_id}")
        return response

    def cancel_task(self, task_id: str) -> Dict:
        """取消任务"""
        response = self._request("POST", f"/api/v1/task/{task_id}/cancel")
        return response

    def download_ppt(self, task_id: str) -> bytes:
        """下载 PPT 文件"""
        url = f"{self.base_url}/api/v1/download/{task_id}"
        response = self.session.get(url, timeout=120)
        return response.content


# ==================== 测试用例 ====================

class TestHealthCheck(unittest.TestCase):
    """健康检查测试"""

    def setUp(self):
        """测试前置设置"""
        self.client = APIClient()

    def test_health_check(self):
        """测试健康检查接口"""
        response = self.client._request("GET", "/health")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")


class TestPPTGeneration(unittest.TestCase):
    """PPT 生成测试"""

    def setUp(self):
        """测试前置设置"""
        self.client = APIClient()

    def test_generate_ppt_success(self):
        """测试正常生成 PPT (TC-GEN-001)"""
        # 提交生成任务
        response = self.client.generate_ppt(
            user_request="创建一个关于人工智能发展趋势的演示文稿",
            slide_count=10,
            scene="tech",
            style="professional"
        )

        self.assertEqual(response.status_code, 202)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIsNotNone(data.get("task_id"))

        # 轮询任务状态
        task_id = data["task_id"]
        max_attempts = GENERATION_TIMEOUT // 5

        for i in range(max_attempts):
            time.sleep(5)
            status_response = self.client.get_task_status(task_id)
            status_data = status_response.json()

            status = status_data.get("status")
            print(f"任务状态: {status}, 进度: {status_data.get('progress')}%")

            if status == "completed":
                # 下载文件验证
                ppt_content = self.client.download_ppt(task_id)
                self.assertGreater(len(ppt_content), 0)
                return
            elif status == "failed":
                self.fail(f"任务失败: {status_data.get('error')}")

        self.fail("任务超时")

    def test_empty_input_validation(self):
        """测试空输入校验 (TC-INPUT-001)"""
        response = self.client.generate_ppt(user_request="")

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get("success"))

    def test_short_input_validation(self):
        """测试过短输入校验 (TC-INPUT-002)"""
        response = self.client.generate_ppt(user_request="测试")

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get("success"))


class TestTaskStatus(unittest.TestCase):
    """任务状态测试"""

    def setUp(self):
        """测试前置设置"""
        self.client = APIClient()

    def test_query_nonexistent_task(self):
        """测试查询不存在任务 (TC-STS-005)"""
        response = self.client.get_task_status("nonexistent-task-id")

        self.assertEqual(response.status_code, 404)


class TestErrorHandling(unittest.TestCase):
    """异常处理测试"""

    def setUp(self):
        """测试前置设置"""
        self.client = APIClient()

    def test_network_error_handling(self):
        """测试网络错误处理 (TC-ERR-001)"""
        # 创建一个无效的客户端
        invalid_client = APIClient("http://invalid-host:9999")

        with self.assertRaises(Exception) as context:
            invalid_client.generate_ppt("测试需求")

        self.assertIn("连接失败", str(context.exception))


class TestConcurrentRequests(unittest.TestCase):
    """并发请求测试"""

    def setUp(self):
        """测试前置设置"""
        self.client = APIClient()

    def test_concurrent_submissions(self):
        """测试并发提交 (TC-CONC-001)"""
        import concurrent.futures

        def submit_task(i):
            try:
                response = self.client.generate_ppt(
                    user_request=f"测试需求 {i}",
                    slide_count=5
                )
                return response.status_code, response.json()
            except Exception as e:
                return None, str(e)

        # 并发提交 10 个任务
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(submit_task, i) for i in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # 统计成功和失败数量
        success_count = sum(1 for status, _ in results if status == 202)
        print(f"成功提交: {success_count}/10")

        self.assertGreater(success_count, 0)


# ==================== 测试运行器 ====================

def run_tests():
    """运行所有测试"""
    # 创建测试套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # 添加测试用例
    suite.addTests(loader.loadTestsFromTestCase(TestHealthCheck))
    suite.addTests(loader.loadTestsFromTestCase(TestPPTGeneration))
    suite.addTests(loader.loadTestsFromTestCase(TestTaskStatus))
    suite.addTests(loader.loadTestsFromTestCase(TestErrorHandling))
    suite.addTests(loader.loadTestsFromTestCase(TestConcurrentRequests))

    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # 输出测试报告
    print("\n" + "=" * 60)
    print("测试报告汇总")
    print("=" * 60)
    print(f"测试用例总数: {result.testsRun}")
    print(f"成功: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"失败: {len(result.failures)}")
    print(f"错误: {len(result.errors)}")
    print("=" * 60)

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
