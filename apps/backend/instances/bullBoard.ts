import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { path } from '../constants/bullBoard.ts'
import { channelQueue } from '../queues/channel.ts'
import { channelsQueue } from '../queues/channels.ts'

export const serverAdapter = new HonoAdapter(serveStatic).setBasePath(path)

export const bullBoard = createBullBoard({
  queues: [new BullMQAdapter(channelsQueue), new BullMQAdapter(channelQueue)],
  serverAdapter,
})

export const routeHandler = serverAdapter.registerPlugin()
