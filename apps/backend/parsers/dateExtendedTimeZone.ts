import { dayjs } from '../instances/dayjs'

// Correctly parse a date string that includes a timezone in text format.
// Example value: Tue, 15 Oct 2024 11:41:56 Europe/Dublin.
// Example value: Wed, 16 Oct 2024 24:00:00 Asia/Tokyo.
// Example value: Thu, 17 Oct 2024 00:15:01 America/New_York.
// Example value: Fri, 18 Oct 2024 23:59:59 UTC.
// Example value: Sat, 19 Oct 2024 12:30:45 Australia/Sydney.
// Example feed: https://feeds.breakingnews.ie/bntopstories.
export const dateExtendedTimezone = (value: unknown) => {
    if (typeof value !== 'string') {
        return
    }

    const format = 'ddd, D MMM YYYY HH:mm:ss z'
    const parsedDate = dayjs(value, format)

    return parsedDate.isValid() ? parsedDate.toDate() : undefined
}
