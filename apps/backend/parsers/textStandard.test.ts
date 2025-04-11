import { describe, expect, it } from 'vitest'
import { textStandard } from './textStandard.js'

describe('textStandard', () => {
  it('should return string value when input is string', () => {
    expect(textStandard('hello')).toBe('hello')
  })

  it('should return string value when input is an empty string', () => {
    expect(textStandard('')).toBe('')
  })

  it('should return undefined for number input', () => {
    expect(textStandard(123)).toBeUndefined()
  })

  it('should return undefined for boolean input', () => {
    expect(textStandard(true)).toBeUndefined()
  })

  it('should return undefined for object input', () => {
    expect(textStandard({})).toBeUndefined()
  })

  it('should return undefined for array input', () => {
    expect(textStandard([])).toBeUndefined()
  })

  it('should return undefined for null input', () => {
    expect(textStandard(null)).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(textStandard(undefined)).toBeUndefined()
  })
})
