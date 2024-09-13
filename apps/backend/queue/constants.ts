import 'dotenv/config'

export const host = process.env.QUEUE_HOST
export const port = process.env.QUEUE_PORT ? Number(process.env.SERVER_PORT) : undefined
