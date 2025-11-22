import { sql } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { db } from '../../../db/index.js'

export const fixStatusRoute: FastifyPluginCallbackZod = (app) => {
  app.post('/chamados/fix-status', async (_, reply) => {
    try {
      // Atualizar todos com status NULL para 'Pendente'
      await db.execute(
        sql`UPDATE chamado SET cha_status = 'Pendente' WHERE cha_status IS NULL`,
      )

      // Atualizar fechados para 'Resolvido'
      await db.execute(
        sql`UPDATE chamado SET cha_status = 'Resolvido' WHERE cha_data_fechamento IS NOT NULL AND cha_status = 'Pendente'`,
      )

      return reply.send({
        message: 'Status dos chamados atualizados com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      return reply.status(500).send({ error: 'Erro ao atualizar status' })
    }
  })
}
