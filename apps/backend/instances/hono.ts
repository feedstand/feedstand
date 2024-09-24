import { OpenAPIHono } from '@hono/zod-openapi'
import { compress } from 'hono/compress'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { isDev, version } from '~/constants/app'

export const hono = new OpenAPIHono({
    defaultHook: (result) => {
        if (!result.success) {
            // If request validation fails, just kick the can further down the road. Any exceptions
            // will be handled by the global error handler defined in `hono.onError`.
            throw result.error
        }
    },
})

hono.doc31('/swagger.json', {
    openapi: '3.1.0',
    info: {
        title: 'Feedstand API',
        version,
    },
    tags: [{ name: 'General' }, { name: 'Channels' }, { name: 'Sources' }, { name: 'Items' }],
})

hono.use('*', compress())

hono.onError((error, context) => {
    if (error instanceof HTTPException) {
        return context.json({ message: error.message, cause: error.cause }, error.status)
    }

    if (error instanceof ZodError) {
        return context.json({ cause: error.issues }, 422)
    }

    return isDev
        ? context.json({ message: error.message, cause: error.cause }, 500)
        : context.json({ message: 'Something went wrong' }, 500)
})
