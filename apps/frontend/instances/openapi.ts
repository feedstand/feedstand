import { Routes } from '@feedstand/backend/types/openapi'
import { hc } from 'hono/client'
import { url } from '../constants/backend'

export const openapi = hc<Routes>(url)
