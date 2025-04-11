import { fetchUrl } from '../../actions/fetchUrl.js'
import type { WorkflowProcessor } from '../../helpers/workflows.js'

export const responseFetch: WorkflowProcessor<unknown> = async (context, next) => {
  if (context.response) {
    return await next()
  }

  try {
    context.response = await fetchUrl(context.url)
  } catch (error) {
    context.error = error
  }

  await next()
}
