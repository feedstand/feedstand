import { path } from '../../constants/bullboard'
import { serverAdapter } from '../../instances/bullboard'
import { hono } from '../../instances/hono'

hono.route(path, serverAdapter.registerPlugin())
