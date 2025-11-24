import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '../../../db/index.js'
import { chamados } from '../../../db/schema/chamados.js'
import { etapas } from '../../../db/schema/etapas.js'
export const postEtapasRoute = async (app) => {
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
      const { id } = request.params
      const { nome, descricao } = request.body
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
