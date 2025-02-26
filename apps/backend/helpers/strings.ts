export const removeNullBytes = (value: unknown): string => {
  return String(value).replace(/\0/g, '')
}

export const isJson = (value: string): boolean => {
  // Matches strings that start with { or [ and end with } or ] respectively,
  // ignoring any whitespace before or after.
  const jsonRegex = /^\s*(?:\{[\s\S]*\}|\[[\s\S]*\])\s*$/

  if (!jsonRegex.test(value)) {
    return false
  }

  try {
    JSON.parse(value)

    return true
  } catch (error) {
    return false
  }
}
