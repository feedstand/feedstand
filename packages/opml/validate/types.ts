import type { z } from 'zod'
import type {
  validatedOpml,
  validatedOpml10,
  validatedOpml11,
  validatedOpml20,
  validatedOpml20Outline,
} from './schemas'

export type ValidatedOpml10 = z.infer<typeof validatedOpml10>

export type ValidatedOpml11 = z.infer<typeof validatedOpml11>

export type ValidatedOpml20Outline = z.infer<typeof validatedOpml20Outline>

export type ValidatedOpml20 = z.infer<typeof validatedOpml20>

export type ValidatedOpml = z.infer<typeof validatedOpml>
