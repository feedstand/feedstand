import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { resolveRedirectUrl } from './resolveRedirectUrl'

const server = setupServer(
  http.head('https://example.com/redirect', () => {
    return new HttpResponse(null, {
      status: 302,
      headers: { Location: 'https://example.com/destination' },
    })
  }),

  http.head('https://example.com/destination', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.head('https://example.com/no-redirect', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.head('https://example.com/error', () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.head('https://example.com/multiple-redirects', () => {
    return new HttpResponse(null, {
      status: 302,
      headers: { Location: 'https://example.com/intermediate' },
    })
  }),

  http.head('https://example.com/intermediate', () => {
    return new HttpResponse(null, {
      status: 302,
      headers: { Location: 'https://example.com/final' },
    })
  }),

  http.head('https://example.com/final', () => {
    return new HttpResponse(null, { status: 200 })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('resolveRedirectUrl with MSW v2', () => {
  it('should follow redirects correctly', async () => {
    const result = await resolveRedirectUrl('https://example.com/redirect')

    expect(result).toEqual('https://example.com/destination')
  })

  it('should return the same URL when no redirect occurs', async () => {
    const url = 'https://example.com/no-redirect'
    const result = await resolveRedirectUrl(url)

    expect(result).toEqual('https://example.com/no-redirect')
  })

  it('should handle server errors', async () => {
    await expect(resolveRedirectUrl('https://example.com/error')).rejects.toThrow()
  })

  it('should handle multiple redirects', async () => {
    const result = await resolveRedirectUrl('https://example.com/multiple-redirects')

    expect(result).toEqual('https://example.com/final')
  })
})
