import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { path } from '../constants/bullBoard.js'
import { channelQueue } from '../queues/channel.js'
import { channelsQueue } from '../queues/channels.js'

export const serverAdapter = new HonoAdapter(serveStatic).setBasePath(path)

export const bullBoard = createBullBoard({
  queues: [new BullMQAdapter(channelsQueue), new BullMQAdapter(channelQueue)],
  serverAdapter,
})

export const routeHandler = serverAdapter.registerPlugin()
