// routes/postCategorias.ts
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { categorias } from '../../../db/schema/categorias.js'

export const postCategoriasRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/categorias',
    {
      schema: {
        body: z.object({
          nome: z.string(),
          descricao: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { nome, descricao } = request.body
      await db.insert(categorias).values({
        cat_nome: nome,
        cat_descricao: descricao,
      })
      reply.status(201).send({ message: 'Categoria criada' })
    },
  )
}
