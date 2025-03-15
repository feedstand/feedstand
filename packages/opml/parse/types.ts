import type { z } from 'zod'
import type { parsedOpml, parsedOpmlHead } from './schemas'

export type ParsedOpmlOutline = Partial<{
  text: string
  type: string
  isComment: boolean
  isBreakpoint: boolean
  created: string
  category: string
  description: string
  xmlUrl: string
  htmlUrl: string
  language: string
  title: string
  version: string
  url: string
  outlines: Array<ParsedOpmlOutline>
}>

export type ParsedOpmlHead = z.infer<typeof parsedOpmlHead>

export type ParsedOpml = z.infer<typeof parsedOpml>
