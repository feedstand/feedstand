import { router } from '~/instances/server.js'

router.get('/health', (context) => {
    context.status = 200
})
