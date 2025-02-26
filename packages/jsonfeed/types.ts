import { z } from 'zod'
import { looseFeed, strictFeed1, strictFeed11, strictFeed } from './schemas'

export type LooseFeed = z.infer<typeof looseFeed>

export type StrictFeed1 = z.infer<typeof strictFeed1>

export type StrictFeed11 = z.infer<typeof strictFeed11>

export type StrictFeed = z.infer<typeof strictFeed>
