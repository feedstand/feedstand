import { swaggerUI } from '@hono/swagger-ui'
import { version } from '../../constants/app'
import { hono } from '../../instances/hono'

hono.get('/swagger', swaggerUI({ url: '/swagger.json' }))

hono.doc31('/swagger.json', {
    openapi: '3.1.0',
    info: {
        title: 'Feedstand API',
        version,
    },
    tags: [{ name: 'General' }, { name: 'Channels' }, { name: 'Sources' }, { name: 'Items' }],
})
