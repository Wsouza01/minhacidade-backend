// routes/getCategorias.ts
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { db } from '../../../db/index.ts'
import { categorias } from '../../../db/schema/categorias.ts'

export const getCategoriasRoute: FastifyPluginCallbackZod = (app) => {
  app.get('/categorias', async (_, reply) => {
    const results = await db.select().from(categorias)
    reply.send(results)
  })
}
