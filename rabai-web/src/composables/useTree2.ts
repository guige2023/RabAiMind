// useTree2.ts - 树形选择模块
import { ref } from 'vue'

export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  expanded?: boolean
}

export function useTreeSelect(nodes: TreeNode[] = []) {
  const treeData = ref<TreeNode[]>(nodes)
  const checkedKeys = ref<Set<string>>(new Set())
  const expandedKeys = ref<Set<string>>(new Set())

  const toggleCheck = (id: string) => {
    checkedKeys.value.has(id) ? checkedKeys.value.delete(id) : checkedKeys.value.add(id)
  }

  const toggleExpand = (id: string) => {
    expandedKeys.value.has(id) ? expandedKeys.value.delete(id) : expandedKeys.value.add(id)
  }

  const isChecked = (id: string) => checkedKeys.value.has(id)
  const isExpanded = (id: string) => expandedKeys.value.has(id)

  const getChecked = (): string[] => Array.from(checkedKeys.value)

  const clear = () => { checkedKeys.value.clear(); expandedKeys.value.clear() }

  return { treeData, checkedKeys, expandedKeys, toggleCheck, toggleExpand, isChecked, isExpanded, getChecked, clear }
}

export default useTreeSelect
