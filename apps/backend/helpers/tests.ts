import type { IncomingMessage, ServerResponse } from 'node:http'
import http from 'node:http'

export type TestServerOptions = {
  statusCode?: number
  delay?: number
  body?: string | Buffer
  headers?: Record<string, string>
  chunked?: boolean
  chunkDelay?: number
  dropConnection?: boolean
  infiniteStream?: boolean
  malformedResponse?: boolean
}

export class TestHttpServer {
  private server!: http.Server
  private port!: number
  public url!: string

  async start(handler: http.RequestListener): Promise<void> {
    this.server = http.createServer(handler)

    await new Promise<void>((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen(0, () => {
        const address = this.server.address()
        if (address && typeof address === 'object') {
          this.port = address.port
          this.url = `http://localhost:${this.port}`
          resolve()
        } else {
          reject(new Error('Failed to get server port'))
        }
      })
    })
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  respondWith(options: TestServerOptions): http.RequestListener {
    return async (req: IncomingMessage, res: ServerResponse) => {
      if (options.dropConnection) {
        req.socket.destroy()
        return
      }

      if (options.delay) {
        await new Promise((resolve) => setTimeout(resolve, options.delay))
      }

      if (options.malformedResponse) {
        req.socket.write('INVALID HTTP RESPONSE\r\n\r\n')
        req.socket.end()
        return
      }

      if (options.infiniteStream) {
        res.writeHead(options.statusCode || 200, options.headers || {})
        res.write('Starting infinite stream...')
        return
      }

      const statusCode = options.statusCode || 200
      const headers = options.headers || {}
      const body = options.body ?? 'OK'

      if (options.chunked) {
        res.writeHead(statusCode, {
          ...headers,
          'Transfer-Encoding': 'chunked',
        })

        const chunks = typeof body === 'string' ? body.match(/.{1,10}/g) || [body] : [body]

        for (const chunk of chunks) {
          res.write(chunk)
          if (options.chunkDelay) {
            await new Promise((resolve) => setTimeout(resolve, options.chunkDelay))
          }
        }

        res.end()
      } else {
        res.writeHead(statusCode, headers)
        res.end(body)
      }
    }
  }
}
