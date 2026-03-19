// useTestHelper.ts - 测试辅助工具
import { ref, computed } from 'vue'

export interface TestResult {
  id: string
  name: string
  passed: boolean
  duration: number
  error?: string
}

export interface TestSuite {
  name: string
  tests: TestResult[]
}

export function useTestHelper() {
  // 测试结果
  const results = ref<TestResult[]>([])

  // 套件
  const suites = ref<TestSuite[]>([])

  // 运行测试
  const runTest = async (name: string, fn: () => Promise<void> | void): Promise<TestResult> => {
    const start = performance.now()
    let passed = true
    let error: string | undefined

    try {
      await fn()
    } catch (e) {
      passed = false
      error = String(e)
    }

    const result: TestResult = {
      id: `test_${Date.now()}`,
      name,
      passed,
      duration: performance.now() - start,
      error
    }

    results.value.push(result)
    return result
  }

  // 批量运行
  const runSuite = async (name: string, tests: Array<() => Promise<void> | void>): Promise<TestSuite> => {
    const suiteResults: TestResult[] = []

    for (const test of tests) {
      const result = await runTest(name, test)
      suiteResults.push(result)
    }

    const suite: TestSuite = { name, tests: suiteResults }
    suites.value.push(suite)
    return suite
  }

  // 统计
  const stats = computed(() => {
    const total = results.value.length
    const passed = results.value.filter(r => r.passed).length
    const failed = total - passed
    const duration = results.value.reduce((sum, r) => sum + r.duration, 0)

    return { total, passed, failed, duration: duration.toFixed(2) }
  })

  // 清空
  const clear = () => {
    results.value = []
    suites.value = []
  }

  return { results, suites, runTest, runSuite, stats, clear }
}

export default useTestHelper
