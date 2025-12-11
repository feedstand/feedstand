import type { Routes } from '@feedstand/backend/types/openapi'
import { hc } from 'hono/client'
import { apiUrl } from '../constants/config'

export const openapi = hc<Routes>(apiUrl)
