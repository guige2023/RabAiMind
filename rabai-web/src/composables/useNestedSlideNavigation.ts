// Nested Slide Navigation - 嵌套幻灯片导航
import { ref, computed } from 'vue'

export interface SlideNode {
  id: string
  title: string
  type: 'section' | 'slide' | 'subsection'
  children?: SlideNode[]
  parentId?: string
  depth: number
  order: number
  collapsed?: boolean
}

export interface NavigationState {
  currentId: string
  history: string[]
  historyIndex: number
}

export interface SlideTree {
  root: SlideNode
  flatNodes: SlideNode[]
}

export function useNestedSlideNavigation() {
  // 幻灯片树
  const slideTree = ref<SlideNode | null>(null)

  // 扁平节点列表
  const flatNodes = ref<SlideNode[]>([])

  // 导航状态
  const navigation = ref<NavigationState>({
    currentId: '',
    history: [],
    historyIndex: -1
  })

  // 折叠状态
  const collapsedNodes = ref<Set<string>>(new Set())

  // 构建树
  const buildTree = (data: any[]): SlideNode => {
    const root: SlideNode = {
      id: 'root',
      title: 'Root',
      type: 'section',
      depth: -1,
      order: 0,
      children: []
    }

    flatNodes.value = []

    const processItem = (item: any, parent: SlideNode, depth: number, order: number): SlideNode => {
      const node: SlideNode = {
        id: item.id || `slide_${order}`,
        title: item.title || item.name || `Slide ${order + 1}`,
        type: item.type || 'slide',
        depth,
        order,
        parentId: parent.id,
        children: item.children ? [] : undefined
      }

      flatNodes.value.push(node)

      if (item.children && item.children.length > 0) {
        node.children = item.children.map((child: any, index: number) =>
          processItem(child, node, depth + 1, index)
        )
      }

      return node
    }

    root.children = data.map((item, index) => processItem(item, root, 0, index))
    slideTree.value = root

    return root
  }

  // 添加节点
  const addNode = (parentId: string, node: Omit<SlideNode, 'id' | 'depth' | 'parentId' | 'order'>) => {
    const parent = findNode(parentId)
    if (!parent) return null

    const newNode: SlideNode = {
      ...node,
      id: `slide_${Date.now()}`,
      depth: parent.depth + 1,
      parentId: parent.id,
      order: parent.children?.length || 0
    }

    if (!parent.children) parent.children = []
    parent.children.push(newNode)
    flatNodes.value.push(newNode)

    return newNode
  }

  // 移除节点
  const removeNode = (id: string) => {
    const index = flatNodes.value.findIndex(n => n.id === id)
    if (index > -1) {
      flatNodes.value.splice(index, 1)
    }

    const removeFromTree = (node: SlideNode): boolean => {
      if (!node.children) return false

      const idx = node.children.findIndex(c => c.id === id)
      if (idx > -1) {
        node.children.splice(idx, 1)
        return true
      }

      return node.children.some(removeFromTree)
    }

    if (slideTree.value) {
      removeFromTree(slideTree.value)
    }
  }

  // 查找节点
  const findNode = (id: string): SlideNode | null => {
    return flatNodes.value.find(n => n.id === id) || null
  }

  // 获取子节点
  const getChildren = (parentId: string): SlideNode[] => {
    const parent = findNode(parentId)
    return parent?.children || []
  }

  // 获取父节点链
  const getPath = (id: string): SlideNode[] => {
    const path: SlideNode[] = []
    let current = findNode(id)

    while (current) {
      path.unshift(current)
      current = current.parentId ? findNode(current.parentId) : null
    }

    return path
  }

  // 切换折叠
  const toggleCollapse = (id: string) => {
    if (collapsedNodes.value.has(id)) {
      collapsedNodes.value.delete(id)
    } else {
      collapsedNodes.value.add(id)
    }
  }

  // 是否折叠
  const isCollapsed = (id: string): boolean => {
    return collapsedNodes.value.has(id)
  }

  // 获取可见节点
  const getVisibleNodes = computed((): SlideNode[] => {
    const visible: SlideNode[] = []

    const traverse = (node: SlideNode) => {
      visible.push(node)

      if (node.children && !isCollapsed(node.id)) {
        node.children.forEach(traverse)
      }
    }

    if (slideTree.value?.children) {
      slideTree.value.children.forEach(traverse)
    }

    return visible
  })

  // 导航到节点
  const navigateTo = (id: string) => {
    const node = findNode(id)
    if (!node) return

    // 添加到历史
    navigation.value.history = navigation.value.history.slice(0, navigation.value.historyIndex + 1)
    navigation.value.history.push(id)
    navigation.value.historyIndex = navigation.value.history.length - 1
    navigation.value.currentId = id
  }

  // 前进
  const goForward = () => {
    if (navigation.value.historyIndex < navigation.value.history.length - 1) {
      navigation.value.historyIndex++
      navigation.value.currentId = navigation.value.history[navigation.value.historyIndex]
    }
  }

  // 后退
  const goBack = () => {
    if (navigation.value.historyIndex > 0) {
      navigation.value.historyIndex--
      navigation.value.currentId = navigation.value.history[navigation.value.historyIndex]
    }
  }

  // 可否前进/后退
  const canGoForward = computed(() => navigation.value.historyIndex < navigation.value.history.length - 1)
  const canGoBack = computed(() => navigation.value.historyIndex > 0)

  // 移动节点
  const moveNode = (nodeId: string, targetParentId: string, targetIndex: number) => {
    const node = findNode(nodeId)
    if (!node) return

    // 从原位置移除
    const sourceParent = node.parentId ? findNode(node.parentId) : slideTree.value
    if (sourceParent?.children) {
      const idx = sourceParent.children.findIndex(c => c.id === nodeId)
      if (idx > -1) sourceParent.children.splice(idx, 1)
    }

    // 添加到新位置
    const targetParent = findNode(targetParentId)
    if (!targetParent) return

    if (!targetParent.children) targetParent.children = []
    node.parentId = targetParentId
    node.depth = targetParent.depth + 1
    targetParent.children.splice(targetIndex, 0, node)
  }

  // 统计
  const stats = computed(() => ({
    totalNodes: flatNodes.value.length,
    sections: flatNodes.value.filter(n => n.type === 'section').length,
    slides: flatNodes.value.filter(n => n.type === 'slide').length,
    depth: Math.max(...flatNodes.value.map(n => n.depth), collapsed: collapsedNodes.value.size,
    historyLength: navigation.value.history.length,
    currentIndex: navigation.value.historyIndex
  }))

  return {
    slideTree,
    flatNodes,
    navigation,
    collapsedNodes,
    visibleNodes: getVisibleNodes,
    buildTree,
    addNode,
    removeNode,
    findNode,
    getChildren,
    getPath,
    toggleCollapse,
    isCollapsed,
    navigateTo,
    goForward,
    goBack,
    canGoForward,
    canGoBack,
    moveNode,
    stats
  }
}

export default useNestedSlideNavigation
