export type StripRange = {
  start: number
  end: number
}

export type CleanHtmlOptions = {
  stripScripts?: boolean
  stripStyles?: boolean
  stripComments?: boolean
}

/**
 * Case-insensitive character comparison using char codes (no string allocation).
 */
const charsEqualIgnoreCase = (charCode: number, patternCode: number): boolean => {
  if (charCode === patternCode) {
    return true
  }

  // A-Z (65-90) to a-z (97-122): charCode + 32 === patternCode
  if (charCode >= 65 && charCode <= 90) {
    return charCode + 32 === patternCode
  }

  // a-z (97-122) to A-Z (65-90): charCode - 32 === patternCode
  if (charCode >= 97 && charCode <= 122) {
    return charCode - 32 === patternCode
  }

  return false
}

/**
 * Case-insensitive indexOf without creating new strings.
 * Optimized to avoid redundant comparisons.
 */
const indexOfIgnoreCase = (string: string, pattern: string, fromIndex: number): number => {
  const patternLength = pattern.length
  const maxPos = string.length - patternLength

  if (patternLength === 0) {
    return fromIndex
  }

  // Pre-compute pattern char codes.
  const firstPatternCode = pattern.charCodeAt(0)

  outer: for (let i = fromIndex; i <= maxPos; i++) {
    // Quick check: first character match.
    if (!charsEqualIgnoreCase(string.charCodeAt(i), firstPatternCode)) {
      continue
    }

    // Check remaining characters.
    for (let j = 1; j < patternLength; j++) {
      if (!charsEqualIgnoreCase(string.charCodeAt(i + j), pattern.charCodeAt(j))) {
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
const matchesAtIgnoreCase = (string: string, position: number, pattern: string): boolean => {
  const patternLength = pattern.length
  if (position + patternLength > string.length) {
    return false
  }

  for (let i = 0; i < patternLength; i++) {
    if (!charsEqualIgnoreCase(string.charCodeAt(position + i), pattern.charCodeAt(i))) {
      return false
    }
  }

  return true
}

/**
 * Generic paired-tag range finder.
 * Finds all ranges between start and end patterns using case-insensitive matching.
 */
const findTagPairRanges = (
  html: string,
  startTag: string,
  endTag: string,
  findOpenTagEnd: boolean,
): Array<StripRange> => {
  const ranges: Array<StripRange> = []
  let i = 0

  while (i < html.length) {
    // Check if current position matches start pattern (case-insensitive).
    if (!matchesAtIgnoreCase(html, i, startTag)) {
      i++
      continue
    }

    const rangeStart = i
    let searchFrom = i + startTag.length

    // For tags like <script> and <style>, find the '>' that closes the opening tag.
    // This handles cases like <script src="..."> or <style type="...">.
    if (findOpenTagEnd) {
      const openTagEnd = html.indexOf('>', i)
      if (openTagEnd === -1) {
        // Unclosed tag: strip from here to end of document
        ranges.push({ start: rangeStart, end: html.length })
        return ranges
      }

      // Check for self-closing tag (e.g., <script src="..." /> or <script />)
      // Look backwards from '>' to find '/', skipping whitespace
      let checkPos = openTagEnd - 1
      while (checkPos >= i && (html[checkPos] === ' ' || html[checkPos] === '\t')) {
        checkPos--
      }
      if (checkPos >= i && html[checkPos] === '/') {
        // Self-closing: strip just this tag
        ranges.push({ start: rangeStart, end: openTagEnd + 1 })
        i = openTagEnd + 1
        continue
      }

      searchFrom = openTagEnd + 1
    }

    // Find the closing pattern (case-insensitive).
    const closeIndex = indexOfIgnoreCase(html, endTag, searchFrom)

    if (closeIndex === -1) {
      // Unclosed tag: strip from here to end of document.
      ranges.push({ start: rangeStart, end: html.length })
      return ranges
    }

    const rangeEnd = closeIndex + endTag.length
    ranges.push({ start: rangeStart, end: rangeEnd })
    i = rangeEnd
  }

  return ranges
}

/**
 * Merge overlapping and adjacent ranges.
 * This optimization reduces the number of segments to process.
 *
 * @example
 * Input:  [{start: 10, end: 20}, {start: 15, end: 25}, {start: 30, end: 40}]
 * Output: [{start: 10, end: 25}, {start: 30, end: 40}]
 */
export const mergeRanges = (ranges: Array<StripRange>): Array<StripRange> => {
  if (ranges.length === 0) return []

  // Sort by start position.
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const merged: Array<StripRange> = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    // Overlapping or adjacent.
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Clean HTML by removing unwanted elements.
 * Memory-efficient: uses range detection and single-pass string building.
 */
export const cleanHtml = (html: string, options: CleanHtmlOptions = {}): string => {
  const allRanges: Array<StripRange> = []

  if (options.stripScripts ?? true) {
    allRanges.push(...findTagPairRanges(html, '<script', '</script>', true))
  }

  if (options.stripStyles ?? true) {
    allRanges.push(...findTagPairRanges(html, '<style', '</style>', true))
  }

  if (options.stripComments ?? true) {
    allRanges.push(...findTagPairRanges(html, '<!--', '-->', false))
  }

  if (allRanges.length === 0) {
    return html
  }

  const mergedRanges = mergeRanges(allRanges)

  const segments: Array<string> = []
  let lastEnd = 0

  for (const range of mergedRanges) {
    // Copy segment before this range.
    if (range.start > lastEnd) {
      segments.push(html.slice(lastEnd, range.start))
    }
    lastEnd = range.end
  }

  // Copy remaining segment.
  if (lastEnd < html.length) {
    segments.push(html.slice(lastEnd))
  }

  return segments.join('')
}
