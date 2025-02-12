import { WorkflowProcessor } from '../../actions/createWorkflow'
import { fetchUrl } from '../../actions/fetchUrl'

export const responseFetch: WorkflowProcessor<unknown> = async (context, next) => {
    if (context.response) {
        if (!context.responseText) {
            context.responseText = await context.response.clone().text()
        }

        return await next()
    }

    try {
        context.response = await fetchUrl(context.url)
        context.responseText = await context.response.clone().text()
    } catch (error) {
        context.error = error
    }

    await next()
}
