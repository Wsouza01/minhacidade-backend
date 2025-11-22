import jwt from '@fastify/jwt'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { env } from '../../env.js'

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      sub: string
    }
  }
}

export const jwtPlugin: FastifyPluginAsyncZod = async (app) => {
  app.register(jwt, {
    secret: env.JWT_SECRET,
  })
}
