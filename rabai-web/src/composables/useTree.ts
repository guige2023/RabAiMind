// useTree.ts - 树形结构模块
import { ref, computed } from 'vue'

export interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
}

export function useTree(nodes: TreeNode[] = []) {
  const treeData = ref<TreeNode[]>(nodes)
  const expandedKeys = ref<string[]>([])
  const selectedKeys = ref<string[]>([])

  const toggleExpand = (key: string) => {
    const index = expandedKeys.value.indexOf(key)
    if (index > -1) {
      expandedKeys.value.splice(index, 1)
    } else {
      expandedKeys.value.push(key)
    }
  }

  const expand = (key: string) => {
    if (!expandedKeys.value.includes(key)) {
      expandedKeys.value.push(key)
    }
  }

  const collapse = (key: string) => {
    const index = expandedKeys.value.indexOf(key)
    if (index > -1) expandedKeys.value.splice(index, 1)
  }

  const expandAll = () => {
    const getAllKeys = (nodes: TreeNode[]): string[] => {
      return nodes.flatMap(n => [n.key, ...(n.children ? getAllKeys(n.children) : [])])
    }
    expandedKeys.value = getAllKeys(treeData.value)
  }

  const collapseAll = () => {
    expandedKeys.value = []
  }

  const select = (key: string) => {
    selectedKeys.value = [key]
  }

  const isExpanded = (key: string) => expandedKeys.value.includes(key)
  const isSelected = (key: string) => selectedKeys.value.includes(key)

  const getSelectedNodes = computed(() => {
    const findNode = (nodes: TreeNode[], key: string): TreeNode | null => {
      for (const node of nodes) {
        if (node.key === key) return node
        if (node.children) {
          const found = findNode(node.children, key)
          if (found) return found
        }
      }
      return null
    }
    return selectedKeys.value.map(k => findNode(treeData.value, k)).filter(Boolean) as TreeNode[]
  })

  return {
    treeData,
    expandedKeys,
    selectedKeys,
    toggleExpand,
    expand,
    collapse,
    expandAll,
    collapseAll,
    select,
    isExpanded,
    isSelected,
    getSelectedNodes
  }
}

export default useTree
