import type { z } from 'zod'
import { parsedOpml, parsedOpmlHead } from './schemas/parse'
import {
  validatedOpml,
  validatedOpml10,
  validatedOpml11,
  validatedOpml20,
  validatedOpml20Outline,
} from './schemas/validate'

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
  outline: Array<ParsedOpmlOutline>
}>

export type ParsedOpmlHead = z.infer<typeof parsedOpmlHead>

export type ParsedOpml = z.infer<typeof parsedOpml>

export type ValidatedOpml10 = z.infer<typeof validatedOpml10>

export type ValidatedOpml11 = z.infer<typeof validatedOpml11>

export type ValidatedOpml20Outline = z.infer<typeof validatedOpml20Outline>

export type ValidatedOpml20 = z.infer<typeof validatedOpml20>

export type ValidatedOpml = z.infer<typeof validatedOpml>
