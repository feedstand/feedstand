import { Parser } from 'htmlparser2'
import { maxRedirects } from '../../constants/fetchers.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

const urlPattern = /\d*\s*;\s*url\s*=\s*([^"'\s>]+)/i

export const extractRedirectUrl = (html: string): string | undefined => {
  let redirectUrl: string | undefined

  const parser = new Parser({
    onopentag(name, attribs) {
      if (redirectUrl) return

      if (
        name === 'meta' &&
        attribs['http-equiv']?.toLowerCase() === 'refresh' &&
        attribs.content
      ) {
        const match = urlPattern.exec(attribs.content)
        if (match?.[1]) {
          redirectUrl = match[1].trim()
        }
      }
    },
  })

  parser.write(html)
  parser.end()

  return redirectUrl
}

const redirectDepths = new WeakMap<object, number>()

// biome-ignore lint/suspicious/noExplicitAny: Don't need to explain myself.
export const redirectPage: WorkflowProcessor<any, any> = async (context, next, self) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  const redirectDepth = (redirectDepths.get(context) || 0) + 1

  if (redirectDepth > maxRedirects) {
    console.warn('[SECURITY] Max redirect depth exceeded:', {
      url: context.url,
      depth: redirectDepth,
    })
    return await next()
  }

  const html = await context.response.text()
  const rawUrl = extractRedirectUrl(html)

  if (!rawUrl || rawUrl === context.url) {
    return await next()
  }

  const preparedUrl = prepareUrl(rawUrl, {
    base: context.response.url,
    validate: true,
  })

  if (!preparedUrl) {
    console.warn('[SECURITY] Meta refresh to invalid/unsafe URL blocked:', {
      from: context.url,
      originalTo: rawUrl,
      preparedTo: preparedUrl,
    })
    return await next()
  }

  if (preparedUrl === context.response.url) {
    return await next()
  }

  redirectDepths.set(context, redirectDepth)
  context.url = preparedUrl
  context.response = undefined
  context.result = await self(context)

  await next()
}
