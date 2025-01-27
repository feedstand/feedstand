import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { path } from '../constants/bullBoard'
import { channelQueue } from '../queues/channel'
import { channelsQueue } from '../queues/channels'

export const serverAdapter = new HonoAdapter(serveStatic).setBasePath(path)

export const bullBoard = createBullBoard({
    queues: [new BullMQAdapter(channelsQueue), new BullMQAdapter(channelQueue)],
    serverAdapter,
})

export const routeHandler = serverAdapter.registerPlugin()
