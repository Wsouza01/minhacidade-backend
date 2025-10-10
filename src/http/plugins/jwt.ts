import jwt from "@fastify/jwt"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"

export const jwtPlugin: FastifyPluginAsyncZod = async (app) => {
  app.register(jwt, {
    secret: process.env.JWT_SECRET || "minha-cidade-secret-key-2025",
  })
}
