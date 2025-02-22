import { FetchFeedProcessor } from '../../actions/fetchFeed'

type Signature = {
  test: (response: string) => boolean
  name: string
}

const signatures: Array<Signature> = [
  {
    test: (string: string) => /<!DOCTYPE\s+html|<(?:html|head|body)/i.test(string),
    name: 'HTML page',
  },
  {
    test: (string: string) => /^[^<>]+$/u.test(string),
    name: 'Plain text',
  },
  {
    test: (string: string) => string === '',
    name: 'Empty response',
  },
]

export const invalidFeed: FetchFeedProcessor = async (context, next) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  const text = await context.response.text()

  for (const signature of signatures) {
    if (signature.test(text)) {
      throw new Error(`Invalid feed, signature: ${signature.name}`)
    }
  }

  await next()
}
