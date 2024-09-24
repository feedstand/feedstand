import { swaggerUI } from '@hono/swagger-ui'
import { hono } from '~/instances/hono'

hono.get('/swagger', swaggerUI({ url: '/swagger.json' }))
