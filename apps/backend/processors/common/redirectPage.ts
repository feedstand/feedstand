import { isSafePublicUrl, resolveRelativeUrl } from '../../helpers/urls.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

export const extractRedirectUrl = (html: string): string | undefined => {
  const metaRegex = /<meta[^>]*?(?=.*?http-equiv\b)(?=.*?refresh\b)[^>]*>/i
  const [metaTag] = html.match(metaRegex) || []

  if (!metaTag) {
    return undefined
  }

  const contentRegex = /content=["']?\d*\s*;\s*url=(.*?)["'\s>]/i
  const [, contentAttr] = metaTag.match(contentRegex) || []

  return contentAttr || undefined
}

const redirectDepths = new WeakMap<object, number>()
const maxRedirects = 5

// biome-ignore lint/suspicious/noExplicitAny: Don't need to explain myself.
export const redirectPage: WorkflowProcessor<any> = async (context, next, self) => {
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

  const resolvedUrl = resolveRelativeUrl(rawUrl, context.response.url)

  if (!isSafePublicUrl(resolvedUrl)) {
    console.warn('[SECURITY] Meta refresh to internal resource blocked:', {
      from: context.url,
      to: resolvedUrl,
    })
    return await next()
  }

  redirectDepths.set(context, redirectDepth)
  context.url = resolvedUrl
  context.response = undefined
  context.result = await self(context)

  await next()
}
