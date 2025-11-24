import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { chamados } from '../../../db/schema/chamados.js'
import { funcionarios } from '../../../db/schema/funcionarios.js'
export const getServidoresWorkload = async (app) => {
  app.get(
    '/servidores/workload',
    {
      schema: {
        querystring: z.object({
          cidadeId: z.string().uuid(),
        }),
      },
    },
    async (req, reply) => {
      const { cidadeId } = req.query
      try {
        // Buscar todos os servidores da cidade
        const servidoresData = await db
          .select({
            fun_id: funcionarios.fun_id,
            fun_nome: funcionarios.fun_nome,
            fun_email: funcionarios.fun_email,
            dep_id: funcionarios.dep_id,
          })
          .from(funcionarios)
          .where(
            and(
              eq(funcionarios.cid_id, cidadeId),
              eq(funcionarios.fun_tipo, 'servidor'),
            ),
          )
        // Para cada servidor, contar chamados abertos
        const servidoresComWorkload = await Promise.all(
          servidoresData.map(async (servidor) => {
            const [_resultado] = await db
              .select()
              .from(chamados)
              .where(
                and(
                  eq(chamados.cha_responsavel, servidor.fun_id),
                  isNull(chamados.cha_data_fechamento),
                ),
              )
            const chamadosAbertos = await db
              .select()
              .from(chamados)
              .where(
                and(
                  eq(chamados.cha_responsavel, servidor.fun_id),
                  isNull(chamados.cha_data_fechamento),
                ),
              )
            return {
              fun_id: servidor.fun_id,
              fun_nome: servidor.fun_nome,
              fun_email: servidor.fun_email,
              chamados_abertos: chamadosAbertos.length,
            }
          }),
        )
        return reply.status(200).send(servidoresComWorkload)
      } catch (error) {
        console.error('[GET /servidores/workload] Erro:', error)
        return reply.status(500).send({
          error: 'Erro ao buscar workload dos servidores',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )
}
