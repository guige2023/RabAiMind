import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ColorPicker from '../ColorPicker.vue'

describe('ColorPicker.vue', () => {
  it('renders color preview with correct background', () => {
    const wrapper = mount(ColorPicker, {
      props: { modelValue: '#165DFF' }
    })
    const preview = wrapper.find('.color-preview')
    expect(preview.exists()).toBe(true)
    // jsdom normalizes hex to rgb
    expect(preview.attributes('style')).toMatch(/background:\s*(#165DFF|rgb\(22,\s*93,\s*255\))/)
  })

  it('renders color hex value', () => {
    const wrapper = mount(ColorPicker, {
      props: { modelValue: '#ff0000' }
    })
    const hex = wrapper.find('.color-hex')
    expect(hex.exists()).toBe(true)
    expect(hex.text()).toBe('#ff0000')
  })

  it('renders color input with correct value', () => {
    const wrapper = mount(ColorPicker, {
      props: { modelValue: '#00ff00' }
    })
    const input = wrapper.find('input[type="color"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('#00ff00')
  })

  it('emits update:modelValue when input changes', async () => {
    const wrapper = mount(ColorPicker, {
      props: { modelValue: '#ffffff' }
    })
    const input = wrapper.find('input[type="color"]')
    await (input.element as HTMLInputElement).setAttribute('value', '#000000')
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('has color-preview, color-input, and color-hex elements', () => {
    const wrapper = mount(ColorPicker, {
      props: { modelValue: '#abc123' }
    })
    expect(wrapper.find('.color-picker').exists()).toBe(true)
    expect(wrapper.find('.color-preview').exists()).toBe(true)
    expect(wrapper.find('.color-input').exists()).toBe(true)
    expect(wrapper.find('.color-hex').exists()).toBe(true)
  })

  it('renders different colors correctly', () => {
    const colors = ['#000000', '#ffffff', '#165DFF', '#ff0000']
    for (const color of colors) {
      const wrapper = mount(ColorPicker, { props: { modelValue: color } })
      expect(wrapper.find('.color-hex').text()).toBe(color)
    }
  })
})
