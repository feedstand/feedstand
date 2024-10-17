import { dayjs } from '../instances/dayjs'

export const dateStandard = (value: dayjs.ConfigType) => {
    const parsedDate = dayjs(value)

    // INFO: This is a temporary measure to detect any non-standard dates from feeds.
    if (!parsedDate.isValid()) {
        console.log('dateStandard', { value })
    }

    return parsedDate.isValid() ? parsedDate.toDate() : undefined
}
