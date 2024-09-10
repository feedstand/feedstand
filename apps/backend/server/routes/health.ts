import { router } from '../index.js'

router.get('/health', (context) => {
    context.status = 200
})
