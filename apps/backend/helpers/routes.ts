import { ValidationTargets } from 'hono'
import { validator } from 'hono/validator'
import { z } from 'zod'

export const validate = <T extends keyof ValidationTargets, S extends z.ZodTypeAny>(
    target: T,
    schema: S,
) => {
    return validator(target, (value) => schema.parse(value) as z.infer<S>)
}
