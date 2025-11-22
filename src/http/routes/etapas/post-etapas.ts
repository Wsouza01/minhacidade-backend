import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../../db/index.js'
import { chamados } from '../../../db/schema/chamados.js'
import { etapas } from '../../../db/schema/etapas.js'

export const postEtapasRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/chamados/:id/etapas',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          nome: z.string(),
          descricao: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { nome, descricao } = request.body as { nome: string; descricao?: string }

      const chamado = await db
        .select()
        .from(chamados)
        .where(eq(chamados.cha_id, id))
        .limit(1)

      if (!chamado.length) {
        return reply.status(404).send({ message: 'Chamado não encontrado' })
      }

      const novaEtapa = await db
        .insert(etapas)
        .values({
          eta_nome: nome,
          eta_descricao: descricao || '',
          cha_id: id,
        })
        .returning()

      return reply.status(201).send(novaEtapa[0])
    },
  )
}
