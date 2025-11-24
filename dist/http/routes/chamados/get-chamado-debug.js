import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { chamados } from '../../../db/schema/chamados.js'

const getChamadoByIdParamsSchema = z.object({
  id: z.string().uuid(),
})
export const getChamadoDebugRoute = (app) => {
  app.get(
    '/chamados-debug/:id',
    {
      schema: {
        params: getChamadoByIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        console.log('🔍 DEBUG: Buscando chamado ID:', id)
        // Query mais simples possível
        const chamadoResult = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, id))
          .limit(1)
        console.log(
          '✅ DEBUG: Query executada, resultados:',
          chamadoResult.length,
        )
        if (chamadoResult.length === 0) {
          return reply.status(404).send({ message: 'Chamado não encontrado' })
        }
        const chamado = chamadoResult[0]
        console.log(
          '📝 DEBUG: Dados encontrados:',
          JSON.stringify(chamado, null, 2),
        )
        reply.send({
          success: true,
          data: chamado,
        })
      } catch (err) {
        console.error('❌ DEBUG: Erro detalhado:', err)
        console.error(
          '❌ DEBUG: Stack trace:',
          err instanceof Error ? err.stack : 'No stack trace',
        )
        reply.status(500).send({
          message: 'Erro na query debug',
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        })
      }
    },
  )
}
