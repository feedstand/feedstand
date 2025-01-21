// import 'dotenv/config'

export const host = process.env.SERVER_HOST ?? ''
export const port = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : undefined
