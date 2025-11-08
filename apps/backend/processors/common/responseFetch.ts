import { fetchUrl } from '../../actions/fetchUrl.ts'
import type { WorkflowProcessor } from '../../helpers/workflows.ts'

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
