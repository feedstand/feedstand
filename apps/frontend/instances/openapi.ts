import type { Routes } from '@feedstand/backend/types/openapi'
import { hc } from 'hono/client'
import { backendUrl } from '../constants/config'

export const openapi = hc<Routes>(backendUrl)
