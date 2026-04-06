import { describe, it, expect } from 'vitest'
import { isValidHex, normalizeHex, hexToRgb, rgbToHex } from '../color'

describe('color utils', () => {
  describe('isValidHex', () => {
    it('should accept valid 6-digit hex colors', () => {
      expect(isValidHex('#ffffff')).toBe(true)
      expect(isValidHex('#000000')).toBe(true)
      expect(isValidHex('#165DFF')).toBe(true)
      expect(isValidHex('#abc123')).toBe(true)
    })

    it('should accept valid 3-digit hex colors', () => {
      expect(isValidHex('#fff')).toBe(true)
      expect(isValidHex('#000')).toBe(true)
      expect(isValidHex('#f00')).toBe(true)
      expect(isValidHex('#abc')).toBe(true)
    })

    it('should accept uppercase hex colors', () => {
      expect(isValidHex('#FFF')).toBe(true)
      expect(isValidHex('#ABC123')).toBe(true)
    })

    it('should reject invalid hex colors', () => {
      expect(isValidHex('#gggggg')).toBe(false)
      expect(isValidHex('#ffffff00')).toBe(false)
      expect(isValidHex('#fff00')).toBe(false)
      expect(isValidHex('ffffff')).toBe(false)
      expect(isValidHex('#FF')).toBe(false)
      expect(isValidHex('')).toBe(false)
      expect(isValidHex(null as any)).toBe(false)
      expect(isValidHex(undefined as any)).toBe(false)
    })
  })

  describe('normalizeHex', () => {
    it('should normalize 3-digit hex to 6-digit', () => {
      expect(normalizeHex('#fff')).toBe('#ffffff')
      expect(normalizeHex('#f00')).toBe('#ff0000')
      expect(normalizeHex('#abc')).toBe('#aabbcc')
    })

    it('should keep 6-digit hex unchanged', () => {
      expect(normalizeHex('#ffffff')).toBe('#ffffff')
      expect(normalizeHex('#165DFF')).toBe('#165DFF')
    })

    it('should return invalid colors unchanged', () => {
      expect(normalizeHex('#ggg')).toBe('#ggg')
      expect(normalizeHex('red')).toBe('red')
    })
  })

  describe('hexToRgb', () => {
    it('should convert valid hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
      expect(hexToRgb('#165DFF')).toEqual({ r: 22, g: 93, b: 255 })
    })

    it('should handle 3-digit hex', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('should return null for invalid hex', () => {
      expect(hexToRgb('#ggg')).toBeNull()
      expect(hexToRgb('red')).toBeNull()
    })
  })

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
      expect(rgbToHex(0, 0, 0)).toBe('#000000')
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00')
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff')
      expect(rgbToHex(22, 93, 255)).toBe('#165dff')
    })

    it('should clamp values to 0-255 range', () => {
      expect(rgbToHex(300, -10, 128)).toBe('#ff0080')
    })
  })
})
