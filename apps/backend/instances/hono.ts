import { swaggerUI } from '@hono/swagger-ui'
import { type Hook, OpenAPIHono, type OpenAPIObjectConfigure } from '@hono/zod-openapi'
import type { Env, ErrorHandler } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { isDev, version } from '../constants/app.ts'
import { path as bullBoardPath } from '../constants/bullBoard.ts'
import { openapiPath, swaggerPath } from '../constants/openapi.ts'
import { routeHandler as bullBoardRouteHandler } from '../instances/bullBoard.ts'
import { sentry } from '../instances/sentry.ts'
import * as showChannel from '../routes/channels/show.ts'
import * as findFeeds from '../routes/feeds/find.ts'
import * as previewFeed from '../routes/feeds/preview.ts'
import * as index from '../routes/index/index.ts'
import * as listItems from '../routes/items/list.ts'
import * as opmlFixables from '../routes/opmls/fixables.ts'
import * as createSource from '../routes/sources/create.ts'
import * as listSources from '../routes/sources/list.ts'
import * as showSource from '../routes/sources/show.ts'
import * as updateSource from '../routes/sources/update.ts'

const validationHook: Hook<unknown, Env, string, unknown> = (result) => {
  if (!result.success) {
    // If request validation fails, just kick the can further down the road. Any exceptions
    // will be handled by the global error handler defined in `hono.onError`.
    throw result.error
  }
}

const errorHandler: ErrorHandler = (error, context) => {
  sentry?.captureException?.(error)

  if (error instanceof HTTPException) {
    return context.json({ message: error.message, cause: error.cause }, error.status)
  }

  if (error instanceof ZodError) {
    return context.json({ cause: error.issues }, 422)
  }

  return isDev
    ? context.json({ message: error.message, cause: error.cause }, 500)
    : context.json({ message: 'Something went wrong' }, 500)
}

const openapiConfig: OpenAPIObjectConfigure<Env, string> = {
  openapi: '3.1.0',
  info: {
    title: 'Feedstand API',
    version,
  },
}

// TODO: Ideally the whole configuration of Hono instance (registering routes, global error handlers
// and middlewares) should be moved somewhere else as it does not fit into the /instances folder.

export const hono = new OpenAPIHono({ defaultHook: validationHook })

hono.use('*', compress())
hono.use('*', cors()) // TODO: Configure CORS to allow requests only from frontend.
hono.onError(errorHandler)
hono.get(swaggerPath, swaggerUI({ url: openapiPath }))
hono.route(bullBoardPath, bullBoardRouteHandler)

export const openapi = hono
  .doc31(openapiPath, openapiConfig)
  .openapi(index.route, index.handler)
  .openapi(showChannel.route, showChannel.handler)
  .openapi(listItems.route, listItems.handler)
  .openapi(listSources.route, listSources.handler)
  .openapi(showSource.route, showSource.handler)
  .openapi(createSource.route, createSource.handler)
  .openapi(updateSource.route, updateSource.handler)
  .openapi(previewFeed.route, previewFeed.handler)
  .openapi(findFeeds.route, findFeeds.handler)
  .openapi(opmlFixables.route, opmlFixables.handler)
