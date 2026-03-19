// Jinja2 Template Engine - Jinja2风格模板引擎
import { ref, computed } from 'vue'

export interface TemplateContext {
  [key: string]: any
}

export interface TemplateFilter {
  name: string
  fn: (value: any, ...args: any[]) => any
}

export interface TemplateFunction {
  name: string
  fn: (...args: any[]) => any
}

export interface TemplateTest {
  name: string
  fn: (value: any) => boolean
}

export interface TemplateBlock {
  name: string
  content: string
}

export interface RenderResult {
  output: string
  errors: string[]
  warnings: string[]
}

export interface TemplateVariable {
  name: string
  value: any
  escaped: boolean
}

export function useJinja2Template() {
  // 模板内容
  const template = ref('')

  // 上下文数据
  const context = ref<TemplateContext>({})

  // 自定义过滤器
  const filters = ref<Record<string, (value: any, ...args: any[]) => any>>({
    // 字符串过滤器
    upper: (v: any) => typeof v === 'string' ? v.toUpperCase() : v,
    lower: (v: any) => typeof v === 'string' ? v.toLowerCase() : v,
    capitalize: (v: any) => typeof v === 'string' ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v,
    title: (v: any) => typeof v === 'string' ? v.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : v,
    trim: (v: any) => typeof v === 'string' ? v.trim() : v,
    strip: (v: any) => typeof v === 'string' ? v.trim() : v,
    truncate: (v: any, length = 255, suffix = '...') => typeof v === 'string' ? (v.length > length ? v.substring(0, length) + suffix : v) : v,
    replace: (v: any, old: string, newStr: string) => typeof v === 'string' ? v.split(old).join(newStr) : v,
    join: (v: any, delimiter = '') => Array.isArray(v) ? v.join(delimiter) : v,
    split: (v: any, delimiter = ' ') => typeof v === 'string' ? v.split(delimiter) : v,

    // 列表过滤器
    first: (v: any) => Array.isArray(v) ? v[0] : null,
    last: (v: any) => Array.isArray(v) ? v[v.length - 1] : null,
    length: (v: any) => Array.isArray(v) || typeof v === 'string' ? v.length : 0,
    sort: (v: any, reverse = false) => Array.isArray(v) ? [...v].sort((a, b) => reverse ? (b > a ? 1 : -1) : (a > b ? 1 : -1)) : v,
    reverse: (v: any) => Array.isArray(v) ? [...v].reverse() : v,
    unique: (v: any) => Array.isArray(v) ? [...new Set(v)] : v,
    random: (v: any) => Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v,
    slice: (v: any, start = 0, stop?: number) => Array.isArray(v) ? v.slice(start, stop) : v,
    batch: (v: any, size: number) => {
      if (!Array.isArray(v)) return v
      const batches = []
      for (let i = 0; i < v.length; i += size) {
        batches.push(v.slice(i, i + size))
      }
      return batches
    },
    joinattr: (v: any, attr: string, delimiter = '') => Array.isArray(v) ? v.map((item: any) => item[attr]).join(delimiter) : v,

    // 数字过滤器
    int: (v: any, defaultVal = 0) => parseInt(v) || defaultVal,
    float: (v: any, defaultVal = 0) => parseFloat(v) || defaultVal,
    round: (v: any, precision = 0) => {
      const multiplier = Math.pow(10, precision)
      return Math.round(v * multiplier) / multiplier
    },
    format: (v: any, ...args: any[]) => typeof v === 'string' || typeof v === 'number' ? String(v).replace(/\{(\d+)\}/g, (_, i) => args[i] || '') : v,

    // 日期/时间过滤器
    date: (v: any, format = 'YYYY-MM-DD') => {
      if (v instanceof Date) {
        return format.replace('YYYY', v.getFullYear())
          .replace('MM', String(v.getMonth() + 1).padStart(2, '0'))
          .replace('DD', String(v.getDate()).padStart(2, '0'))
      }
      return v
    },
    time: (v: any, format = 'HH:mm:ss') => {
      if (v instanceof Date) {
        return format.replace('HH', String(v.getHours()).padStart(2, '0'))
          .replace('mm', String(v.getMinutes()).padStart(2, '0'))
          .replace('ss', String(v.getSeconds()).padStart(2, '0'))
      }
      return v
    },

    // 格式化过滤器
    json: (v: any, indent = 0) => JSON.stringify(v, null, indent),
    tojson: (v: any) => JSON.stringify(v),
    pprint: (v: any) => JSON.stringify(v, null, 2),

    // 字符串转义
    escape: (v: any) => typeof v === 'string' ? v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : v,
    safe: (v: any) => v, // 标记为安全HTML
    e: (v: any) => typeof v === 'string' ? v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : v,

    // 颜色/样式过滤器
    hex2rgb: (v: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(v)
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : v
    },
    rgb2hex: (v: string) => {
      const result = /(\d+),\s*(\d+),\s*(\d+)/.exec(v)
      return result ? '#' + [result[1], result[2], result[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('') : v
    },

    // 条件默认值
    default: (v: any, defaultVal = '') => v === undefined || v === null ? defaultVal : v,
    d: (v: any, defaultVal = '') => v === undefined || v === null ? defaultVal : v,

    // 转换为布尔值
    bool: (v: any) => Boolean(v),
    forceescape: (v: any) => typeof v === 'string' ? v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : v
  })

  // 自定义测试
  const tests = ref<Record<string, (value: any) => boolean>>({
    defined: (v: any) => v !== undefined,
    undefined: (v: any) => v === undefined,
    none: (v: any) => v === null,
    boolean: (v: any) => typeof v === 'boolean',
    number: (v: any) => typeof v === 'number',
    string: (v: any) => typeof v === 'string',
    array: (v: any) => Array.isArray(v),
    object: (v: any) => typeof v === 'object' && !Array.isArray(v),
    iterable: (v: any) => Array.isArray(v) || typeof v === 'string',
    even: (v: any) => typeof v === 'number' && v % 2 === 0,
    odd: (v: any) => typeof v === 'number' && v % 2 !== 0,
    divisibleby: (v: any, num: number) => typeof v === 'number' && v % num === 0,
    eq: (v: any, other: any) => v === other,
    equalto: (v: any, other: any) => v === other,
    sameas: (v: any, other: any) => v === other,
    ne: (v: any, other: any) => v !== other,
    gt: (v: any, other: any) => v > other,
    gte: (v: any, other: any) => v >= other,
    lt: (v: any, other: any) => v < other,
    lte: (v: any, other: any) => v <= other,
    in: (v: any, list: any) => Array.isArray(list) ? list.includes(v) : false,
    issameclass: (v: any, other: any) => v.constructor === other.constructor
  })

  // 全局函数
  const functions = ref<Record<string, (...args: any[]) => any>>({
    // 范围函数
    range: (start: number, stop?: number, step = 1) => {
      if (stop === undefined) {
        stop = start
        start = 0
      }
      const result = []
      for (let i = start; i < stop; i += step) {
        result.push(i)
      }
      return result
    },

    // 循环变量
    loop: (count: number) => Array.from({ length: count }, (_, i) => ({ index: i, index0: i, revindex: count - i, revindex0: count - i - 1, first: i === 0, last: i === count - 1, length: count })),

    // 字符串操作
    join: (items: any[], delimiter = '') => items.join(delimiter),
    split: (str: string, delimiter = ' ') => str.split(delimiter),

    // 列表操作
    list: (obj: any) => Array.from(obj),
    tuple: (obj: any) => Array.from(obj),
    min: (...args: any[]) => Math.min(...args),
    max: (...args: any[]) => Math.max(...args),
    sum: (items: any[], attr?: string) => attr ? items.reduce((s: number, i: any) => s + (i[attr] || 0), 0) : items.reduce((s: number, n: number) => s + n, 0),
    average: (items: any[], attr?: string) => {
      const total = attr ? items.reduce((s: number, i: any) => s + (i[attr] || 0), 0) : items.reduce((s: number, n: number) => s + n, 0)
      return total / (items.length || 1)
    },
    random_item: (items: any[]) => items[Math.floor(Math.random() * items.length)],
    shuffle: (items: any[]) => [...items].sort(() => Math.random() - 0.5),

    // 类型转换
    int: (v: any, defaultVal = 0) => parseInt(v) || defaultVal,
    float: (v: any, defaultVal = 0) => parseFloat(v) || defaultVal,
    string: (v: any) => String(v),
    bool: (v: any) => Boolean(v),

    // 日期/时间
    now: (format?: string) => {
      const d = new Date()
      return format ? d.toISOString().slice(0, 10) : d
    },
    datetime: () => new Date(),

    // 工具函数
    dict: (...args: any[]) => {
      const result: Record<string, any> = {}
      args.forEach((arg, i) => {
        if (i % 2 === 0) result[arg] = args[i + 1]
      })
      return result
    },
    namespace: (obj: Record<string, any> = {}) => obj,

    // 调试
    log: (msg: any) => { console.log(msg); return '' },
    debug: (msg: any) => { console.debug(msg); return '' },
    warn: (msg: any) => { console.warn(msg); return '' },
    error: (v: any) => { console.error(v); return '' }
  })

  // 添加自定义过滤器
  const addFilter = (name: string, fn: (value: any, ...args: any[]) => any) => {
    filters.value[name] = fn
  }

  // 添加自定义测试
  const addTest = (name: string, fn: (value: any) => boolean) => {
    tests.value[name] = fn
  }

  // 添加自定义函数
  const addFunction = (name: string, fn: (...args: any[]) => any) => {
    functions.value[name] = fn
  }

  // 词法分析 - 解析模板
  const tokenize = (tmpl: string): string[] => {
    const tokens: string[] = []
    let i = 0
    let inBlock = false
    let inVariable = false
    let inComment = false
    let currentToken = ''

    while (i < tmpl.length) {
      const char = tmpl[i]

      // 注释
      if (tmpl.slice(i, i + 3) === '{#') {
        if (currentToken) {
          tokens.push(currentToken)
          currentToken = ''
        }
        const endIdx = tmpl.indexOf('#}', i + 2)
        i = endIdx + 2
        continue
      }

      // 块标签
      if (char === '{' && tmpl[i + 1] === '%') {
        if (currentToken) {
          tokens.push(currentToken)
          currentToken = ''
        }
        inBlock = true
        tokens.push('BLOCK_START')
        i += 2
        continue
      }

      // 变量标签
      if (char === '{' && tmpl[i + 1] === '{') {
        if (currentToken) {
          tokens.push(currentToken)
          currentToken = ''
        }
        inVariable = true
        tokens.push('VAR_START')
        i += 2
        continue
      }

      // 结束块/变量
      if (inBlock && char === '%' && tmpl[i + 1] === '}') {
        if (currentToken.trim()) tokens.push(currentToken.trim())
        currentToken = ''
        tokens.push('BLOCK_END')
        inBlock = false
        i += 2
        continue
      }

      if (inVariable && char === '}' && tmpl[i + 1] === '}') {
        if (currentToken.trim()) tokens.push(currentToken.trim())
        currentToken = ''
        tokens.push('VAR_END')
        inVariable = false
        i += 2
        continue
      }

      // 分隔符
      if ((inBlock || inVariable) && char === '|') {
        if (currentToken.trim()) tokens.push(currentToken.trim())
        currentToken = ''
        tokens.push('PIPE')
        i++
        continue
      }

      if ((inBlock || inVariable) && char === ',') {
        if (currentToken.trim()) tokens.push(currentToken.trim())
        currentToken = ''
        tokens.push('COMMA')
        i++
        continue
      }

      if ((inBlock || inVariable) && char === ':') {
        if (currentToken.trim()) tokens.push(currentToken.trim())
        currentToken = ''
        tokens.push('COLON')
        i++
        continue
      }

      currentToken += char
      i++
    }

    if (currentToken) {
      tokens.push(currentToken)
    }

    return tokens
  }

  // 解析变量
  const parseVariable = (expr: string): any => {
    expr = expr.trim()

    // 字符串字面量
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1)
    }

    // 数字
    if (!isNaN(Number(expr))) {
      return Number(expr)
    }

    // 布尔值
    if (expr === 'true') return true
    if (expr === 'false') return false
    if (expr === 'none' || expr === 'null') return null

    // 访问属性
    const parts = expr.split('.')
    let value = context.value

    for (const part of parts) {
      if (value === undefined || value === null) return undefined
      value = value[part]
    }

    return value
  }

  // 计算表达式
  const evaluate = (expr: string): string => {
    expr = expr.trim()

    // 应用过滤器
    const pipeIdx = expr.indexOf('|')
    if (pipeIdx > -1) {
      const varPart = expr.slice(0, pipeIdx).trim()
      const filterParts = expr.slice(pipeIdx + 1).trim()

      let value = evaluate(varPart)

      // 解析过滤器链
      const filterExprs = filterParts.split('|').map(f => f.trim())

      for (const filterExpr of filterExprs) {
        const match = filterExpr.match(/^(\w+)(?:\((.*)\))?$/)
        if (match) {
          const [, filterName, argsStr] = match
          const filterFn = filters.value[filterName]

          if (filterFn) {
            const args = argsStr ? argsStr.split(',').map((a: string) => evaluate(a.trim())) : []
            value = filterFn(value, ...args)
          }
        }
      }

      return value
    }

    // 简单变量
    return parseVariable(expr)
  }

  // 执行块标签
  const executeBlock = (tagName: string, args: string[]): string => {
    switch (tagName) {
      case 'if': {
        const condition = evaluate(args.join(' '))
        return condition ? 'IF_TRUE' : 'IF_FALSE'
      }
      case 'elif': {
        const condition = evaluate(args.join(' '))
        return condition ? 'IF_TRUE' : 'IF_FALSE'
      }
      case 'else':
        return 'ELSE'
      case 'endif':
        return 'ENDIF'
      case 'for': {
        // 解析 for 循环: for item in items
        const inIdx = args.indexOf('in')
        if (inIdx === -1) return ''
        const loopVar = args[0]
        const itemExpr = args.slice(inIdx + 1).join(' ')
        const items = evaluate(itemExpr)
        if (!Array.isArray(items)) return ''
        return `FOR:${loopVar}:${JSON.stringify(items)}`
      }
      case 'endfor':
        return 'ENDFOR'
      case 'set': {
        // 解析赋值: set name = value
        const eqIdx = args.indexOf('=')
        if (eqIdx === -1) {
          // 块设置: set name %}{ ... %}{ endset
          const varName = args[0]
          return `SET_START:${varName}`
        }
        const varName = args.slice(0, eqIdx).join(' ')
        const value = evaluate(args.slice(eqIdx + 1).join(' '))
        context.value[varName] = value
        return ''
      }
      case 'endset':
        return 'ENDSET'
      case 'include':
        return `INCLUDE:${args[0]}`
      case 'import':
        return `IMPORT:${args[0]}`
      case 'from':
        return `FROM:${args[0]}`
      case 'macro':
        return `MACRO:${args[0]}`
      case 'endmacro':
        return 'ENDMACRO'
      case 'block':
        return `BLOCK:${args[0]}`
      case 'endblock':
        return 'ENDBLOCK'
      case 'extends':
        return `EXTENDS:${args[0]}`
      case 'include':
        return `INCLUDE:${args[0]}`
      default:
        return ''
    }
  }

  // 渲染模板
  const render = (tmpl?: string, ctx?: TemplateContext): RenderResult => {
    const errors: string[] = []
    const warnings: string[] = []

    const templateStr = tmpl || template.value
    const renderContext = { ...context.value, ...ctx }

    // 设置临时上下文
    const originalContext = { ...context.value }
    Object.assign(context.value, renderContext)

    try {
      const tokens = tokenize(templateStr)
      let output = ''
      let i = 0

      // 块/循环状态
      const blockStack: string[] = []
      const forStack: Array<{ var: string; items: any[]; index: number }> = []

      while (i < tokens.length) {
        const token = tokens[i]

        if (token === 'VAR_START') {
          const varToken = tokens[++i]
          if (varToken !== 'VAR_END') {
            const value = evaluate(varToken)
            output += value !== undefined ? String(value) : ''
          }
        } else if (token === 'BLOCK_START') {
          const blockToken = tokens[++i]
          if (blockToken !== 'BLOCK_END') {
            const [tagName, ...args] = blockToken.split(/\s+/)
            const result = executeBlock(tagName, args)

            if (result === 'IF_TRUE') {
              blockStack.push('IF')
            } else if (result === 'IF_FALSE') {
              blockStack.push('SKIP_IF')
            } else if (result === 'ELSE') {
              if (blockStack[blockStack.length - 1] === 'IF') {
                blockStack.pop()
                blockStack.push('SKIP_ELSE')
              }
            } else if (result === 'ENDIF') {
              blockStack.pop()
            } else if (result.startsWith('FOR:')) {
              const [, varName, itemsJson] = result.split(':')
              const items = JSON.parse(itemsJson)
              if (items.length > 0) {
                forStack.push({ var: varName, items, index: 0 })
                context.value[varName] = items[0]
                // 添加循环变量
                context.value.loop = { index: 0, index0: 0, revindex: items.length, revindex0: items.length - 1, first: true, last: items.length === 1, length: items.length }
              } else {
                blockStack.push('SKIP_FOR')
              }
            } else if (result === 'ENDFOR') {
              const forState = forStack.pop()
              if (forState) {
                forState.index++
                if (forState.index < forState.items.length) {
                  context.value[forState.var] = forState.items[forState.index]
                  context.value.loop = {
                    index: forState.index,
                    index0: forState.index,
                    revindex: forState.items.length - forState.index,
                    revindex0: forState.items.length - forState.index - 1,
                    first: false,
                    last: forState.index === forState.items.length - 1,
                    length: forState.items.length
                  }
                  // 重新执行循环体
                  // 这里简化处理，实际需要回退token索引
                }
              }
              if (blockStack[blockStack.length - 1] === 'SKIP_FOR') {
                blockStack.pop()
              }
            }
          }
        } else if (token !== 'VAR_END' && token !== 'BLOCK_END') {
          // 纯文本
          if (!blockStack.includes('SKIP_IF') && !blockStack.includes('SKIP_FOR') && !blockStack.includes('SKIP_ELSE')) {
            output += token
          }
        }

        i++
      }

      // 恢复原始上下文
      Object.assign(context.value, originalContext)

      return { output, errors, warnings }
    } catch (error) {
      errors.push((error as Error).message)
      Object.assign(context.value, originalContext)
      return { output: '', errors, warnings }
    }
  }

  // 编译模板（预解析）
  const compile = (tmpl?: string) => {
    const templateStr = tmpl || template.value
    // 简单的编译优化：提取静态部分
    const tokens = tokenize(templateStr)
    return { tokens, context: context.value }
  }

  // 设置模板
  const setTemplate = (tmpl: string) => {
    template.value = tmpl
  }

  // 设置上下文
  const setContext = (ctx: TemplateContext) => {
    Object.assign(context.value, ctx)
  }

  // 更新上下文变量
  const updateContext = (key: string, value: any) => {
    context.value[key] = value
  }

  // 获取可用过滤器
  const availableFilters = computed(() => Object.keys(filters.value))

  // 获取可用测试
  const availableTests = computed(() => Object.keys(tests.value))

  // 获取可用函数
  const availableFunctions = computed(() => Object.keys(functions.value))

  // 统计
  const stats = computed(() => ({
    templateLength: template.value.length,
    contextKeys: Object.keys(context.value).length,
    filtersCount: availableFilters.value.length,
    testsCount: availableTests.value.length,
    functionsCount: availableFunctions.value.length
  }))

  // 示例模板
  const sampleTemplate = `{# 这是一个Jinja2风格模板 #}
{% set title = "RabAiMind" %}

# {{ title }}

## 欢迎

{% for item in items %}
- {{ item.name | upper }} - {{ item.price | default('免费') }}
{% endfor %}

总计: {{ items | length }} 项

{{ "当前时间: " ~ (now() | date) }}`

  return {
    // 数据
    template,
    context,

    // 自定义扩展
    filters,
    tests,
    functions,

    // 方法
    addFilter,
    addTest,
    addFunction,
    tokenize,
    evaluate,
    render,
    compile,
    setTemplate,
    setContext,
    updateContext,

    // 计算属性
    availableFilters,
    availableTests,
    availableFunctions,
    stats,

    // 示例
    sampleTemplate
  }
}

export default useJinja2Template
