import 'dotenv/config'

export const host = process.env.SERVER_HOST || '0.0.0.0'
export const port = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 4001
