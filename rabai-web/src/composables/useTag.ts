// useTag.ts - 标签模块
import { ref } from 'vue'

export function useTags(initialTags: string[] = []) {
  const tags = ref<string[]>([...initialTags])

  const add = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.value.includes(trimmed)) {
      tags.value.push(trimmed)
    }
  }

  const remove = (tag: string) => {
    const index = tags.value.indexOf(tag)
    if (index > -1) tags.value.splice(index, 1)
  }

  const toggle = (tag: string) => {
    if (tags.value.includes(tag)) {
      remove(tag)
    } else {
      add(tag)
    }
  }

  const has = (tag: string) => tags.value.includes(tag)

  const clear = () => { tags.value = [] }

  const set = (newTags: string[]) => { tags.value = [...newTags] }

  return { tags, add, remove, toggle, has, clear, set }
}

export default useTags
