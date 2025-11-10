export const maxRetries = 3

export const maxRedirects = 5

export const maxTimeout = 20 * 1000

export const maxContentSize = 100 * 1024 * 1024

export const maxHeaderSize = 64 * 1024

export const avoidedContentTypes = ['audio/', 'video/', 'image/']

export const htmlContentTypes = ['text/html', 'application/xhtml+xml']

export const jsonFeedContentTypes = ['application/json']

export const xmlFeedContentTypes = [
  'application/rdf+xml',
  'application/rss+xml',
  'application/atom+xml',
  'application/xml', // Not ideal, it should probably be discarded at some point.
  'text/rdf+xml', // Legacy, for supporting very old websites only.
  'text/rss+xml', // Legacy, for supporting very old websites only.
  'text/atom+xml', // Legacy, for supporting very old websites only.
  'text/xml', // Legacy, for supporting very old websites only.
]

export const anyFeedContentTypes = [...jsonFeedContentTypes, ...xmlFeedContentTypes]

export const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.92',
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.119 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Android 14; Mobile; rv:123.0) Gecko/123.0 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Brave/122.0.0.0',
]

export const commonHeaders = {
  'User-Agent': 'Undisclosed/0.0',
  'sec-ch-ua': '"Not(A:Brand";v="99", "Brave";v="133", "Chromium";v="133"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'sec-gpc': '1',
}
