import { ValueParser } from '../../types/system'

export const textStandard: ValueParser<string> = (value) => {
    if (typeof value !== 'string') {
        return
    }

    // TODO: Maybe the null byte removal should be placed here instead of custom Drizzle types?

    return value
}
