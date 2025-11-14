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
