import { dayjs } from '../instances/dayjs'

export const dateStandard = (value: dayjs.ConfigType) => {
    const parsedDate = dayjs(value)

    return parsedDate.isValid() ? parsedDate.toDate() : undefined
}
