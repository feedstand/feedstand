import { dayjs } from '../instances/dayjs'

// Replace 24 with 00 in feeds that contain incorrect hour notation in the date.
// Example value: Tue, 15 Oct 2024 24:15:01 +0530.
// Example feed: https://www.news18.com/commonfeeds/v1/eng/rss/world.xml.
export const dateMidnightTime = (value: unknown) => {
    if (typeof value !== 'string') {
        return
    }

    const parsedValue = value?.replace(/(\d{1,2}:\d{2}:\d{2} [+-]\d{4})$/, (match) => {
        return match.replace(/^24/, '00')
    })
    const parsedDate = dayjs(parsedValue)

    return parsedDate.isValid() ? parsedDate.toDate() : undefined
}
