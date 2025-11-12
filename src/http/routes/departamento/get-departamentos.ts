import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { schema } from '../../../db/schema/index.ts'

const getDepartamentosQuerySchema = z.object({
  cidadeId: z.string().optional(),
})

export const getDepartamentosRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/departamentos',
    {
      schema: {
        querystring: getDepartamentosQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        const { cidadeId } = request.query

        let query = db.select().from(schema.departamentos)

        // Filtrar por cidade se cidadeId foi fornecido
        if (cidadeId) {
          query = query.where(eq(schema.departamentos.cid_id, cidadeId))
        }

        const dados = await query
        reply.send(dados)
      } catch (err) {
        console.error('Erro ao buscar departamentos:', err)
        reply.status(500).send({ message: 'Erro ao buscar departamentos' })
      }
    },
  )
}
