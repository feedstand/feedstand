import { fetchUrl } from '../../actions/fetchUrl'
import { WorkflowProcessor } from '../../helpers/workflows'

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
