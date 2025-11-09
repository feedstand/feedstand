import { RateLimitError } from '../../errors/RateLimitError.ts'
import { getRateLimitDuration, markRateLimited } from '../../helpers/rateLimits.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

const signatures = [
  { status: 429, name: 'Rate limit', fallbackDuration: 300 },
  { status: 403, domain: 'github.com', name: 'GitHub', fallbackDuration: 600 },
  { status: 403, domain: 'github.io', name: 'GitHub', fallbackDuration: 600 },
]

// biome-ignore lint/suspicious/noExplicitAny: Don't need to explain myself.
export const rateLimitedPage: WorkflowProcessor<any> = async (context, next) => {
  if (!context.response || context.result) {
    return await next()
  }

  const status = context.response.status
  const url = context.response.url
  const hostname = new URL(url).hostname

  for (const signature of signatures) {
    const statusMatches = status === signature.status
    const domainMatches =
      !signature.domain ||
      hostname === signature.domain ||
      hostname.endsWith(`.${signature.domain}`)

    if (statusMatches && domainMatches) {
      const durationInSeconds = getRateLimitDuration(
        context.response.headers,
        signature.fallbackDuration,
      )
      await markRateLimited(url, durationInSeconds)
      throw new RateLimitError(url, signature.name)
    }
  }

  await next()
}
