import { FetchFeedMiddleware } from '../actions/fetchFeed'

type Signature = {
    test: (response: string) => boolean
    name: string
}

const signatures: Array<Signature> = [
    {
        test: (string: string) => /<!DOCTYPE\s+html/i.test(string),
        name: 'HTML page',
    },
    {
        test: (string: string) => /<html/i.test(string),
        name: 'HTML page',
    },
    {
        test: (string: string) => /<head/i.test(string),
        name: 'HTML page',
    },
    {
        test: (text: string) => text === '',
        name: 'Empty response',
    },
]

export const invalidFeed: FetchFeedMiddleware = async (context, next) => {
    if (!context.response?.ok) {
        return await next()
    }

    const text = await context.response?.clone().text()

    for (const signature of signatures) {
        if (signature.test(text)) {
            throw new Error(`Invalid feed, signature: ${signature.name}`)
        }
    }

    await next()
}
