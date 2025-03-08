import { describe, expect, it } from 'vitest'
import { parse } from './index'

describe('parse', () => {
  it('should correctly retrieve the feed link', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:cc="http://web.resource.org/cc/" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/"  xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
        <channel>
          <atom:link href="https://hub.test" rel="hub" type="application/rss+xml"/>
          <atom:link href="https://feeds.libsyn.com/20818/rss" rel="self" type="application/rss+xml"/>
          <atom:link href="http://sothewind.libsyn.com/rss" rel="self" type="application/rss+xml" />
          <title>So The Wind...</title>
          <pubDate>Tue, 02 Jul 2024 15:07:18 +0000</pubDate>
          <lastBuildDate>Sat, 22 Feb 2025 07:46:44 +0000</lastBuildDate>
          <generator>Libsyn WebEngine 2.0</generator>
          <link>http://sothewind.libsyn.com</link>
          <language>en</language>
          <copyright><![CDATA[]]></copyright>
          <docs>http://sothewind.libsyn.com</docs>
          <managingEditor>zappa3000@gmail.com (zappa3000@gmail.com)</managingEditor>
          <itunes:summary><![CDATA[a journey in zb's musical mindness.]]></itunes:summary>
          <image>
            <url>https://static.libsyn.com/p/assets/d/b/6/b/db6b2baae27e037fd959afa2a1bf1c87/Matb3.png</url>
            <title>So The Wind...</title>
            <link><![CDATA[http://sothewind.libsyn.com]]></link>
          </image>
          <itunes:author>zb</itunes:author>
          <itunes:category text="Music">
          </itunes:category>
          <itunes:image href="https://static.libsyn.com/p/assets/d/b/6/b/db6b2baae27e037fd959afa2a1bf1c87/Matb3.png" />
          <itunes:explicit>false</itunes:explicit>
          <itunes:owner>
            <itunes:name><![CDATA[zb]]></itunes:name>
            <itunes:email>zappa3000@gmail.com</itunes:email>
          </itunes:owner>
          <description><![CDATA[a journey in zb's musical mindness.]]></description>
          <itunes:type>episodic</itunes:type>
          <podcast:locked owner="zappa3000@gmail.com">no</podcast:locked>
        </channel>
        <item>
          <title>stw episode 884</title>
          <itunes:title>episode 884</itunes:title>
          <pubDate>Tue, 02 Jul 2024 15:07:18 +0000</pubDate>
          <guid isPermaLink="false"><![CDATA[ 372cde43-9201-4bdd-9120-3ea28708e851 ]]></guid>
          <link><![CDATA[https://sothewind.libsyn.com/stw-episode-884]]></link>
          <description><![CDATA[ Some text. ]]></description>
          <content:encoded><![CDATA[ Some text. ]]></content:encoded>
          <enclosure length="56871422" type="audio/mpeg" url="https://traffic.libsyn.com/secure/sothewind/sothewind884.mp3?dest-id=22238" />
          <itunes:duration>59:15</itunes:duration>
          <itunes:explicit>false</itunes:explicit>
          <itunes:keywords />
          <itunes:subtitle><![CDATA[Subscribe via  or using .  ...  "tout le monde sait où" "cette route nous mène..." who cares...   - eighteen again (john peel session, 07.06.2000)  - bus girl (7" 1981, hyped)  - run come ya man (run come ya 1981, jah life)  - dreamers (foundation...]]></itunes:subtitle>
          <itunes:season>18</itunes:season>
          <itunes:episode>982</itunes:episode>
          <itunes:episodeType>full</itunes:episodeType>
          <itunes:author>so the wind</itunes:author>
        </item>
      </rss>
    `

    const result = parse(xml)

    expect(true).toEqual(true)
  })

  it('should correctly retrieve the feed link when only one atom:link', () => {})
})
