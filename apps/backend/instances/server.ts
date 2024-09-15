import http from 'http'
import Koa from 'koa'
import Router from '@koa/router'

export const app = new Koa()

export const router = new Router()

export const server = http.createServer(app.callback())
