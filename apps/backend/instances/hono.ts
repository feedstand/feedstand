import { swaggerUI } from '@hono/swagger-ui'
import { type Hook, OpenAPIHono, type OpenAPIObjectConfigure } from '@hono/zod-openapi'
import type { Env, ErrorHandler } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { isDev, version } from '../constants/app.js'
import { path as bullBoardPath } from '../constants/bullBoard.js'
import { openapiPath, swaggerPath } from '../constants/openapi.js'
import { routeHandler as bullBoardRouteHandler } from '../instances/bullBoard.js'
import { sentry } from '../instances/sentry.js'
import * as showChannel from '../routes/channels/show.js'
import * as findFeeds from '../routes/feeds/find.js'
import * as previewFeed from '../routes/feeds/preview.js'
import * as index from '../routes/index/index.js'
import * as listItems from '../routes/items/list.js'
import * as opmlFixables from '../routes/opmls/fixables.js'
import * as createSource from '../routes/sources/create.js'
import * as listSources from '../routes/sources/list.js'
import * as showSource from '../routes/sources/show.js'
import * as updateSource from '../routes/sources/update.js'

const validationHook: Hook<unknown, Env, string, unknown> = (result) => {
  if (!result.success) {
    // If request validation fails, just kick the can further down the road. Any exceptions
    // will be handled by the global error handler defined in `hono.onError`.
    throw result.error
  }
}

const errorHandler: ErrorHandler = (error, context) => {
  sentry?.captureException(error)

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
