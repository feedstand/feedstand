import { describe, expect, it } from 'vitest'
import { isJsonLike, removeNullBytes, roughlyCleanHtml } from './strings.ts'

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
})

describe('roughlyCleanHtml', () => {
  it('should remove HTML comments', () => {
    const html = '<div>Hello <!-- comment --> World</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>Hello  World</div>')
  })

  it('should remove multiple HTML comments', () => {
    const html = '<!-- comment 1 --><p>Text</p><!-- comment 2 -->'
    expect(roughlyCleanHtml(html)).toBe('<p>Text</p>')
  })

  it('should remove script tags and content', () => {
    const html = '<div>Before<script>alert("test")</script>After</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>BeforeAfter</div>')
  })

  it('should remove script tags with attributes', () => {
    const html = '<div>Before<script type="text/javascript">var x = 1;</script>After</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>BeforeAfter</div>')
  })

  it('should remove style tags and content', () => {
    const html = '<div>Before<style>.class { color: red; }</style>After</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>BeforeAfter</div>')
  })

  it('should remove style tags with attributes', () => {
    const html = '<div>Before<style type="text/css">.class { color: red; }</style>After</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>BeforeAfter</div>')
  })

  it('should handle multiple script and style tags', () => {
    const html = '<script>x</script><p>Text</p><style>y</style><span>More</span><script>z</script>'
    expect(roughlyCleanHtml(html)).toBe('<p>Text</p><span>More</span>')
  })

  it('should handle all types together', () => {
    const html = '<!-- comment --><script>code</script><style>css</style><div>Content</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>Content</div>')
  })

  it('should handle unclosed comments gracefully', () => {
    const html = '<div>Before<!-- unclosed comment'
    expect(roughlyCleanHtml(html)).toBe('<div>Before')
  })

  it('should handle unclosed script tags gracefully', () => {
    const html = '<div>Before<script>unclosed'
    expect(roughlyCleanHtml(html)).toBe('<div>Before')
  })

  it('should handle unclosed style tags gracefully', () => {
    const html = '<div>Before<style>unclosed'
    expect(roughlyCleanHtml(html)).toBe('<div>Before')
  })

  it('should handle empty string', () => {
    expect(roughlyCleanHtml('')).toBe('')
  })

  it('should handle plain text without tags', () => {
    const html = 'Just plain text'
    expect(roughlyCleanHtml(html)).toBe('Just plain text')
  })

  it('should preserve other HTML tags', () => {
    const html = '<div><p>Text</p><span>More</span></div>'
    expect(roughlyCleanHtml(html)).toBe('<div><p>Text</p><span>More</span></div>')
  })

  it('should handle case-insensitive script tags', () => {
    const html = '<div>Before<SCRIPT>code</SCRIPT>After</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>BeforeAfter</div>')
  })

  it('should handle case-insensitive style tags', () => {
    const html = '<div>Before<STYLE>css</STYLE>After</div>'
    expect(roughlyCleanHtml(html)).toBe('<div>BeforeAfter</div>')
  })

  it('should handle nested structures efficiently', () => {
    const html =
      '<div><!-- start --><script>var x = "<style>nested</style>";</script><!-- end --></div>'
    expect(roughlyCleanHtml(html)).toBe('<div></div>')
  })
})
