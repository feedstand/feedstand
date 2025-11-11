import { maxRedirects } from '../../constants/fetchers.ts'
import { prepareUrl } from '../../helpers/urls.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

// Compile static regex patterns once at module load.
const cleanupPattern = /<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi
const metaPattern = /<meta\s+([^>]*)>?/gi
const httpEquivPattern = /\bhttp-equiv\s*=\s*["']?refresh["']?/i
const contentPattern = /\bcontent\s*=\s*["']?\d*\s*;\s*url\s*=\s*([^"'\s>]+)/i

export const extractRedirectUrl = (html: string): string | undefined => {
  // Remove comments, scripts, and styles in single pass.
  const cleanHtml = html.replace(cleanupPattern, '')

  // Match meta tags with http-equiv="refresh"
  for (const metaMatch of cleanHtml.matchAll(metaPattern)) {
    const attrs = metaMatch[1]

    // Check if has http-equiv="refresh"
    if (!httpEquivPattern.test(attrs)) continue

    // Extract URL from content attribute
    const url = contentPattern.exec(attrs)?.[1]?.trim()

    if (url) return url
  }

  return undefined
}

const redirectDepths = new WeakMap<object, number>()

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
