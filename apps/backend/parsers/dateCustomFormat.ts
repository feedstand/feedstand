import { TZDate } from '@date-fns/tz'
import { Locale, isValid, parse } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { zhTW } from 'date-fns/locale/zh-TW'

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

const fixMidnight: CustomFormatsReplace = {
    from: /\b24:(\d{2}:\d{2})\b/,
    to: (match) => match.replace(/^24/, '00'),
}

const fixTzSpace: CustomFormatsReplace = {
    from: /[+-]\s[0-9]{4}$/,
    to: (match) => match.replace(' ', () => ''),
}

const fixWords = (words: Record<string, string>): CustomFormatsReplace => ({
    from: new RegExp(Object.keys(words).join('|'), 'g'),
    to: (match) => words[match] || match,
})

const fixTzAbbreviation: CustomFormatsReplace = fixWords({
    EST: '-0500', // Eastern Standard Time
    EDT: '-0400', // Eastern Daylight Time
    CST: '-0600', // Central Standard Time
    CDT: '-0500', // Central Daylight Time
    MST: '-0700', // Mountain Standard Time
    MDT: '-0600', // Mountain Daylight Time
    PST: '-0800', // Pacific Standard Time
    PDT: '-0700', // Pacific Daylight Time
    GMT: '+0000', // Greenwich Mean Time
    UTC: '+0000', // Coordinated Universal Time
    BST: '+0100', // British Summer Time
    CET: '+0100', // Central European Time
    CEST: '+0200', // Central European Summer Time
    EET: '+0200', // Eastern European Time
    EEST: '+0300', // Eastern European Summer Time
    IST: '+0530', // India Standard Time
    IDT: '+0300', // Israel Daylight Time
    SGT: '+0800', // Singapore Time
    JST: '+0900', // Japan Standard Time
    KST: '+0900', // Korea Standard Time
    AEST: '+1000', // Australian Eastern Standard Time
    AEDT: '+1100', // Australian Eastern Daylight Time
    ACST: '+0930', // Australian Central Standard Time
    ACDT: '+1030', // Australian Central Daylight Time
    AWST: '+0800', // Australian Western Standard Time
    NZST: '+1200', // New Zealand Standard Time
    NZDT: '+1300', // New Zealand Daylight Time
    BRT: '-0300', // Brasilia Time
    ART: '-0300', // Argentina Time
    CLT: '-0400', // Chile Standard Time
    CLST: '-0300', // Chile Summer Time
    HKT: '+0800', // Hong Kong Time
    PHT: '+0800', // Philippine Time
    ICT: '+0700', // Indochina Time
})

const fixUppercaseMonth: CustomFormatsReplace = fixWords({
    JAN: 'Jan',
    FEB: 'Feb',
    MAR: 'Mar',
    APR: 'Apr',
    MAY: 'May',
    JUN: 'Jun',
    JUL: 'Jul',
    AUG: 'Aug',
    SEP: 'Sep',
    OCT: 'Oct',
    NOV: 'Nov',
    DEC: 'Dec',
})

const fixChineseMonth: CustomFormatsReplace = fixWords({
    一月: '01',
    二月: '02',
    三月: '03',
    四月: '04',
    五月: '05',
    六月: '06',
    七月: '07',
    八月: '08',
    九月: '09',
    十月: '10',
    十一月: '11',
    十二月: '12',
})

const fixWhitespace: CustomFormatsReplace = {
    from: /\s+/g,
    to: () => ' ',
}

