import compress from 'koa-compress'
import * as serverConstants from '~/constants/server.js'
import { app, router, server } from './instances/server.js'

const boot = async () => {
    await import('~/routes/index.js')
    await import('~/routes/health.js')

    app.use(compress()).use(router.routes()).use(router.allowedMethods())

    server.listen(serverConstants.port, serverConstants.host, () => {
        console.log(`Server running on http://${serverConstants.host}:${serverConstants.port}`)
    })
}

boot()
