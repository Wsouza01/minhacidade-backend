import { and, count, eq, isNotNull, isNull } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { chamados } from '../../../db/schema/chamados.ts'

export const getDepartamentoStatsRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/departamentos/:id/stats',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        // Buscar estatísticas dos chamados do departamento
        const [stats] = await db
          .select({
            total: count(),
          })
          .from(chamados)
          .where(eq(chamados.cha_departamento, id))

        // Buscar chamados resolvidos (com data de fechamento)
        const [resolvidos] = await db
          .select({
            count: count(),
          })
          .from(chamados)
          .where(
            and(
              eq(chamados.cha_departamento, id),
              isNotNull(chamados.cha_data_fechamento),
            ),
          )

        // Buscar chamados em andamento (com responsável mas sem data de fechamento)
        const [emAndamento] = await db
          .select({
            count: count(),
          })
          .from(chamados)
          .where(
            and(
              eq(chamados.cha_departamento, id),
              isNotNull(chamados.cha_responsavel),
              isNull(chamados.cha_data_fechamento),
            ),
          )

        // Buscar chamados pendentes (sem responsável e sem data de fechamento)
        const [pendentes] = await db
          .select({
            count: count(),
          })
          .from(chamados)
          .where(
            and(
              eq(chamados.cha_departamento, id),
              isNull(chamados.cha_responsavel),
              isNull(chamados.cha_data_fechamento),
            ),
          )

        const result = {
          total: stats?.total || 0,
          resolvidos: resolvidos?.count || 0,
          emAndamento: emAndamento?.count || 0,
          pendentes: pendentes?.count || 0,
        }

        console.log(`📊 Stats do departamento ${id}:`, result)

        reply.send(result)
      } catch (error) {
        console.error('Erro ao buscar estatísticas do departamento:', error)
        reply.status(500).send({ message: 'Erro interno do servidor' })
      }
    },
  )
}
