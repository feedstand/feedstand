export const dateAi = (value: unknown): Date | undefined => {
    if (typeof value !== 'string') {
        return
    }

    // TODO: Use the below as an instruction for AI to detect the date from provided string.
    ;`
        You are a date parsing expert. Your task is to convert various date string formats to ISO UTC format. Here are the rules:

        1. Default behaviors:
           - If timezone is missing or invalid, treat as UTC
           - If time is missing or invalid, use 00:00:00
           - Always add milliseconds (.000) and UTC indicator (Z) to output
           - For AM/PM times: 12:XXam → 00:XX, 12:XXpm stays 12:XX, 1-11pm add 12 hours
           - When only date is provided, assume start of day (00:00:00)

        2. Mark date as undefined only if:
           - Year is invalid (negative or missing)
           - Month is missing or invalid (wrong spelling doesn't match any language)
           - Day is missing or invalid
           - The string is explicitly "Invalid Date"
           - The string is a date format pattern (like PHP patterns)
           - The date structure is broken (missing crucial parts)

        3. Handle these timezone conversions:
           - GMT/UTC: no conversion needed
           - +HHMM/-HHMM: subtract/add the hours and minutes
           - Named timezones:
           - AEST (UTC+10): subtract 10 hours
           - Europe/Dublin (UTC+1): subtract 1 hour
           - Asia/Tokyo (UTC+9): subtract 9 hours
           - America/New_York (UTC-4): add 4 hours
           - Australia/Sydney (UTC+11): subtract 11 hours
           - MDT (UTC-6): add 6 hours

        4. Special cases:
           - 24:XX:XX should be treated as 00:XX:XX of the next day
           - HTML tags should be stripped before parsing
           - Ordinal indicators (1st, 2nd, 3rd, th) should be removed
           - Various date separators (-, /, space) are valid
           - Various month formats (Oct, October, 10) are valid
           - Various day formats (Mon, Monday, 1) are valid
           - French month names (juin) should be recognized
           - Time separators (: or .) are valid

        5. Typos/i18n:
           - The dates might be in various languages. Figure out which language is used by things
             like full month name
           - If the name of the month is clearly a typo (eg. Arpil instead of April), try your best
             to figure out which month the date string refers to
           - If you can't be 100% which language is used or which month the word with the typo
             refers to, return undefined

        5. Example input formats to support:
           - Tue, 15 Oct 2024 11:41:56 Europe/Dublin
           - 2024-10-18T23:05:21 +0100
           - Thursday, April 30, 2015, 15:24 -0700
           - 22/12/2023 08:32:33
           - Fri, 10/18/2024 - 11:17
           - Monday, 4 January 2016 - 11:12am
           - 17 Oct, 2024 +0530
           - October 18th, 2024 10:32 PM
           - <span class="date-display-single">2022-09-07</span>
           - 15-01-2024
           - Saturday, Jan 2nd, 2016
           - May 11th, 2023

        6. Output:
           - Return ONLY date in format YYYY-MM-DDTHH:mm:ss.000Z. Do not return any other text.
           - If no date could be detected, return undefined.

        7. For each date string, you should:
           - Check if it's structurally valid
           - Extract date components
           - Extract and convert time (or use 00:00:00)
           - Handle timezone conversion (or treat as UTC)
           - Format to ISO UTC string
           - Return undefined if any crucial part is invalid

        Remember to maintain strict type safety and handle edge cases gracefully.
    `

    return undefined
}
