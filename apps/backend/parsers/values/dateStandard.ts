import { DateArg, isValid, toDate } from 'date-fns'

export const dateStandard = (value: DateArg<Date> | null | undefined): Date | undefined => {
    if (!value) {
        return
    }

    const date = toDate(value)

    return isValid(date) ? date : undefined
}
