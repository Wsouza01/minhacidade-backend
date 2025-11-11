import jwt from '@fastify/jwt'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { env } from '../../env.ts'

export const jwtPlugin: FastifyPluginAsyncZod = async (app) => {
  app.register(jwt, {
    secret: env.JWT_SECRET,
  })
}
