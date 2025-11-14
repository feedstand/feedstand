export const isOneOfContentTypes = (response: Response | string, contentTypes: Array<string>) => {
  const contentType = typeof response === 'string' ? response : response.headers.get('content-type')
  const lowerContentType = contentType?.toLowerCase()

  return contentTypes.some((type) => lowerContentType?.includes(type))
}

export const extractValueByRegex = async (
  response: Response,
  regex: RegExp,
  options: {
    matchIndex?: number
    chunkOverlap?: number
  } = {},
): Promise<string | false> => {
  const { matchIndex = 0, chunkOverlap = 1000 } = options
  const reader = response.body?.getReader()

  if (!reader) {
    return false
  }

  let buffer = ''
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      const match = regex.exec(buffer)

      if (match) {
        return match[matchIndex] || false
      }

      if (buffer.length > chunkOverlap) {
        buffer = buffer.slice(-chunkOverlap)
        regex.lastIndex = 0
      }
    }

    const match = regex.exec(buffer)

    return match ? match[matchIndex] || false : false
  } finally {
    reader.releaseLock()
  }
}
