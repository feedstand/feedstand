export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const removeNullBytes = (value: unknown): string => {
  return String(value).replace(/\0/g, '')
}

export const isJsonLike = (value: string): boolean => {
  if (value.length < 2) {
    return false
  }

  return (
    (/^\s*\{/.test(value) && /\}\s*$/.test(value)) || (/^\s*\[/.test(value) && /\]\s*$/.test(value))
  )
}

/**
 * Case-insensitive character comparison using char codes (no string allocation).
 */
const charsEqualIgnoreCase = (charCode: number, patternCode: number): boolean => {
  if (charCode === patternCode) return true
  // A-Z (65-90) to a-z (97-122): charCode + 32 === patternCode
  if (charCode >= 65 && charCode <= 90) return charCode + 32 === patternCode
  // a-z (97-122) to A-Z (65-90): charCode - 32 === patternCode
  if (charCode >= 97 && charCode <= 122) return charCode - 32 === patternCode
  return false
}

/**
 * Case-insensitive indexOf without creating new strings.
 * Optimized to avoid redundant comparisons.
 */
const indexOfIgnoreCase = (str: string, pattern: string, fromIndex: number): number => {
  const patternLen = pattern.length
  const maxPos = str.length - patternLen

  if (patternLen === 0) return fromIndex

  // Pre-compute pattern char codes
  const firstPatternCode = pattern.charCodeAt(0)

  outer: for (let i = fromIndex; i <= maxPos; i++) {
    // Quick check: first character match
    if (!charsEqualIgnoreCase(str.charCodeAt(i), firstPatternCode)) continue

    // Check remaining characters
    for (let j = 1; j < patternLen; j++) {
      if (!charsEqualIgnoreCase(str.charCodeAt(i + j), pattern.charCodeAt(j))) {
        continue outer
      }
    }

    return i
  }

  return -1
}

/**
 * Case-insensitive string match at specific position without creating new strings.
 */
const matchesAtIgnoreCase = (str: string, pos: number, pattern: string): boolean => {
  const patternLen = pattern.length
  if (pos + patternLen > str.length) return false

  for (let i = 0; i < patternLen; i++) {
    if (!charsEqualIgnoreCase(str.charCodeAt(pos + i), pattern.charCodeAt(i))) {
      return false
    }
  }

  return true
}

/**
 * Roughly remove script tags, style tags, and HTML comments without regex backtracking.
 * Uses linear-time string scanning instead of regex to avoid catastrophic backtracking on large files.
 * Note: This is a simple heuristic and not a full HTML parser. It may incorrectly match
 * patterns like </script> that appear inside JavaScript strings or comments.
 */
export const roughlyCleanHtml = (html: string): string => {
  let result = ''
  let i = 0

  while (i < html.length) {
    // Check for HTML comments: <!-- ... -->
    if (html.substring(i, i + 4) === '<!--') {
      const end = html.indexOf('-->', i + 4)
      if (end === -1) break // Unclosed comment, stop processing
      i = end + 3
      continue
    }

    // Check for script tags: <script...>...</script>
    if (matchesAtIgnoreCase(html, i, '<script')) {
      // Find the end of opening tag
      const openTagEnd = html.indexOf('>', i)
      if (openTagEnd === -1) break

      // Find closing </script> (case-insensitive)
      const closeTagStart = indexOfIgnoreCase(html, '</script>', openTagEnd)
      if (closeTagStart === -1) break

      i = closeTagStart + 9 // Skip past </script>
      continue
    }

    // Check for style tags: <style...>...</style>
    if (matchesAtIgnoreCase(html, i, '<style')) {
      // Find the end of opening tag
      const openTagEnd = html.indexOf('>', i)
      if (openTagEnd === -1) break

      // Find closing </style> (case-insensitive)
      const closeTagStart = indexOfIgnoreCase(html, '</style>', openTagEnd)
      if (closeTagStart === -1) break

      i = closeTagStart + 8 // Skip past </style>
      continue
    }

    result += html[i]
    i++
  }

  return result
}
