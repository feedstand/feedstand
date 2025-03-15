import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ZodError } from 'zod'
import { validate } from './index'

const readOpmlFile = (filename: string) => {
  return readFileSync(join(__dirname, '../fixtures', filename), 'utf-8')
}

const hasError = (error: ZodError | undefined, path: string) => {
  return error?.issues.some((issue) => issue.path.join('.') === path)
}

describe('validate', () => {
  it('should validate category OPML exactly', () => {
    const xml = readOpmlFile('category.opml')
    const result = validate(xml)

    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate directory OPML exactly', () => {
    const xml = readOpmlFile('directory.opml')
    const result = validate(xml)

    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate places OPML exactly', () => {
    const xml = readOpmlFile('places.opml')
    const result = validate(xml)

    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate script OPML exactly', () => {
    const xml = readOpmlFile('script.opml')
    const result = validate(xml)

    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate countries OPML exactly', () => {
    const xml = readOpmlFile('countries.opml')
    const result = validate(xml)

    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate subscriptions OPML exactly', () => {
    const xml = readOpmlFile('subscriptions.opml')
    const result = validate(xml)

    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
