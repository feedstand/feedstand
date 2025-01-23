import { DateArg, isValid, toDate } from 'date-fns'
import { ValueParser } from '../../types/system'

export const dateStandard: ValueParser<Date, DateArg<Date> | null | undefined> = (value) => {
    if (!value) {
        return
    }

    const date = toDate(value)

    return isValid(date) ? date : undefined
}
