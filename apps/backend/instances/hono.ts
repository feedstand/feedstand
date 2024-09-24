import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { isDev } from '~/constants/app'

export const hono = new Hono()

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
