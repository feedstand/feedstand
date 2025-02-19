import { TZDate } from '@date-fns/tz'
import { Locale, isValid, parse } from 'date-fns'
import { de } from 'date-fns/locale/de'
import { enUS } from 'date-fns/locale/en-US'
import { fr } from 'date-fns/locale/fr'
import { it } from 'date-fns/locale/it'
import { ja } from 'date-fns/locale/ja'
import { ru } from 'date-fns/locale/ru'
import { sv } from 'date-fns/locale/sv'
import { tr } from 'date-fns/locale/tr'
import { zhTW } from 'date-fns/locale/zh-TW'
import { ValueParser } from '../types/system'
import { dateStandard } from './dateStandard'

type CustomFormatsReplace = {
    from: string | RegExp
    to: Parameters<String['replace']>[1]
}

type CustomFormats = Array<{
    format: string
    locale?: Locale
    matchRegex?: RegExp
    tzRegex?: RegExp
    replace?: Array<CustomFormatsReplace>
}>

const commonTzRegex: RegExp = /([A-Za-z\/_]+)$/

const fixMidnight: CustomFormatsReplace = {
    from: /\b24:(\d{2}(?::\d{2})?)\b/,
    to: (match) => match.replace(/^24/, '00'),
}

const fixTzSpace: CustomFormatsReplace = {
    from: /[+-]\s[0-9]{4}$/,
    to: (match) => match.replace(' ', () => ''),
}

const fixWords = (words: Record<string, string>): CustomFormatsReplace => ({
    from: new RegExp(Object.keys(words).join('|'), 'gi'),
    to: (match) => words[match.toLowerCase()] || match,
})

const fixTzAbbreviation: CustomFormatsReplace = fixWords({
    ' estt': ' -0500', // Eastern Standard Time
    ' est': ' -0500', // Eastern Standard Time
    ' edt': ' -0400', // Eastern Daylight Time
    ' cst': ' -0600', // Central Standard Time
    ' cdt': ' -0500', // Central Daylight Time
    ' mst': ' -0700', // Mountain Standard Time
    ' mdt': ' -0600', // Mountain Daylight Time
    ' pst': ' -0800', // Pacific Standard Time
    ' pdt': ' -0700', // Pacific Daylight Time
    ' gmt': ' +0000', // Greenwich Mean Time
    ' lmt': ' +0000', // Local Mean Time
    ' utc': ' +0000', // Coordinated Universal Time
    ' bst': ' +0100', // British Summer Time
    ' cet': ' +0100', // Central European Time
    ' cest': ' +0200', // Central European Summer Time
    ' eet': ' +0200', // Eastern European Time
    ' eest': ' +0300', // Eastern European Summer Time
    ' ist': ' +0530', // India Standard Time
    ' idt': ' +0300', // Israel Daylight Time
    ' sgt': ' +0800', // Singapore Time
    ' jst': ' +0900', // Japan Standard Time
    ' kst': ' +0900', // Korea Standard Time
    ' aest': ' +1000', // Australian Eastern Standard Time
    ' aedt': ' +1100', // Australian Eastern Daylight Time
    ' acst': ' +0930', // Australian Central Standard Time
    ' acdt': ' +1030', // Australian Central Daylight Time
    ' awst': ' +0800', // Australian Western Standard Time
    ' nzst': ' +1200', // New Zealand Standard Time
    ' nzdt': ' +1300', // New Zealand Daylight Time
    ' brt': ' -0300', // Brasilia Time
    ' art': ' -0300', // Argentina Time
    ' clt': ' -0400', // Chile Standard Time
    ' clst': ' -0300', // Chile Summer Time
    ' hkt': ' +0800', // Hong Kong Time
    ' pht': ' +0800', // Philippine Time
    ' ict': ' +0700', // Indochina Time,
    ' et': ' -0500', // Eastern Standard Time
    ' pt': ' -0800', // Pacific [Standard] Time
})

