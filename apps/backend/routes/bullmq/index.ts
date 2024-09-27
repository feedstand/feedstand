import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { hono } from '../../instances/hono'
import { channelsQueue } from '../../queues/channels'

const serverAdapter = new HonoAdapter(serveStatic)

createBullBoard({
    queues: [new BullMQAdapter(channelsQueue)],
    serverAdapter,
})

serverAdapter.setBasePath('/bullmq')
hono.route('/bullmq', serverAdapter.registerPlugin())
