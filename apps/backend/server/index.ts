import http from 'http'
import Koa from 'koa'
import compress from 'koa-compress'
import Router from '@koa/router'
import * as serverConstants from './constants.js'

export const app = new Koa()
export const router = new Router()
export const server = http.createServer(app.callback())

export const boot = async () => {
    await import('./routes/index.js')
    await import('./routes/health.js')

    app.use(compress()).use(router.routes()).use(router.allowedMethods())

    server.listen(serverConstants.port, serverConstants.host, () => {
        console.log(`Server running on http://${serverConstants.host}:${serverConstants.port}`)
    })
}
