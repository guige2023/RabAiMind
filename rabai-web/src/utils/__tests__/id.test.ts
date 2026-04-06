import { describe, it, expect, beforeEach } from 'vitest'
import { generateId, resetIdCounter } from '../id'

describe('id utils', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  it('should generate unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('should include prefix when provided', () => {
    const id = generateId('user')
    expect(id.startsWith('user_')).toBe(true)
  })

  it('should use default prefix when not provided', () => {
    const id = generateId()
    expect(id.startsWith('id_')).toBe(true)
  })

  it('should include timestamp component', () => {
    const before = Date.now().toString(36)
    const id = generateId()
    const after = Date.now().toString(36)
    // Extract timestamp from id (format: prefix_timestamp_random_counter)
    const parts = id.split('_')
    const timestamp = parts[1]
    expect(timestamp.length).toBeGreaterThan(0)
    expect(parseInt(timestamp, 36)).toBeLessThanOrEqual(Date.now())
  })

  it('should generate IDs with random component', () => {
    // IDs should differ even when called quickly
    const ids = new Set()
    for (let i = 0; i < 10; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(10)
  })

  it('should increment counter for sequential calls', () => {
    const id1 = generateId()
    const id2 = generateId()
    const parts1 = id1.split('_')
    const parts2 = id2.split('_')
    // Counter is the last component
    const counter1 = parseInt(parts1[parts1.length - 1])
    const counter2 = parseInt(parts2[parts2.length - 1])
    expect(counter2).toBe(counter1 + 1)
  })
})
