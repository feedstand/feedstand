import { describe, expect, it } from 'vitest'
import { cleanHtml, mergeRanges } from './html.ts'

describe('mergeRanges', () => {
  it('should return empty array for empty input', () => {
    expect(mergeRanges([])).toEqual([])
  })

  it('should return single range unchanged', () => {
    expect(mergeRanges([{ start: 10, end: 20 }])).toEqual([{ start: 10, end: 20 }])
  })

  it('should merge overlapping ranges', () => {
    const input = [
      { start: 10, end: 20 },
      { start: 15, end: 25 },
    ]
    expect(mergeRanges(input)).toEqual([{ start: 10, end: 25 }])
  })

  it('should merge adjacent ranges', () => {
    const input = [
      { start: 10, end: 20 },
      { start: 20, end: 30 },
    ]
    expect(mergeRanges(input)).toEqual([{ start: 10, end: 30 }])
  })

  it('should not merge non-overlapping ranges', () => {
    const input = [
      { start: 10, end: 20 },
      { start: 30, end: 40 },
    ]
    expect(mergeRanges(input)).toEqual([
      { start: 10, end: 20 },
      { start: 30, end: 40 },
    ])
  })

  it('should merge multiple overlapping ranges', () => {
    const input = [
      { start: 10, end: 20 },
      { start: 15, end: 25 },
      { start: 22, end: 35 },
    ]
    expect(mergeRanges(input)).toEqual([{ start: 10, end: 35 }])
  })

  it('should handle unsorted input', () => {
    const input = [
      { start: 30, end: 40 },
      { start: 10, end: 20 },
      { start: 15, end: 25 },
    ]
    expect(mergeRanges(input)).toEqual([
      { start: 10, end: 25 },
      { start: 30, end: 40 },
    ])
  })

  it('should handle nested ranges', () => {
    const input = [
      { start: 10, end: 50 },
      { start: 20, end: 30 },
    ]
    expect(mergeRanges(input)).toEqual([{ start: 10, end: 50 }])
  })
})

