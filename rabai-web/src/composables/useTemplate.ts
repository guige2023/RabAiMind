// useTemplate.ts - 模板统一模块
// 合并所有模板相关功能
import { ref, computed } from 'vue'

export interface Template {
  id: string
  name: string
  category: string
  tags: string[]
  thumbnail: string
}

export interface TemplateFilter {
  category?: string
  tags?: string[]
  search?: string
}

export function useTemplate() {
  // 模板列表
  const templates = ref<Template[]>([])

  // 当前模板
  const currentTemplate = ref<Template | null>(null)

  // 筛选条件
  const filter = ref<TemplateFilter>({})

  // 加载模板
  const loadTemplates = async () => {
    // 示例数据
    templates.value = [
      { id: 't1', name: '商务蓝', category: 'business', tags: ['商务', '蓝色'], thumbnail: '' },
      { id: 't2', name: '创意紫', category: 'creative', tags: ['创意', '紫色'], thumbnail: '' },
      { id: 't3', name: '科技黑', category: 'tech', tags: ['科技', '黑色'], thumbnail: '' }
    ]
  }

  // 筛选模板
  const filteredTemplates = computed(() => {
    let result = [...templates.value]

    if (filter.value.category) {
      result = result.filter(t => t.category === filter.value.category)
    }

    if (filter.value.search) {
      const search = filter.value.search.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    return result
  })

  // 选择模板
  const selectTemplate = (templateId: string) => {
    const template = templates.value.find(t => t.id === templateId)
    if (template) {
      currentTemplate.value = template
    }
  }

  // 更新筛选
  const updateFilter = (updates: Partial<TemplateFilter>) => {
    Object.assign(filter.value, updates)
  }

  return {
    templates,
    currentTemplate,
    filter,
    filteredTemplates,
    loadTemplates,
    selectTemplate,
    updateFilter
  }
}

export default useTemplate
