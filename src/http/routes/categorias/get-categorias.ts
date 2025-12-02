import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { categorias } from '../../../db/schema/categorias.js'

export const getCategoriasRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/categorias',
    {
      schema: {
        querystring: z.object({
        }),
      },
    },
    async (request, reply) => {
      const categoriasResult = await db.select().from(categorias)
      return reply.send(categoriasResult)
    },
  )
}