describe('cleanHtml', () => {
  describe('default behavior (all enabled)', () => {
    it('should remove scripts by default', () => {
      const html = 'before<script>evil</script>after'
      expect(cleanHtml(html)).toBe('beforeafter')
    })

    it('should remove styles by default', () => {
      const html = 'before<style>.evil{}</style>after'
      expect(cleanHtml(html)).toBe('beforeafter')
    })

    it('should remove comments by default', () => {
      const html = 'before<!-- comment -->after'
      expect(cleanHtml(html)).toBe('beforeafter')
    })

    it('should remove all types together', () => {
      const html = '<!-- comment --><script>code</script><style>css</style><div>Content</div>'
      expect(cleanHtml(html)).toBe('<div>Content</div>')
    })
  })

  describe('selective stripping', () => {
    it('should strip only scripts when specified', () => {
      const html = '<script>js</script><!--comment--><style>css</style>'
      expect(
        cleanHtml(html, {
          stripScripts: true,
          stripStyles: false,
          stripComments: false,
        }),
      ).toBe('<!--comment--><style>css</style>')
    })

    it('should strip only styles when specified', () => {
      const html = '<script>js</script><!--comment--><style>css</style>'
      expect(
        cleanHtml(html, {
          stripScripts: false,
          stripStyles: true,
          stripComments: false,
        }),
      ).toBe('<script>js</script><!--comment-->')
    })

    it('should strip only comments when specified', () => {
      const html = '<script>js</script><!--comment--><style>css</style>'
      expect(
        cleanHtml(html, {
          stripScripts: false,
          stripStyles: false,
          stripComments: true,
        }),
      ).toBe('<script>js</script><style>css</style>')
    })

    it('should strip nothing when all disabled', () => {
      const html = '<script>js</script><!--comment--><style>css</style>'
      expect(
        cleanHtml(html, {
          stripScripts: false,
          stripStyles: false,
          stripComments: false,
        }),
      ).toBe(html)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(cleanHtml('')).toBe('')
    })

    it('should handle plain text without tags', () => {
      const html = 'Just plain text'
      expect(cleanHtml(html)).toBe('Just plain text')
    })

    it('should preserve other HTML tags', () => {
      const html = '<div><p>Text</p><span>More</span></div>'
      expect(cleanHtml(html)).toBe('<div><p>Text</p><span>More</span></div>')
    })

    it('should handle overlapping ranges', () => {
      const html = '<script><!--nested--></script>'
      expect(cleanHtml(html)).toBe('')
    })

    it('should return original if nothing to strip', () => {
      const html = '<div>content</div>'
      expect(cleanHtml(html)).toBe(html)
    })
  })

  describe('self-closing tags', () => {
    it('should strip self-closing script tags', () => {
      const html = '<script src="app.js" /><div>text</div>'
      expect(cleanHtml(html)).toBe('<div>text</div>')
    })

    it('should strip self-closing style tags', () => {
      const html = '<style type="text/css" /><div>content</div>'
      expect(cleanHtml(html)).toBe('<div>content</div>')
    })

    it('should strip multiple self-closing tags', () => {
      const html = '<script src="a.js" /><p>Text</p><script src="b.js" />'
      expect(cleanHtml(html)).toBe('<p>Text</p>')
    })

    it('should handle self-closing tags with spaces before slash', () => {
      const html = '<script src="app.js"  /><div>text</div>'
      expect(cleanHtml(html)).toBe('<div>text</div>')
    })

    it('should handle self-closing tags with multiple spaces before slash', () => {
      const html = '<script src="app.js"     /><div>text</div>'
      expect(cleanHtml(html)).toBe('<div>text</div>')
    })

    it('should handle self-closing tags with tabs before slash', () => {
      const html = '<script src="app.js"\t\t/><div>text</div>'
      expect(cleanHtml(html)).toBe('<div>text</div>')
    })

    it('should handle mix of self-closing and regular tags', () => {
      const html = '<script src="a.js" /><script>code</script><div>text</div>'
      expect(cleanHtml(html)).toBe('<div>text</div>')
    })
  })

  describe('unhandled cases', () => {
    it('may incorrectly match script tags inside JavaScript strings', () => {
      // This is a known limitation - we use simple pattern matching, not full parsing
      const html = '<script>const html = "</script><div>This gets removed</div>";</script>'
      // The function will incorrectly find </script> inside the string
      // A full HTML parser would handle this correctly, but that's not our goal
      const result = cleanHtml(html)
      expect(result).not.toBe('') // Shows the limitation
    })

    it('may incorrectly match tags in HTML entity-encoded content', () => {
      // Pattern matching doesn't decode entities
      const html = '<div>&lt;script&gt;encoded&lt;/script&gt;</div>'
      // This should be preserved (it's encoded), and it is - but documenting the behavior
      expect(cleanHtml(html)).toBe(html)
    })

    it('may incorrectly handle CDATA sections', () => {
      // CDATA sections can contain unescaped < and > which might confuse pattern matching
      const html = '<script><![CDATA[var x = "<style>test</style>";]]></script>'
      // Simple pattern matching can't handle CDATA properly
      const result = cleanHtml(html)
      // Documenting that this is not fully handled
      expect(result).toBeDefined()
    })

    it('does not validate HTML structure', () => {
      // We don't validate nesting or structure
      const html = '<script><div><script>nested</div></script>'
      // This malformed HTML will be processed, but results may be unexpected
      const result = cleanHtml(html)
      expect(result).toBeDefined()
    })

    it('may have issues with unusual whitespace in tags', () => {
      // Extreme whitespace cases might not be handled
      const html = '<  script  >code</script>'
      // Pattern looks for '<script' specifically
      const result = cleanHtml(html)
      expect(result).toBe(html) // Won't match, whitespace between < and tag name
    })
  })
})
