export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

export const removeNullBytes = (value: unknown): string => {
  return String(value).replace(/\0/g, '')
}

export const isJsonLike = (value: string): boolean => {
  // Matches strings that start with { or [ and end with } or ] respectively,
  // ignoring any whitespace before or after.
  const jsonRegex = /^\s*(?:\{[\s\S]*\}|\[[\s\S]*\])\s*$/

  return jsonRegex.test(value)
}

export const isJson = (value: string): boolean => {
  if (!isJsonLike(value)) {
    return false
  }

  try {
    JSON.parse(value)

    return true
  } catch {
    return false
  }
}
