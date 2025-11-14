import { maxRedirects } from '../../constants/fetchers.ts'
import { cleanHtml } from '../../helpers/html.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

// Compile static regex patterns once at module load.
const metaPattern = /<meta\s+([^>]*)>?/gi
const httpEquivPattern = /\bhttp-equiv\s*=\s*["']?refresh["']?/i
const contentPattern = /\bcontent\s*=\s*["']?\d*\s*;\s*url\s*=\s*([^"'\s>]+)/i

export const extractRedirectUrl = (html: string): string | undefined => {
  const cleaned = cleanHtml(html)

  for (const metaMatch of cleaned.matchAll(metaPattern)) {
    const attrs = metaMatch[1]

    if (!httpEquivPattern.test(attrs)) {
      continue
    }

    const url = contentPattern.exec(attrs)?.[1]?.trim()

    if (url) {
      return url
    }
  }

  return undefined
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
