import { router } from '../index.js'

router.get('/', (context) => {
    context.type = 'application/json'
    context.status = 200
    context.body = { message: `Hello world! Hash: ${process.env.COMMIT_HASH}` }
})
