export const host = process.env.QUEUE_HOST ?? ''
export const port = process.env.QUEUE_PORT ? Number(process.env.QUEUE_PORT) : undefined
export const user = process.env.QUEUE_USER ?? ''
export const pass = process.env.QUEUE_PASS ?? ''
export const isWorker = process.env.QUEUE_WORKER === 'true'
