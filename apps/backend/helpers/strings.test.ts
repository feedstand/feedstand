import { describe, expect, it } from 'vitest'
import { isJsonLike, removeNullBytes } from './strings.ts'

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

describe('isJsonLike', () => {
  describe('valid JSON objects', () => {
    it('should identify simple JSON object', () => {
      expect(isJsonLike('{"name":"John","age":30}')).toBe(true)
    })

    it('should identify JSON object with whitespace', () => {
      expect(isJsonLike('  {  "name" : "John"  }  ')).toBe(true)
    })

    it('should identify empty JSON object', () => {
      expect(isJsonLike('{}')).toBe(true)
    })

    it('should identify empty JSON object with whitespace', () => {
      expect(isJsonLike('  {  }  ')).toBe(true)
    })

    it('should identify nested JSON object', () => {
      expect(isJsonLike('{"person":{"name":"John","age":30}}')).toBe(true)
    })

    it('should identify multiline JSON object', () => {
      const json = `{
        "name": "John",
        "age": 30
      }`
      expect(isJsonLike(json)).toBe(true)
    })
  })

  describe('valid JSON arrays', () => {
    it('should identify simple JSON array', () => {
      expect(isJsonLike('[1,2,3]')).toBe(true)
    })

    it('should identify JSON array with whitespace', () => {
      expect(isJsonLike('  [  1, 2, 3  ]  ')).toBe(true)
    })

    it('should identify empty JSON array', () => {
      expect(isJsonLike('[]')).toBe(true)
    })

    it('should identify empty JSON array with whitespace', () => {
      expect(isJsonLike('  [  ]  ')).toBe(true)
    })

    it('should identify array of objects', () => {
      expect(isJsonLike('[{"id":1},{"id":2}]')).toBe(true)
    })

    it('should identify multiline JSON array', () => {
      const json = `[
        {"name": "John"},
        {"name": "Jane"}
      ]`
      expect(isJsonLike(json)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should reject string with JSON-like content embedded', () => {
      expect(isJsonLike('Text before {"name":"John"} text after')).toBe(false)
    })

    it('should reject string with escaped braces', () => {
      expect(isJsonLike('"\\{\\"name\\":\\"John\\"\\}"')).toBe(false)
    })

    it('should reject strings that start with brace but end differently', () => {
      expect(isJsonLike('{ "name": "test" ]')).toBe(false)
    })

    it('should reject strings that start with bracket but end differently', () => {
      expect(isJsonLike('[ 1, 2, 3 }')).toBe(false)
    })
  })

  describe('invalid JSON-like structures', () => {
    it('should reject plain string', () => {
      expect(isJsonLike('Hello World')).toBe(false)
    })

    it('should reject number', () => {
      expect(isJsonLike('42')).toBe(false)
    })

    it('should reject boolean', () => {
      expect(isJsonLike('true')).toBe(false)
    })

    it('should reject null', () => {
      expect(isJsonLike('null')).toBe(false)
    })

    it('should reject unbalanced braces', () => {
      expect(isJsonLike('{"name":"John"')).toBe(false)
    })

    it('should reject unbalanced brackets', () => {
      expect(isJsonLike('[1,2,3')).toBe(false)
    })

    it('should reject mixed opening/closing (braces)', () => {
      expect(isJsonLike('{]')).toBe(false)
    })

    it('should reject mixed opening/closing (brackets)', () => {
      expect(isJsonLike('[}')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isJsonLike('')).toBe(false)
    })

    it('should reject whitespace only', () => {
      expect(isJsonLike('   ')).toBe(false)
    })

    it('should reject too short string', () => {
      expect(isJsonLike('{')).toBe(false)
      expect(isJsonLike('[')).toBe(false)
    })
  })
})
