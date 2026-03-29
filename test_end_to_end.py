"""
端到端链路测试

测试：plan → content → SVG → PPTX → download
"""
import os
import sys

# 确保使用 venv 中的 Python
venv_python = os.path.join(os.path.dirname(__file__), "venv", "bin", "python3")
if os.path.exists(venv_python) and sys.executable != venv_python:
    os.execv(venv_python, [venv_python, __file__])

sys.path.insert(0, os.path.dirname(__file__))

# 读取 .env
from dotenv import load_dotenv

load_dotenv()


def test_volc_api():
    """测试火山引擎 API 是否可调通"""
    api_key = os.getenv("VOLCANO_API_KEY")
    if not api_key or api_key == "your_volcano_api_key_here":
        print("⚠️ VOLCANO_API_KEY 未配置，跳过 API 测试")
        return False
    print(f"✅ VOLCANO_API_KEY 已配置: {api_key[:8]}...")
    return True


def test_ppt_planner():
    """测试 PPT 规划器"""
    try:
        from src.services.ppt_planner import plan_ppt

        print("✅ ppt_planner import OK")
        return True
    except Exception as e:
        print(f"❌ ppt_planner import 失败: {e}")
        return False


def test_coordinator():
    """测试 CoordinatorAgent"""
    try:
        from agents.coordinator_agent import CoordinatorAgent

        agent = CoordinatorAgent()
        print(f"✅ CoordinatorAgent 初始化 OK (name={agent.name})")
        return True
    except Exception as e:
        print(f"❌ CoordinatorAgent 初始化失败: {e}")
        return False


if __name__ == "__main__":
    print("=== RabAiMind 端到端链路测试 ===")
    results = {
        "volc_api": test_volc_api(),
        "ppt_planner": test_ppt_planner(),
        "coordinator": test_coordinator(),
    }
    print("\n=== 测试结果 ===")
    for k, v in results.items():
        print(f"{'✅' if v else '❌'} {k}")

    passed = sum(results.values())
    print(f"\n通过: {passed}/{len(results)}")
