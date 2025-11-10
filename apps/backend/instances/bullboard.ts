import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { path } from '../constants/bullboard.ts'
import { channelQueue } from '../queues/channel.ts'
import { channelsQueue } from '../queues/channels.ts'
import { importQueue } from '../queues/import.ts'

export const serverAdapter = new HonoAdapter(serveStatic).setBasePath(path)

export const bullboard = createBullBoard({
  queues: [
    new BullMQAdapter(channelsQueue),
    new BullMQAdapter(channelQueue),
    new BullMQAdapter(importQueue),
  ],
  serverAdapter,
})

export const routeHandler = serverAdapter.registerPlugin()
