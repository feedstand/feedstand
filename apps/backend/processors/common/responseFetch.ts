import { fetchUrl } from '../../actions/fetchUrl.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

// biome-ignore lint/suspicious/noExplicitAny: Don't need to explain myself.
export const responseFetch: WorkflowProcessor<any, any> = async (context, next) => {
  if (context.response) {
    return await next()
  }

  try {
    context.response = await fetchUrl(context.url, context.options)
  } catch (error) {
    context.error = error
  }

  await next()
}
