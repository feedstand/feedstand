import { isValid, Locale, parse } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { fr } from 'date-fns/locale/fr'
import { extractTimezoneFromDateString, stripTimezoneFromDateString } from '../helpers/dates'

type CustomFormatsReplace = {
    from: string | RegExp
    to: Parameters<String['replace']>[1]
}

type CustomFormats = Array<{
    format: string
    locale?: Locale
    tzRegex?: RegExp
    replace?: Array<CustomFormatsReplace>
}>

const commonTzRegex: RegExp = /([A-Za-z\/_]+)$/

const midnightReplace: CustomFormatsReplace = {
    from: /\b24:(\d{2}:\d{2})\b/,
    to: (match) => match.replace(/^24/, '00'),
}

const tzSpaceReplace: CustomFormatsReplace = {
    from: /[+-]\s[0-9]{4}$/,
    to: (match) => match.replace(' ', () => ''),
}

const customFormats: CustomFormats = [
    // - Feed: ?
    //   Example: Tue, 15 Oct 2024 11:41:56 Europe/Dublin
    //   Example: Wed, 16 Oct 2024 24:00:00 Asia/Tokyo
    //   Example: Thu, 17 Oct 2024 00:15:01 America/New_York
    //   Example: Fri, 18 Oct 2024 23:59:59 UTC
    //   Example: Sat, 19 Oct 2024 12:30:45 Australia/Sydney
    {
        format: 'EEE, d MMM yyyy HH:mm:ss',
        tzRegex: commonTzRegex,
        replace: [midnightReplace],
    },

    // - Feed: https://www.news18.com/commonfeeds/v1/eng/rss/world.xml.
    //   Example: Tue, 15 Oct 2024 24:15:01 +0530.
    { format: 'EEE, dd MMM yyyy HH:mm:ss xx', replace: [midnightReplace] },

    // - Feed: ?
    //   Example: mar., 22 juin 2021 18:14:45 +0000
    {
        format: 'd MMM yyyy HH:mm:ss xxxx',
        locale: fr,
        replace: [{ from: /^\w+\.,\s/, to: () => '' }],
    },

    // - Feed: ?
    //   Example: Mon, 24 Arp 2023 06:50:00 MDT
    {
        format: 'EEE, d MMM yyyy HH:mm:ss',
        locale: enUS,
        tzRegex: commonTzRegex,
        replace: [{ from: ' Arp ', to: () => ' Apr ' }],
    },

    // - Feed: http://www.newsbusters.org/blog/feed
    //   Example: October 18th, 2024 10:32 PM
    { format: 'MMMM do, yyyy h:mm a' },

    // - Feed: https://www.newarab.com/rss
    //   Example: 2024-10-18T23:05:21 +0100
    { format: "yyyy-MM-dd'T'HH:mm:ss xx" },

    // - Feed: http://commandlinefanatic.com/rss.xml
    //   Example: Thursday, April 30, 2015, 15:24 - 0700
    //   Example: Wednesday, October 28, 2015, 15:24 -0700
    //   Example: Thursday, April 26, 2012 18:31 +0000
    //   Example: Sat, Apr 23 2011 15:39:00 +0000
    {
        format: 'EEEE, MMMM d, yyyy, HH:mm xx',
        replace: [tzSpaceReplace],
    },

    // - Feed: https://feeds.feedburner.com/Poultrymed
    //   Example: 22/12/2023 08:32:33
    { format: 'dd/MM/yyyy HH:mm:ss' },

    // - Feed: https://www.cms.gov/newsroom/rss-feeds
    //   Example: Fri, 10/18/2024 - 11:17
    //   Example: Thu, 10/10/2024 - 09:43
    //   Example: Fri, 10/04/2024 - 11:16
    { format: 'EEE, MM/dd/yyyy - HH:mm' },

    // - Feed: https://feeds.feedburner.com/tarss
    //   Example: Monday, 4 January 2016 - 11:12am
    //   Example: Wednesday, 23 December 2015 - 8:49am
    //   Example: Tuesday, 22 December 2015 - 9:09am
    // - Feed: https://feeds.breakingnews.ie/bntopstories
    //   Example: Thursday, 14 January 2016 - 9:24am
    //   Example: Friday, 8 January 2016 - 11:01am
    //   Example: Wednesday, 6 January 2016 - 8:00am
    { format: 'EEEE, d MMMM yyyy - h:mma' },

    // - Feed: https://www.sebi.gov.in/sebirss.xml
    //   Example: 17 Oct, 2024 +0530
    //   Example: 16 Oct, 2024 +0530
    { format: 'd MMM, yyyy xxxx' },

    // - Feed: https://u.today/rss
    //   Example: Oct 19, 2024 - 15:05
    { format: 'MMM d, yyyy - HH:mm' },

    // - Feed: http://www.spacewar.com/Military_Technology.xml
    //   Example: Thu, 17 OCT 2024 22:40:13 AEST
    { format: 'EEE, d MMM yyyy HH:mm:ss', tzRegex: commonTzRegex },

    // - Feed: https://feeds.feedburner.com/Encodednadotcom/Feed
    //   Example: Mon, 24th Oct 2016 12:46:05 GMT
    //   Example: Thur, 20th Oct 2016 11:49:15 GMT
    //   Example: Tue, 18th Oct 2016 11:29:10 GMT
    //   Example: Fri, 11th Nov 2016 11:37:58 GMT
    //   Example: Fri, 02nd Dec 2016 14:36:08 GMT
    { format: 'EEE, do MMM yyyy HH:mm:ss', tzRegex: commonTzRegex },
    {
        format: 'EEE, do MMM yyyy HH:mm:ss',
        locale: enUS,
        tzRegex: commonTzRegex,
        replace: [{ from: 'Thur,', to: () => 'Thu,' }],
    },

    // - Feed: https://www.princeedwardisland.ca/en/tender-feed/goods_and_services.xml
    //   Example: <span class="date-display-single">2022-09-07</span>
    //   Example: <span class="date-display-single">2022-09-14</span>
    //   Example: <span class="date-display-single">2018-11-30</span>
    { format: 'yyyy-MM-dd', replace: [{ from: /<[^>]*>/g, to: () => '' }] },

    // - Feed: http://www.tennisviewmag.com/rss.xml
    //   Example: Tuesday, October 15, 2024 - 12:07am
    //   Example: Sunday, October 6, 2024 - 12:22pm
    //   Example: Wednesday, October 2, 2024 - 12:17am
    //   Example: Wednesday, September 4, 2024 - 11:43pm
    { format: 'EEEE, MMMM d, yyyy - h:mma' },

    // - Feed: https://www.electricvehiclesresearch.com/rss
    //   Example: Tue, 24 Sep 2024 ZZZ
    { format: `EEE, d MMM yyyy 'ZZZ'` },

    // - Feed: http://www.juritravail.com/news.xml
    //   Example: 15-01-2024
    //   Example: 30-10-2023
    { format: 'dd-MM-yyyy' },

    // - Feed: https://library.harvard.edu/about/news/feed/
    //   Example: Saturday, Jan 2nd, 2016
    //   Example: Thursday, Jun 26th, 2014
    { format: 'EEEE, MMM do, yyyy' },

    // - Feed: https://us.sunpower.com/blog/rss
    //   Example: May 11th, 2023
    { format: 'MMM do, yyyy' },

    // - Feed: http://www.autoactu.com/rss/
    //   Example: 17/10/2024
    { format: 'dd/MM/yyyy' },

    // - Feed: ?
    //   Example: September 6th, 2023
    //   Example: July 20th, 2023
    { format: 'MMMM do, yyyy' },

    // Other not-handled formats:
    // - Feed: http://www.leisureopportunities.co.uk/rss/google_feed_SM.cfm
    //   Example: Wed, 26 May 2021 HH:05:ss GMT
    // - Feed: http://www.threewordphrase.com/rss.xml
    //   Example: Wed, 23 2011 18:38:00 GMT
    // - Feed: http://www.africapropertynews.com/feed
    //   Example: D, d M Y H:i:s O
    // - Feed: https://pankajtanwar.in/feed.xml
    //   Example: Invalid Date
    // - Feed: https://themunicheye.com/sitemap.rss
    //   Example: Tue, 30 Nov -1 00:00:00
]

export const dateCustomFormat = (value: unknown): Date | undefined => {
    if (typeof value !== 'string') {
        return
    }

    for (const { format, locale, tzRegex, replace: replacements } of customFormats) {
        let customizedValue = value
        let extractedTimezone: string | undefined

        if (tzRegex) {
            customizedValue = stripTimezoneFromDateString(customizedValue, tzRegex)
            extractedTimezone = extractTimezoneFromDateString(customizedValue, tzRegex)
        }

        if (replacements) {
            for (const { from, to } of replacements) {
                customizedValue =
                    typeof from === 'string'
                        ? customizedValue.replaceAll(from, to)
                        : customizedValue.replace(from, to)
            }
        }

        let parsedDate = parse(customizedValue.trim(), format, new Date(), { locale })

        if (isValid(parsedDate) && extractedTimezone) {
            // TODO: Attach timezone.
        }

        if (isValid(parsedDate)) {
            return parsedDate
        }
    }
}
