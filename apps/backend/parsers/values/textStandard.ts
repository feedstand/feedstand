import { ValueParser } from '../../types/system'

export const textStandard: ValueParser<string> = (value) => {
    if (typeof value !== 'string') {
        return
    }

    return value
}
