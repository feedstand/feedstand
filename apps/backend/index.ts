import http from 'http'
import Koa from 'koa'
import compress from 'koa-compress'
import Router from '@koa/router'

const PORT = process.env.PORT || 4001

const app = new Koa()
const router = new Router()

router.get('/', (context) => {
    context.type = 'application/json'
    context.status = 200
    context.body = { message: `Hello world! Hash: ${process.env.COMMIT_HASH}` }
})

router.get('/health', (context) => {
    context.status = 200
})

app.use(compress()).use(router.routes()).use(router.allowedMethods())

const server = http.createServer(app.callback())

server.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`)
})