const fixEnglishMonth: CustomFormatsReplace = fixWords({
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    // may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
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

const fixSwedishMonth: CustomFormatsReplace = fixWords({
    januari: '01',
    februari: '02',
    mars: '03',
    april: '04',
    maj: '05',
    juni: '06',
    juli: '07',
    augusti: '08',
    september: '09',
    oktober: '10',
    november: '11',
    december: '12',
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    // 'maj': '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    okt: '10',
    nov: '11',
    dec: '12',
})

const fixSwedishWeekday: CustomFormatsReplace = fixWords({
    måndag: 'Monday',
    tisdag: 'Tuesday',
    onsdag: 'Wednesday',
    torsdag: 'Thursday',
    fredag: 'Friday',
    lördag: 'Saturday',
    söndag: 'Sunday',
    mån: 'Mon',
    tis: 'Tue',
    ons: 'Wed',
    tor: 'Thu',
    fre: 'Fri',
    lör: 'Sat',
    sön: 'Sun',
})

const fixSpanishMonth: CustomFormatsReplace = fixWords({
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12',
    ene: '01',
    feb: '02',
    mar: '03',
    abr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    ago: '08',
    sept: '09',
    sep: '09',
    oct: '10',
    nov: '11',
    dic: '12',
})

const fixSpanishWeekday: CustomFormatsReplace = fixWords({
    lunes: 'Monday',
    martes: 'Tuesday',
    miércoles: 'Wednesday',
    jueves: 'Thursday',
    viernes: 'Friday',
    sábado: 'Saturday',
    domingo: 'Sunday',
    lun: 'Mon',
    mar: 'Tue',
    mié: 'Wed',
    mier: 'Wed',
    jue: 'Thu',
    vie: 'Fri',
    sáb: 'Sat',
    dom: 'Sun',
})

const fixGermanMonth: CustomFormatsReplace = fixWords({
    januar: '01',
    februar: '02',
    märz: '03',
    april: '04',
    mai: '05',
    juni: '06',
    juli: '07',
    august: '08',
    september: '09',
    oktober: '10',
    november: '11',
    dezember: '12',
    jan: '01',
    feb: '02',
    mär: '03',
    mrz: '03',
    apr: '04',
    // mai: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    okt: '10',
    nov: '11',
    dez: '12',
})

const fixPortugeseMonth: CustomFormatsReplace = fixWords({
    janeiro: '01',
    fevereiro: '02',
    março: '03',
    abril: '04',
    maio: '05',
    junho: '06',
    julho: '07',
    agosto: '08',
    setembro: '09',
    outubro: '10',
    novembro: '11',
    dezembro: '12',
    jan: '01',
    fev: '02',
    mar: '03',
    abr: '04',
    mai: '05',
    jun: '06',
    jul: '07',
    ago: '08',
    set: '09',
    out: '10',
    nov: '11',
    dez: '12',
})

const fixDutchMonth: CustomFormatsReplace = fixWords({
    januari: '01',
    februari: '02',
    maart: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    augustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    december: '12',
    jan: '01',
    feb: '02',
    mrt: '03',
    apr: '04',
    // mei: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    okt: '10',
    nov: '11',
    dec: '12',
})

const fixDutchWeekday: CustomFormatsReplace = fixWords({
    maandag: 'Monday',
    dinsdag: 'Tuesday',
    woensdag: 'Wednesday',
    donderdag: 'Thursday',
    vrijdag: 'Friday',
    zaterdag: 'Saturday',
    zondag: 'Sunday',
    ma: 'Mon',
    di: 'Tue',
    wo: 'Wed',
    do: 'Thu',
    vr: 'Fri',
    za: 'Sat',
    zo: 'Sun',
})

const fixRomanianMonth: CustomFormatsReplace = fixWords({
    ianuarie: '01',
    februarie: '02',
    martie: '03',
    aprilie: '04',
    mai: '05',
    iunie: '06',
    iulie: '07',
    august: '08',
    septembrie: '09',
    octombrie: '10',
    noiembrie: '11',
    decembrie: '12',
    ian: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    // 'mai': '05',
    iun: '06',
    iul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    noi: '11',
    dec: '12',
})

const fixFrenchMonth: CustomFormatsReplace = fixWords({
    janvier: '01',
    février: '02',
    fevrier: '02',
    mars: '03',
    avril: '04',
    mai: '05',
    juin: '06',
    juillet: '07',
    août: '08',
    aout: '08',
    septembre: '09',
    octobre: '10',
    novembre: '11',
    décembre: '12',
    decembre: '12',
    janv: '01',
    févr: '02',
    fevr: '02',
    fév: '02',
    fev: '02',
    // mars: '03',
    avr: '04',
    // mai: '05',
    // juin: '06',
    juil: '07',
    // août: '08',
    sept: '09',
    oct: '10',
    nov: '11',
    déc: '12',
    dec: '12',
})

const fixFrenchWeekday: CustomFormatsReplace = fixWords({
    lundi: 'Monday',
    mardi: 'Tuesday',
    mercredi: 'Wednesday',
    jeudi: 'Thursday',
    vendredi: 'Friday',
    samedi: 'Saturday',
    dimanche: 'Sunday',
    lun: 'Mon',
    mar: 'Tue',
    mer: 'Wed',
    jeu: 'Thu',
    ven: 'Fri',
    sam: 'Sat',
    dim: 'Sun',
})

const globalReplaces: Array<CustomFormatsReplace> = [
    // Removes leading/trailing whitespace in one go.
    { from: /^\s+|\s+$/g, to: () => '' },
    // Collapses all whitespace (spaces, tabs, newlines) to single space.
    { from: /\s+/g, to: () => ' ' },
    { from: '.,', to: () => ',' },
    { from: '. ', to: () => ' ' },
    // Convert full-width characters to regular ASCII.
    {
        from: /[Ａ-Ｚａ-ｚ０-９]/g,
        to: (match) => String.fromCharCode(match.charCodeAt(0) - 0xfee0),
    },
]

const customFormats: CustomFormats = [
    // Feed: https://feeds.feedburner.com/Poultrymed
    // Example: 22/12/2023 08:32:33
    { format: 'dd/MM/yyyy HH:mm:ss' },

    // Feed: https://www.cms.gov/newsroom/rss-feeds
    // Example: Fri, 10/18/2024 - 11:17
    // Example: Thu, 10/10/2024 - 09:43
    // Example: Fri, 10/04/2024 - 11:16
    { format: 'EEE, MM/dd/yyyy - HH:mm' },

    // Feed: https://feeds.feedburner.com/tarss
    // Example: Monday, 4 January 2016 - 11:12am
    // Example: Wednesday, 23 December 2015 - 8:49am
    // Example: Tuesday, 22 December 2015 - 9:09am
    { format: 'EEEE, d MMMM yyyy - h:mma' },

    // Feed: https://www.sebi.gov.in/sebirss.xml
    // Example: 17 Oct, 2024 +0530
    // Example: 16 Oct, 2024 +0530
    { format: 'd MMM, yyyy xx' },

    // Feed: https://u.today/rss
    // Example: Oct 19, 2024 - 15:05
    { format: 'MMM d, yyyy - HH:mm' },

    // Feed: http://www.tennisviewmag.com/rss.xml
    // Example: Tuesday, October 15, 2024 - 12:07am
    // Example: Sunday, October 6, 2024 - 12:22pm
    // Example: Wednesday, October 2, 2024 - 12:17am
    { format: 'EEEE, MMMM d, yyyy - h:mma' },

    // Feed: https://www.electricvehiclesresearch.com/rss
    // Example: Tue, 24 Sep 2024 ZZZ
    { format: `EEE, d MMM yyyy 'ZZZ'` },

    // Feed: http://www.juritravail.com/news.xml
    // Example: 15-01-2024
    // Example: 30-10-2023
    { format: 'dd-MM-yyyy' },

    // Feed: https://library.harvard.edu/about/news/feed/
    // Example: Saturday, Jan 2nd, 2016
    // Example: Thursday, Jun 26th, 2014
    { format: 'EEEE, MMM do, yyyy' },

    // Feed: https://us.sunpower.com/blog/rss
    // Example: May 11th, 2023
    { format: 'MMM do, yyyy' },

    // Feed: http://www.autoactu.com/rss/
    // Example: 17/10/2024
    { format: 'dd/MM/yyyy' },

    // Example: September 6th, 2023
    // Example: July 20th, 2023
    { format: 'MMMM do, yyyy' },

    // Example: Jan 9, 2025 10:41am
    // Example: Jan 11, 2025 10:44am
    { format: 'MMM d, yyyy h:mmaaa' },

    //    Example: Thu, 20 Jun 2024 20 +0000
    //    Example: Thu, 29 Feb 2024 23 +0000
    //    Example: Mon, 04 Dec 2023 15 +0000
    { format: 'EEE, dd MMM yyyy HH xx' },

    // Example: 14/01/2025 - 14:51
    // Example: 14/01/2025 - 14:43
    // Example: 14/01/2025 - 11:45
    { format: 'dd/MM/yyyy - HH:mm' },

    // Example: Saturday, January 11th, 2025
    // Example: Saturday, January 4th, 2025
    // Example: Wednesday, December 11th, 2024
    { format: 'EEEE, MMMM do, yyyy' },

    // Example: 17th Sep 2023 00:00 +1000
    // Example: 30th Jun 2020 00:00 +1000
    // Example: 1st Mar 2020 00:00 +1000
    { format: 'do MMM yyyy HH:mm xx' },

    // Example: 23-4-2021 14:24:50
    { format: 'dd-M-yyyy HH:mm:ss' },

    // Example: 2022/11/12T22:00:00+08:00
    // Example: 2022/11/9T22:00:00+08:00
    // Example: 2022/10/5T22:00:00+08:00
    { format: "yyyy/MM/dd'T'HH:mm:ssxxx" },

    // Feed: http://www.newsbusters.org/blog/feed
    // Example: October 18th, 2024 10:32 PM
    { format: 'MMMM do, yyyy h:mm aa' },

    // Feed: https://www.newarab.com/rss
    // Example: 2024-10-18T23:05:21 +0100
    { format: "yyyy-MM-dd'T'HH:mm:ss xx" },

    // Example: Tue, Jan 14,2025 08:21:14PM
    // Example: Tue, Jan 14,2025 08:19:03PM
    { format: 'EEE, MMM d,yyyy hh:mm:ssa' },

    // Example: 2024-01-16T17:37:00-0600\n
    // Example: 2023-11-16T07:40:40-0600\n
    { format: "yyyy-MM-dd'T'HH:mm:ssxx" },

    // Example: 2025-01-17T07:52:14+00:00
    // Example: 2025-01-17T07:52:11+00:00
    // Example: 2025-01-16T19:24:28+00:00
    { format: "yyyy-MM-dd'T'HH:mm:ssxxx" },

    //  Example: 04.02.2025T00:00:00 +0100
    //  Example: 30.01.2025T17:05:00 +0100
    //  Example: 28.01.2025T21:55:00 +0100
    { format: "dd.MM.yyyy'T'HH:mm:ss xx" },

    //  Example: 2025-01-2821:47:13
    //  Example: 2025-01-2819:40:26
    //  Example: 2025-01-2812:17:37
    { format: 'yyyy-MM-ddHH:mm:ss' },

    // Example: Thursday, January 16, 2025 - 20:00
    // Example: Monday, January 6, 2025 - 20:00
    // Example: Sunday, January 5, 2025 - 20:00
    { format: 'EEEE, MMMM d, yyyy - HH:mm' },

    // Example: Mon, 25 Mar 2024  +0100
    { format: 'EEE, d MMM yyyy xx' },

    // Example: Wed, 13 Nov 2024 at 01:00:00
    // Example: Fri, 31 May 2024 at 02:00:00
    // Example: Sun, 05 Dec 2021 at 01:00:00
    { format: "EEE, dd MMM yyyy 'at' HH:mm:ss" },

    // Example: 12/07/2024 - 12:00am
    // Example: 11/30/2024 - 12:00am
    // Example: 11/23/2024 - 12:00am
    { format: 'MM/dd/yyyy - hh:mmaa' },

    // Example: 21.01.2025
    // Example: 16.12.2024
    // Example: 31.05.2018
    { format: 'dd.MM.yyyy' },

    // Example: 17th May 2016
    // Example: 10th May 2016
    // Example: 3rd May 2016
    { format: 'do MMMM yyyy' },

    // Example: Monday, September 11th, 2017 11:15:00 GMT
    // Example: Monday, August 28th, 2017 11:15:00 GMT
    // Example: Wednesday, June 21st, 2017 11:15:00 GMT
    {
        format: 'EEEE, MMMM do, yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation],
    },

    // Example: 2020-29-01T21:42:18+00:00
    // Example: 2020-19-01T19:42:22+00:00
    // Example: 2020-14-01T09:34:44+00:00
    { format: "yyyy-dd-MM'T'HH:mm:ssxxx" },

    // Example: 18 February 2025 - 21:22
    // Example: 18 February 2025 - 21:10
    // Example: 18 February 2025 - 20:20
    { format: 'dd MMMM yyyy - HH:mm' },

    // Example: 19-02-2025 00:35
    { format: 'dd-MM-yyyy HH:mm' },

    // Example: 2023年11月15日
    // Example: 2023年11月09日
    // Example: 2023年09月06日
    { format: 'yyyy年MM月dd日' },

    // Example: 2020年3月16日 02:00
    // Example: 2019年10月31日 06:37
    // Example: 2019年6月 3日 04:00
    {
        format: 'yyyy年M月d日 HH:mm',
        replace: [{ from: '月 ', to: () => '月' }],
    },

    // Example: 2025-01-27T00:11:27 1737936687
    // Example: 2025-01-27T08:22:41 1737966161
    // Example: 2025-01-26T23:13:01 1737933181
    {
        format: "yyyy-MM-dd'T'HH:mm:ss",
        replace: [{ from: /\d{10}$/, to: () => '' }],
    },

    // Example: 20250115155121
    // Example: 20250115154125
    {
        format: 'yyyyMMddHHmmss',
        matchRegex: /\d{14}/,
    },

    // Example: 20250115
    // Example: 20250114
    {
        format: 'yyyyMMdd',
        matchRegex: /\d{8}/,
    },

    // Example: 3710929503600
    // Example: 1500036879600
    {
        format: 'T',
        matchRegex: /\d{13}/,
    },

    // Example: 1391618796
    // Example: 1391618277
    // Example: 1385216929
    {
        format: 't',
        matchRegex: /\d{10}/,
    },

    // Example: Wed, 30 October 2024 11:00:10 - 0500
    // Example: Wed, 25 September 2024 12:00:10 - 0500
    {
        format: 'EEE, dd MMMM yyyy HH:mm:ss xx',
        replace: [
            {
                from: /\s+-\s(\d{4})$/,
                to: (_, offset) => ` -${offset}`,
            },
        ],
    },

    //  Example: Sunday, Feb. 23, 2020 19:00 AM PST
    {
        format: "EEEE, MMM dd, yyyy HH:mm 'AM' xx",
        replace: [fixTzAbbreviation],
    },
    {
        format: "EEEE, MMM dd, yyyy HH:mm 'PM' xx",
        replace: [fixTzAbbreviation],
    },

    // Example: Sun 25 Jun 2017 16:50:44 AM CDT
    // Example: Thu 09 Feb 2012 05:22:11 PM ART
    // Example: Sat 28 Jan 2012 06:47:44 PM ART
    {
        format: "EEE dd MMM yyyy HH:mm:ss 'AM' xx",
        replace: [fixTzAbbreviation],
    },
    {
        format: "EEE dd MMM yyyy HH:mm:ss 'PM' xx",
        replace: [fixTzAbbreviation],
    },

    // Example: Wed, 20 Dez 2024 09:00:00 GMT
    // Example: Wed, 13 Dez 2024 09:00:00 GMT
    // Example: Wed, 5 Dez 2024 09:00:00 GMT
    {
        format: 'EEE, d MM yyyy HH:mm:ss xx',
        replace: [fixGermanMonth, fixTzAbbreviation],
    },

    // Example: lun, 10 Fév 2025 17:17:44 +0100
    // Example: dim, 09 Fév 2025 09:00:56 +0100
    // Example: sam, 08 Fév 2025 13:46:50 +0100
    {
        format: 'EEE, dd MM yyyy HH:mm:ss xx',
        replace: [fixFrenchWeekday, fixFrenchMonth],
    },

    // Example: mer. 28 févr. 2024 19:34:44 CET
    // Example: ven. 27 oct. 2023 13:43:15 CEST
    // Example: lun. 05 mai 2021 13:43:21 CEST
    {
        format: 'EEE dd MM yyyy HH:mm:ss xx',
        replace: [fixFrenchWeekday, fixFrenchMonth, fixTzAbbreviation],
    },

    // Example: mer. 28 févr. 2024 19:34:44 CET
    // Example: ven. 27 oct. 2023 13:43:15 CEST
    // Example: lun. 05 mai 2021 13:43:21 CEST
    {
        format: 'EEE dd MM yyyy HH:mm:ss xx',
        replace: [fixFrenchWeekday, fixFrenchMonth, fixTzAbbreviation],
    },

    // Example: 14 gennaio 2012
    {
        format: 'd MMMM yyyy',
        locale: it,
    },

    // Example: mer 15/01/2025 - 10:00
    // Example: lun 13/01/2025 - 14:00
    // Example: mer 08/01/2025 - 15:00
    {
        format: 'EEE dd/MM/yyyy - HH:mm',
        locale: fr,
    },

    // Example: 17 mai 2013
    // Example: 5 décembre 2013
    {
        format: 'd MMMM yyyy',
        locale: fr,
    },

    // Example: 1er mars 2013
    {
        format: 'do MMMM yyyy',
        locale: fr,
    },

    // Example: za, 19 okt 2019 11:58:39 +0100
    {
        format: 'EEE, dd MM yyyy HH:mm:ss xx',
        replace: [fixDutchWeekday, fixDutchMonth],
    },

    // Example: 12 Fev 2014 18:36:54 GMT
    // Example: 15 Out 2012 18:36:54 GMT
    {
        format: 'd MM yyyy HH:mm:ss xx',
        replace: [fixPortugeseMonth, fixTzAbbreviation],
    },

    // Example: Wed, 23 Ian 2013 21:00:00 +0200
    // Example: Wed, 30 noiembrie 2011 19:00:00 +0200
    // Example: Wed, 27 iulie 2011 19:00:00 +0200
    {
        format: 'EEE, dd MM yyyy HH:mm:ss xx',
        replace: [fixRomanianMonth],
    },

    // Example: Jue, 27 Ene 2011 11:54:00 GMT
    // Example: Jue, 12 Ago 2010 15:47:00 GMT
    // Example: Lun, 03 Ago 2009 13:00:00 GMT
    {
        format: 'EEE, dd MM yyyy HH:mm:ss xx',
        replace: [fixSpanishWeekday, fixSpanishMonth, fixTzAbbreviation],
    },

    //  Example: WED, 22 dic 2010 18:14:00 +0100
    //  Example: WED, 1 dic 2010 18:14:00 +0100
    {
        format: 'EEE, d MM yyyy HH:mm:ss xx',
        replace: [fixSpanishMonth],
    },

    //  Example: FRI 31 dic 2010 18:14:00 +0100
    {
        format: 'EEE d MM yyyy HH:mm:ss xx',
        replace: [fixSpanishMonth],
    },

    // Example: 2 Oct 2024 09:36AM GMT
    // Example: 1 Oct 2024 18:16PM GMT
    // Example: 28 Sep 2024 00:10AM GMT
    {
        format: "d MMM yyyy HH:mm'AM' xx",
        replace: [fixTzAbbreviation],
    },
    {
        format: "d MMM yyyy HH:mm'PM' xx",
        replace: [fixTzAbbreviation],
    },

    // Example: 木曜日, 26 11 2009 12:30:03 +0900
    // Example: 水曜日, 25 11 2009 12:29:29 +0900
    // Example: 火曜日, 24 11 2009 13:03:26 +0900
    {
        format: 'EEEE, dd MM yyyy HH:mm:ss xx',
        locale: ja,
    },

    //   Do., 31 März 2022 13:21:00 +0200
    //   Di., 08 März 2022 11:32:00 +0100
    {
        format: 'EEE, dd MMMM yyyy HH:mm:ss xx',
        locale: de,
    },

    // Example: Thu, 18 Mar 2016 20:30 21:00 +0300
    {
        format: 'EEE, dd MMM yyyy HH:mm xx',
        replace: [
            {
                from: /(\d{2}:\d{2})\s\d{2}:\d{2}/,
                to: (_match, p1) => p1,
            },
        ],
    },

    // Example: Wed, 15 Jan 2025 17:00 ET
    {
        format: 'EEE, dd MMM yyyy HH:mm xx',
        replace: [fixTzAbbreviation],
    },

    // Example: July 11, 2008 ET
    // Example: April 18, 2008 ET
    // Example: February 22, 2008 ET
    {
        format: 'MMMM dd, yyyy xx',
        replace: [fixTzAbbreviation],
    },

    // Example: Mon, January 6, 2025 at 02:29 PM EST
    // Example: Tue, January 14, 2025 at 02:08 PM EST
    // Example: Wed, January 15, 2025 at 05:09 PM ESTT
    {
        format: "EEE, MMMM d, yyyy 'at' hh:mm a xx",
        replace: [fixTzAbbreviation],
    },

    // Example: Thu, 16 Jan 2025 24:52:03 +0530
    // Example: Thu, 16 Jan 2025 24:15:27 +0530
    // Example: Thu, 16 Jan 2025 24:03:17 +0530
    {
        format: 'EEE, dd MMM yyyy HH:mm:ss xx',
        replace: [fixMidnight],
    },

    // Example: Tis, 03 Maj 2022 08:52:00 +0100
    // Example: Sön, 24 Maj 2020 20:23:00 +0100
    // Example: Lör, 08 Maj 2020 12:10:00 +0100
    // Example: Tis, 05 Maj 2020 21:26:00 +0100
    // Example: tor, 05 maj 2022 10:08:14 +0200
    {
        format: 'EEE, dd MM yyyy HH:mm:ss xx',
        replace: [fixSwedishWeekday, fixSwedishMonth],
    },

    // Example: Do., 16 Dez. 2021 14:30:00 +0100
    {
        format: 'EEE, dd MMM yyyy HH:mm:ss xx',
        locale: de,
    },

    // Example: mar, 28 gen 2025 17:16:05 +0100
    // Example: lun, 27 gen 2025 20:15:56 +0100
    // Example: mar, 28 gen 2025 23:41:32 +0100
    {
        format: 'EEE, dd MMM yyyy HH:mm:ss xx',
        locale: it,
    },

    // Example: on, 17 okt 2018 08:29:22 +0200
    // Example: ti, 16 okt 2018 21:28:14 +0200
    // Example: må, 15 okt 2018 14:16:31 +0200
    {
        format: 'EEE, dd MMM yyyy HH:mm:ss xx',
        locale: sv,
    },

    // Example: 15&nbsp;Apr&nbsp;23
    // Example: 16&nbsp;Jun&nbsp;22
    // Example: 29&nbsp;May&nbsp;22
    {
        format: 'dd MMM yy',
        replace: [{ from: '&nbsp;', to: () => ' ' }],
    },

    // Example: 2025-01-20T15:56:38&#43;08:00
    // Example: 2024-12-06T10:32:22&#43;08:00
    // Example: 2024-10-06T11:10:22&#43;08:00
    {
        format: "yyyy-MM-dd'T'HH:mm:ssxxx",
        replace: [{ from: '&#43;', to: () => '+' }],
    },

    // Example: Wen, 23 fev 2007 12:00:00 +0200
    // Example: Wen, 16 fev 2007 12:00:00 +0200
    // Example: Mon, 07 Fev 2020 09:00:00 +0200
    {
        format: 'EEE, dd MM yyyy HH:mm:ss xx',
        replace: [fixFrenchMonth, { from: 'Wen,', to: () => 'Wed,' }],
    },

    // Example: wed, 15 Février 2008 12:00:00 +0200
    {
        format: 'EEE, dd MMMM yyyy HH:mm:ss xx',
        replace: [fixFrenchMonth],
    },

    // Example: Thu, 16 Jan 2025 24:00:49 +0530
    // Example: Wed, 15 Jan 2025 24:05:22 +0530
    // Example: Mon, 13 Jan 2025 24:06:28 +0530
    // Example: Sun, 12 Jan 2025 24:05:38 +0530
    // Example: Sat, 11 Jan 2025 24:42:29 +0530
    {
        format: 'EEE, d MMM yyyy HH:mm:ss xx',
        replace: [fixMidnight],
    },

    // Example: среда, декабря 14, 2005 - 11:58
    // Example: четверг, марта 1, 2018 - 13:45
    // Example: пятница, октября 29, 2010 - 09:45
    // Example: понедельник, ноября 20, 2023 - 18:00
    // Example: вторник, ноября 21, 2023 - 15:00
    // Example: пятница, ноября 24, 2023 - 12:15
    // Example: понедельник, июня 3, 2024 - 09:15
    // Example: четверг, июня 6, 2024 - 16:00
    // Example: четверг, июля 18, 2024 - 08:00
    // Example: пятница, июля 19, 2024 - 13:28
    // Example: понедельник, октября 7, 2024 - 11:00
    // Example: вторник, октября 8, 2024 - 11:53
    // Example: среда, октября 9, 2024 - 15:17
    // Example: среда, октября 16, 2024 - 13:21
    // Example: четверг, октября 17, 2024 - 09:26
    // Example: понедельник, октября 21, 2024 - 11:06
    {
        format: 'EEEE, MMMM d, yyyy - HH:mm',
        locale: ru,
    },

    // Example: Pzt, 28 Şub 2022 23:08:48 +0300
    {
        format: 'EEE, dd MMM yyyy HH:mm:ss xx',
        locale: tr,
    },

    // Example: lun. 13 mars 2023 12:43:44 CET
    // Example: mar. 24 janv. 2023 12:43:06 CET
    // Example: ven. 02 déc. 2022 12:43:23 CET
    {
        format: 'EEE dd MM yyyy HH:mm:ss xx',
        replace: [fixFrenchMonth, fixFrenchWeekday, fixTzAbbreviation],
    },

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

    // Example: Thu Aug 14 11:22:50 CEST 2014
    // Example: Thu Jul 31 21:49:52 CEST 2014
    // Example: Tue Jul 22 08:59:54 CEST 2014
    // Example: Tue Aug 13 12:43:50 CEST 2013
    // Example: Thu Jan 31 08:15:56 CET 2013
    // Example: Mon Dec 31 19:04:54 CET 2012
    // Example: Thu Nov 22 15:23:09 CET 2012
    // Example: Sat Jun 23 20:25:03 CEST 2012
    // Example: Thu Aug  9 18:09:45 CEST 2012
    // Example: Thu May 24 10:42:33 CEST 2012
    // Example: Thu Apr 5 14:16:01 CEST 2012
    // Example: Sat Mar 10 19:09:17 CET 2012
    {
        format: 'EEE MMM d HH:mm:ss xx yyyy',
        replace: [fixTzAbbreviation],
    },

    // Example: Thu 10 Apr 13:13:18 CEST 2014
    // Example: Sun  9 Mar 19:18:54 CET 2014
    // Example: Tue 25 Feb 13:34:33 CET 2014
    {
        format: 'EEE d MMM HH:mm:ss xx yyyy',
        replace: [fixTzAbbreviation],
    },

    // Example: Mon, 02 May 202215:00:00 EST
    {
        format: 'EEE, dd MMM yyyyHH:mm:ss xx',
        replace: [fixTzAbbreviation],
    },

    // December 12:27:27 CEST 2016
    {
        format: 'MMMM HH:mm:ss xx yyyy',
        replace: [fixTzAbbreviation],
    },

    // Mon 21 April 15:11:43 CET 2020
    {
        format: 'EEE d MMMM HH:mm:ss xx yyyy',
        replace: [fixTzAbbreviation],
    },

    // Example: Tue, 15 Oct 2024 11:41:56 Europe/Dublin
    // Example: Wed, 16 Oct 2024 24:00:00 Asia/Tokyo
    // Example: Thu, 17 Oct 2024 00:15:01 America/New_York
    // Example: Sat, 19 Oct 2024 12:30:45 Australia/Sydney
    {
        format: 'EEE, d MMM yyyy HH:mm:ss',
        tzRegex: commonTzRegex,
        replace: [fixMidnight],
    },

    // Feed: https://www.news18.com/commonfeeds/v1/eng/rss/world.xml.
    // Example: Tue, 15 Oct 2024 24:15:01 +0530.
    {
        format: "EEE, d MMM yyyy HH:mm:ss xx'.'",
        replace: [fixMidnight],
    },

    // Example: mar., 22 juin 2021 18:14:45 +0000
    {
        format: 'EEE, d MMM yyyy HH:mm:ss xx',
        locale: fr,
    },

    // Example: Thu, 23 Ju1 2007 14:21:37 GMT
    {
        format: 'EEE, dd MMM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation, { from: ' Ju1 ', to: () => ' Jul ' }],
    },

    // Example: Mon, 24 Arp 2023 06:50:00 MDT
    {
        format: 'EEE, d MMM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation, { from: ' Arp ', to: () => ' Apr ' }],
    },

    // Example: Tue, 17 07 2018 19:53:23  GMT
    // Example: Mon, 16 07 2018 19:20:52  GMT
    // Example: Fri, 13 07 2018 18:29:39  GMT
    {
        format: 'EEE, d MM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation],
    },

    // Example: 5 Jun 2017 24:05 PDT
    // Example: 12 Sep 2013 24:45 PDT
    {
        format: 'd MMM yyyy HH:mm xx',
        replace: [fixTzAbbreviation, fixMidnight],
    },

    // Example: Tue, 14 Jan 2025 24:23:11 +0530
    // Example: Mon, 30 Dec 2024 24:18:29 +0530
    // Example: Fri, 27 Dec 2024 24:02:43 +0530
    {
        format: 'EEE, d MMM yyyy HH:mm:ss xx',
        replace: [fixMidnight],
    },

    // Feed: http://commandlinefanatic.com/rss.xml
    // Example: Thursday, April 30, 2015, 15:24 - 0700
    {
        format: 'EEEE, MMMM d, yyyy, HH:mm xx',
        replace: [fixTzSpace],
    },

    // Example: Wednesday, 03 Apil 2024 12:00:00 PDT
    // Example: Sunday, 03 Npovember 2019 12:00:00 PDT
    {
        format: 'EEEE, dd MMMM yyyy HH:mm:ss xx',
        replace: [
            fixTzAbbreviation,
            { from: ' Apil ', to: () => ' April ' },
            { from: ' Npovember ', to: () => ' November ' },
        ],
    },

    // Feed: http://www.spacewar.com/Military_Technology.xml
    // Example: Thu, 17 OCT 2024 22:40:13 AEST
    {
        format: 'EEE, d MM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation, fixEnglishMonth],
    },

    // Feed: https://feeds.feedburner.com/Encodednadotcom/Feed
    // Example: Mon, 24th Oct 2016 12:46:05 GMT
    // Example: Thur, 20th Oct 2016 11:49:15 GMT
    // Example: Tue, 18th Oct 2016 11:29:10 GMT
    // Example: Fri, 11th Nov 2016 11:37:58 GMT
    // Example: Fri, 02nd Dec 2016 14:36:08 GMT
    {
        format: 'EEE, do MMM yyyy HH:mm:ss xx',
        replace: [fixTzAbbreviation, { from: 'Thur,', to: () => 'Thu,' }],
    },

    // Feed: https://www.princeedwardisland.ca/en/tender-feed/goods_and_services.xml
    // Example: <span class="date-display-single">2022-09-07</span>
    // Example: <span class="date-display-single">2022-09-14</span>
    // Example: <span class="date-display-single">2018-11-30</span>
    {
        format: 'yyyy-MM-dd',
        replace: [{ from: /<[^>]*>/g, to: () => '' }],
    },

    // Feed:
    // Example: Wed, 26 May 2021 HH:05:ss GMT
    // Example: Wed, 08 Apr 2020 HH:04:ss GMT
    {
        format: "EEE, dd MMM yyyy 'HH:mm:ss' xx",
        replace: [
            fixTzAbbreviation,
            {
                from: /HH:(\d{2}):ss/,
                to: () => 'HH:mm:ss',
            },
        ],
    },

    // Feed:
    // Example: Mon, 19 Noe 2018 13:25:00 +0000
    // Example: Thu, 15 Noe 2018 13:10:00 +0000
    {
        format: 'EEE, dd MMM yyyy HH:mm:ss xx',
        replace: [
            {
                from: 'Noe',
                to: () => 'Nov',
            },
        ],
    },
]

export const dateCustomFormat: ValueParser<Date> = (value) => {
    if (typeof value !== 'string') {
        return
    }

    for (const { format, locale, tzRegex, matchRegex, replace: replaces = [] } of customFormats) {
        let extractedTimezone: string | undefined = '+0000'
        let customizedValue = value

        if (matchRegex && !value.match(matchRegex)) {
            continue
        }

        for (const { from, to } of [...globalReplaces, ...replaces]) {
            customizedValue =
                typeof from === 'string'
                    ? customizedValue.replaceAll(from, to)
                    : customizedValue.replace(from, to)
        }

        if (tzRegex) {
            extractedTimezone = customizedValue.match(tzRegex)?.[1]
            customizedValue = customizedValue.replace(tzRegex, '')
        }

        const parsedDate = parse(
            customizedValue.trim(),
            format,
            new TZDate(new Date(), extractedTimezone),
            { locale: locale || enUS },
        )
        const validatedDate = dateStandard(parsedDate)

        if (
            value === 'Sunday, Feb. 23, 2020 19:00 AM PST' &&
            format === "EEEE, MMM. dd, yyyy HH:mm 'AM' xx"
        ) {
            console.log({ customizedValue, parsedDate, validatedDate, value, format })
        }

        if (validatedDate && isValid(validatedDate)) {
            return new Date(validatedDate?.toISOString())
        }
    }
}
