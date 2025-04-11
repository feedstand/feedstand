import { describe, expect, it } from 'vitest'
import { isJson, removeNullBytes } from './strings.js'

describe('removeNullBytes', () => {
  describe('string inputs', () => {
    it('should handle regular string', () => {
      const input = 'Hello, World!'
      const expected = 'Hello, World!'

      expect(removeNullBytes(input)).toBe(expected)
    })

    it('should handle empty string', () => {
      const input = ''
      const expected = ''

      expect(removeNullBytes(input)).toBe(expected)
    })
  })

  describe('null byte handling', () => {
    it('should remove single NULL byte', () => {
      const input = 'Hello\0World'
      const expected = 'HelloWorld'

      expect(removeNullBytes(input)).toBe(expected)
    })

    it('should remove multiple NULL bytes', () => {
      const input = 'Hello\0\0World\0!'
      const expected = 'HelloWorld!'

      expect(removeNullBytes(input)).toBe(expected)
    })

    it('should handle string with only NULL bytes', () => {
      const input = '\0\0\0'
      const expected = ''

      expect(removeNullBytes(input)).toBe(expected)
    })
  })

  describe('non-string inputs', () => {
    it('should handle number', () => {
      const input = 123
      const expected = '123'

      expect(removeNullBytes(input)).toBe(expected)
    })

    it('should handle null', () => {
      const input = null
      const expected = 'null'

      expect(removeNullBytes(input)).toBe(expected)
    })

    it('should handle undefined', () => {
      const input = undefined
      const expected = 'undefined'

      expect(removeNullBytes(input)).toBe(expected)
    })
  })
})

describe('isJson', () => {
  describe('valid JSON objects', () => {
    it('should identify simple JSON object', () => {
      expect(isJson('{"name":"John","age":30}')).toBe(true)
    })

    it('should identify JSON object with whitespace', () => {
      expect(isJson('  {  "name" : "John"  }  ')).toBe(true)
    })

    it('should identify empty JSON object', () => {
      expect(isJson('{}')).toBe(true)
    })

    it('should identify empty JSON object with whitespace', () => {
      expect(isJson('  {  }  ')).toBe(true)
    })

    it('should identify nested JSON object', () => {
      expect(isJson('{"person":{"name":"John","age":30}}')).toBe(true)
    })

    it('should identify multiline JSON object', () => {
      const json = `{
        "name": "John",
        "age": 30
      }`
      expect(isJson(json)).toBe(true)
    })
  })

  describe('valid JSON arrays', () => {
    it('should identify simple JSON array', () => {
      expect(isJson('[1,2,3]')).toBe(true)
    })

    it('should identify JSON array with whitespace', () => {
      expect(isJson('  [  1, 2, 3  ]  ')).toBe(true)
    })

    it('should identify empty JSON array', () => {
      expect(isJson('[]')).toBe(true)
    })

    it('should identify empty JSON array with whitespace', () => {
      expect(isJson('  [  ]  ')).toBe(true)
    })

    it('should identify array of objects', () => {
      expect(isJson('[{"id":1},{"id":2}]')).toBe(true)
    })

    it('should identify multiline JSON array', () => {
      const json = `[
        {"name": "John"},
        {"name": "Jane"}
      ]`
      expect(isJson(json)).toBe(true)
    })
  })

  describe('invalid JSON', () => {
    it('should reject plain string', () => {
      expect(isJson('Hello World')).toBe(false)
    })

    it('should reject number', () => {
      expect(isJson('42')).toBe(false)
    })

    it('should reject boolean', () => {
      expect(isJson('true')).toBe(false)
    })

    it('should reject null', () => {
      expect(isJson('null')).toBe(false)
    })

    it('should reject unbalanced braces', () => {
      expect(isJson('{"name":"John"')).toBe(false)
    })

    it('should reject unbalanced brackets', () => {
      expect(isJson('[1,2,3')).toBe(false)
    })

    it('should reject mixed opening/closing', () => {
      expect(isJson('{]')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isJson('')).toBe(false)
    })

    it('should reject whitespace only', () => {
      expect(isJson('   ')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle string with JSON-like content', () => {
      expect(isJson('Text before {"name":"John"} text after')).toBe(false)
    })

    it('should handle string with escaped braces', () => {
      expect(isJson('"\\{\\"name\\":\\"John\\"\\}"')).toBe(false)
    })
  })
})
