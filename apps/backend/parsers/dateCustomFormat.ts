import { dayjs } from '../instances/dayjs'

type CustomFormats = Array<{
    format: string
    locale?: string | undefined
    replacements?: Array<{ from: string | RegExp; to: string }>
}>

const customFormats: CustomFormats = [
    // - Feed: ?
    //   Example: Tue, 15 Oct 2024 11:41:56 Europe/Dublin
    //   Example: Wed, 16 Oct 2024 24:00:00 Asia/Tokyo
    //   Example: Thu, 17 Oct 2024 00:15:01 America/New_York
    //   Example: Fri, 18 Oct 2024 23:59:59 UTC
    //   Example: Sat, 19 Oct 2024 12:30:45 Australia/Sydney
    { format: 'ddd, D MMM YYYY HH:mm:ss z' },

    // - Feed: https://www.commitstrip.com
    //   Example: mar., 22 juin 2021 18:14:45 +0000
    { format: 'ddd., D MMM YYYY HH:mm:ss ZZ', locale: 'fr' },

    // - Feed: https://www.commitstrip.com
    //   Example: Mon, 24 Arp 2023 06:50:00 MDT
    {
        format: 'ddd, D MMM YYYY HH:mm:ss z',
        locale: 'en',
        replacements: [{ from: ' Arp ', to: ' Apr ' }],
    },

    // - Feed: http://www.newsbusters.org/blog/feed
    //   Example: October 18th, 2024 10:32 PM
    { format: 'MMMM Do, YYYY h:mm A' },

    // - Feed: https://www.newarab.com/rss
    //   Example: 2024-10-18T23:05:21 +0100
    { format: 'YYYY-MM-DDTHH:mm:ss Z' },

    // - Feed: http://commandlinefanatic.com/rss.xml
    //   Example: Thursday, April 30, 2015, 15:24 - 0700
    { format: 'dddd, MMMM D, YYYY, HH:mm ZZ' },

    // - Feed: https://feeds.feedburner.com/Poultrymed
    //   Example: 22/12/2023 08:32:33
    { format: 'DD/MM/YYYY HH:mm:ss' },

    // - Feed: https://www.cms.gov/newsroom/rss-feeds
    //   Example: Fri, 10/18/2024 - 11:17
    //   Example: Thu, 10/10/2024 - 09:43
    //   Example: Fri, 10/04/2024 - 11:16
    { format: 'ddd, MM/DD/YYYY - HH:mm' },

    // - Feed: https://feeds.feedburner.com/tarss
    //   Example: Monday, 4 January 2016 - 11:12am
    //   Example: Wednesday, 23 December 2015 - 8:49am
    //   Example: Tuesday, 22 December 2015 - 9:09am
    // - Feed: https://feeds.breakingnews.ie/bntopstories
    //   Example: Thursday, 14 January 2016 - 9:24am
    //   Example: Friday, 8 January 2016 - 11:01am
    //   Example: Wednesday, 6 January 2016 - 8:00am
    { format: 'dddd, D MMMM YYYY - h:mma' },

    // - Feed: https://www.sebi.gov.in/sebirss.xml
    //   Example: 17 Oct, 2024 +0530
    //   Example: 16 Oct, 2024 +0530
    { format: 'D MMM, YYYY ZZ' },

    // - Feed: https://u.today/rss
    //   Example: Oct 19, 2024 - 15:05
    { format: 'MMM D, YYYY - h:mm A' },

    // - Feed: http://www.spacewar.com/Military_Technology.xml
    //   Example: Thu, 17 OCT 2024 22:40:13 AEST
    { format: 'ddd, D MMM YYYY HH:mm:ss z' },

    // - Feed: https://feeds.feedburner.com/Encodednadotcom/Feed
    //   Example: Mon, 24th Oct 2016 12:46:05 GMT
    //   Example: Thur, 20th Oct 2016 11:49:15 GMT
    //   Example: Tue, 18th Oct 2016 11:29:10 GMT
    //   Example: Fri, 11th Nov 2016 11:37:58 GMT
    //   Example: Fri, 02nd Dec 2016 14:36:08 GMT
    { format: 'ddd, Do MMM YYYY HH:mm:ss z' },
    { format: 'ddd, Do MMM YYYY HH:mm:ss z', replacements: [{ from: 'Thur,', to: 'Thu,' }] },

    // - Feed: https://www.princeedwardisland.ca/en/tender-feed/goods_and_services.xml
    //   Example: <span class="date-display-single">2022-09-07</span>
    //   Example: <span class="date-display-single">2022-09-14</span>
    //   Example: <span class="date-display-single">2018-11-30</span>
    { format: 'YYYY-MM-DD', replacements: [{ from: /<[^>]*>/g, to: '' }] },

    // - Feed: http://www.tennisviewmag.com/rss.xml
    //   Example: Tuesday, October 15, 2024 - 12:07am
    //   Example: Sunday, October 6, 2024 - 12:22pm
    //   Example: Wednesday, October 2, 2024 - 12:17am
    //   Example: Wednesday, September 4, 2024 - 11:43pm
    { format: 'dddd, MMMM D, YYYY - h:mma' },

    // - Feed: https://www.electricvehiclesresearch.com/rss
    //   Example: Tue, 24 Sep 2024 ZZZ
    { format: 'ddd, D MMM YYYY [ZZZ]' },

    // - Feed: http://www.juritravail.com/news.xml
    //   Example: 15-01-2024
    //   Example: 30-10-2023
    { format: 'DD-MM-YYYY' },

    // - Feed: https://library.harvard.edu/about/news/feed/
    //   Example: Saturday, Jan 2nd, 2016
    //   Example: Thursday, Jun 26th, 2014
    { format: 'dddd, MMM Do, YYYY' },

    // - Feed: https://us.sunpower.com/blog/rss
    //   Example: May 11th, 2023
    { format: 'MMM Do, YYYY' },

    // - Feed: http://www.autoactu.com/rss/
    //   Example: 17/10/2024
    { format: 'DD/MM/YYYY' },

    // - Feed: ?
    //   Example: September 6th, 2023
    //   Example: July 20th, 2023
    { format: 'MMMM Do, YYYY' },

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

    for (const { format, locale, replacements } of customFormats) {
        let customizedValue = value

        if (replacements) {
            for (const { from, to } of replacements) {
                customizedValue =
                    typeof from === 'string'
                        ? customizedValue.replaceAll(from, to)
                        : customizedValue.replace(from, to)
            }
        }

        const parsedDate = dayjs(customizedValue, format, locale)

        if (parsedDate.isValid()) {
            return parsedDate.toDate()
        }
    }
}
