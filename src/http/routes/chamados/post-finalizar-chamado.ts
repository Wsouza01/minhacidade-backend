import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { chamados } from '../../../db/schema/chamados.ts'

export const finalizarChamadoRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/chamados/:chamadoId/finalizar',
    {
      schema: {
        params: z.object({
          chamadoId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { chamadoId } = request.params

        await db
          .update(chamados)
          .set({ cha_status: 'finalizado', cha_data_fechamento: new Date() })
          .where(eq(chamados.cha_id, chamadoId))

        return reply.status(204).send()
      } catch (err) {
        console.error('Erro ao finalizar chamado:', err)
        reply.status(500).send({ message: 'Erro ao finalizar chamado' })
      }
    },
  )
}
