// useToggle.ts - 状态切换模块
import { ref, computed } from 'vue'

export function useToggle(initial = false) {
  const value = ref(initial)

  const toggle = () => { value.value = !value.value }
  const setTrue = () => { value.value = true }
  const setFalse = () => { value.value = false }
  const set = (val: boolean) => { value.value = val }

  return { value, toggle, setTrue, setFalse, set, isActive: value }
}

export function useSwitch(initial = false) {
  const isOn = ref(initial)
  const isOff = computed(() => !isOn.value)

  const turnOn = () => { isOn.value = true }
  const turnOff = () => { isOn.value = false }
  const toggle = () => { isOn.value = !isOn.value }

  return { isOn, isOff, turnOn, turnOff, toggle }
}

export default useToggle
