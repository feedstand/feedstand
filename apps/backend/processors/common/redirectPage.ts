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

// biome-ignore lint/suspicious/noExplicitAny: Don't need to explain myself.
export const redirectPage: WorkflowProcessor<any> = async (context, next, self) => {
  if (!context.response?.ok || context.result) {
    return await next()
  }

  const html = await context.response.text()
  const url = extractRedirectUrl(html)

  if (url === context.url) {
    return await next()
  }

  if (url) {
    context.url = url
    context.response = undefined
    context.result = await self(context)
  }

  await next()
}