const customFormats: CustomFormats = [
    // - Feed: ?
    //   Example: Tue, 15 Oct 2024 11:41:56 Europe/Dublin
    //   Example: Wed, 16 Oct 2024 24:00:00 Asia/Tokyo
    //   Example: Thu, 17 Oct 2024 00:15:01 America/New_York
    //   Example: Sat, 19 Oct 2024 12:30:45 Australia/Sydney
    {
        format: 'EEE, d MMM yyyy HH:mm:ss',
        tzRegex: commonTzRegex,
        replace: [fixMidnight],
    },

    // - Feed: https://www.news18.com/commonfeeds/v1/eng/rss/world.xml.
    //   Example: Tue, 15 Oct 2024 24:15:01 +0530.
    {
        format: "EEE, d MMM yyyy HH:mm:ss xx'.'",
        replace: [fixMidnight],
    },

    // - Feed: ?
    //   Example: mar., 22 juin 2021 18:14:45 +0000
    {
        format: 'd MMM yyyy HH:mm:ss xx',
        locale: fr,
        replace: [{ from: /^\w+\.,\s/, to: () => '' }],
    },

    // - Feed: ?
    //   Example: Mon, 24 Arp 2023 06:50:00 MDT
    {
        format: 'EEE, d MMM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation, { from: ' Arp ', to: () => ' Apr ' }],
    },

    // - Feed: http://www.newsbusters.org/blog/feed
    //   Example: October 18th, 2024 10:32 PM
    { format: 'MMMM do, yyyy h:mm aa' },

    // - Feed: https://www.newarab.com/rss
    //   Example: 2024-10-18T23:05:21 +0100
    { format: "yyyy-MM-dd'T'HH:mm:ss xx" },

    // - Feed: http://commandlinefanatic.com/rss.xml
    //   Example: Thursday, April 30, 2015, 15:24 - 0700
    {
        format: 'EEEE, MMMM d, yyyy, HH:mm xx',
        replace: [fixTzSpace],
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
    {
        format: 'EEE, d MMM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation, fixUppercaseMonth],
    },

    // - Feed: https://feeds.feedburner.com/Encodednadotcom/Feed
    //   Example: Mon, 24th Oct 2016 12:46:05 GMT
    //   Example: Thur, 20th Oct 2016 11:49:15 GMT
    //   Example: Tue, 18th Oct 2016 11:29:10 GMT
    //   Example: Fri, 11th Nov 2016 11:37:58 GMT
    //   Example: Fri, 02nd Dec 2016 14:36:08 GMT
    {
        format: 'EEE, do MMM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation, { from: 'Thur,', to: () => 'Thu,' }],
    },

    // - Feed: https://www.princeedwardisland.ca/en/tender-feed/goods_and_services.xml
    //   Example: <span class="date-display-single">2022-09-07</span>
    //   Example: <span class="date-display-single">2022-09-14</span>
    //   Example: <span class="date-display-single">2018-11-30</span>
    {
        format: 'yyyy-MM-dd',
        replace: [{ from: /<[^>]*>/g, to: () => '' }],
    },

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

    // - Feed: ?
    //   Example: Jan 9, 2025 10:41am
    //   Example: Jan 11, 2025 10:44am
    { format: 'MMM d, yyyy h:mmaaa' },

    // - Feed: ?
    //   Example: 20250115155121
    //   Example: 20250115154125
    //   Example: 20250115154112
    //   Example: 20250115154058
    //   Example: 20250115154044
    { format: 'yyyyMMddHHmmss' },

    // - Feed: ?
    // Example: 週六, 11 一月 2025 05:39:00 +0000
    // Example: 週四, 2 一月 2025 09:12:00 +0000
    // Example: 週二, 1 十月 2024 01:33:00 +0000
    // Example: 週五, 27 九月 2024 03:08:00 +0000
    // Example: 週三, 18 九月 2024 15:57:00 +0000
    // Example: 週二, 10 九月 2024 14:25:00 +0000
    {
        format: 'EEEE, d MM yyyy HH:mm:ss xx',
        locale: zhTW,
        replace: [fixChineseMonth],
    },

    // - Feed: ?
    //   Example: Thu Aug 14 11:22:50 CEST 2014
    //   Example: Thu Jul 31 21:49:52 CEST 2014
    //   Example: Tue Jul 22 08:59:54 CEST 2014
    //   Example: Tue Aug 13 12:43:50 CEST 2013
    //   Example: Thu Jan 31 08:15:56 CET 2013
    //   Example: Mon Dec 31 19:04:54 CET 2012
    //   Example: Thu Nov 22 15:23:09 CET 2012
    //   Example: Sat Jun 23 20:25:03 CEST 2012
    //   Example: Thu Aug  9 18:09:45 CEST 2012
    //   Example: Thu May 24 10:42:33 CEST 2012
    //   Example: Thu Apr 5 14:16:01 CEST 2012
    //   Example: Sat Mar 10 19:09:17 CET 2012
    {
        format: 'EEE MMM d HH:mm:ss xx yyyy',
        replace: [fixWhitespace, fixTzAbbreviation],
    },

    // - Feed: ?
    //   Example: Thu 10 Apr 13:13:18 CEST 2014
    //   Example: Sun  9 Mar 19:18:54 CET 2014
    //   Example: Tue 25 Feb 13:34:33 CET 2014
    {
        format: 'EEE d MMM HH:mm:ss xx yyyy',
        replace: [fixWhitespace, fixTzAbbreviation],
    },

    // - Feed: ?
    // December 12:27:27 CEST 2016
    {
        format: 'MMMM HH:mm:ss xx yyyy',
        replace: [fixTzAbbreviation],
    },

    // - Feed: ?
    // Mon 21 April 15:11:43 CET 2020
    {
        format: 'EEE d MMMM HH:mm:ss xx yyyy',
        replace: [fixWhitespace, fixTzAbbreviation],
    },

    // - Feed: ?
    //   Example: 2024-01-16T17:37:00-0600\n
    //   Example: 2023-11-16T07:40:40-0600\n
    {
        format: "yyyy-MM-dd'T'HH:mm:ssxx",
        replace: [{ from: /\n$/, to: () => '' }],
    },

    // - Feed: ?
    //   Example: ' Saturday, January 11th, 2025 '
    //   Example: ' Saturday, January 4th, 2025 '
    //   Example: ' Saturday, December 28th, 2024 '
    //   Example: ' Saturday, December 14th, 2024 '
    //   Example: ' Thursday, December 12th, 2024 '
    //   Example: ' Wednesday, December 11th, 2024 '
    {
        format: 'EEEE, MMMM do, yyyy',
    },

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
        let extractedTimezone: string | undefined = '+0000'
        let customizedValue = value

        if (replacements) {
            for (const { from, to } of replacements) {
                customizedValue =
                    typeof from === 'string'
                        ? customizedValue.replaceAll(from, to)
                        : customizedValue.replace(from, to)
            }
        }

        if (tzRegex) {
            extractedTimezone = customizedValue.match(tzRegex)?.[1]
            customizedValue = customizedValue.replace(tzRegex, '').trim()
        }

        let parsedDate = parse(
            customizedValue.trim(),
            format,
            new TZDate(new Date(), extractedTimezone),
            { locale },
        )

        if (isValid(parsedDate)) {
            return new Date(parsedDate.toISOString())
        }
    }
}
