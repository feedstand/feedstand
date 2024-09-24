import { hono } from '~/instances/hono'

hono.get('/', async (context) => {
    return context.json({}, 200)
})
