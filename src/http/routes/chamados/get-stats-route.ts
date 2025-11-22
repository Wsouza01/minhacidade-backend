import { and, eq, inArray } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { chamados } from '../../../db/schema/chamados.js'
import { departamentos } from '../../../db/schema/departamentos.js'

export const getStatsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/chamados/stats',
    {
      schema: {
        querystring: z.object({
          cidadeId: z.string().uuid().optional(),
          servidorId: z.string().uuid().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { cidadeId, servidorId } = request.query

      try {
        // Build WHERE conditions
        const conditions: any[] = []

        if (cidadeId) {
          const subquery = db
            .select({ id: departamentos.dep_id })
            .from(departamentos)
            .where(eq(departamentos.cid_id, cidadeId))

          conditions.push(inArray(chamados.cha_departamento, subquery))
        }

        if (servidorId) {
          conditions.push(eq(chamados.cha_responsavel, servidorId))
        }

        // Fetch all chamados matching the conditions
        let query = db.select().from(chamados)

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any
        }

        const allChamados = await query

        // Calculate stats manually
        const stats = {
          total: allChamados.length,
          resolvidos: allChamados.filter((c) => c.cha_data_fechamento !== null)
            .length,
          pendentes: allChamados.filter(
            (c) => c.cha_data_fechamento === null && c.cha_responsavel === null,
          ).length,
          emAndamento: allChamados.filter(
            (c) => c.cha_data_fechamento === null && c.cha_responsavel !== null,
          ).length,
          prioridadeAlta: allChamados.filter(
            (c) =>
              c.cha_prioridade === 'Alta' && c.cha_data_fechamento === null,
          ).length,
        }

        return reply.send(stats)
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err)
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Erro ao buscar estatísticas de chamados.',
        })
      }
    },
  )
}
