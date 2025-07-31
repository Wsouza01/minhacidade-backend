import { and, eq } from 'drizzle-orm'
import type { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { db } from '../../../db/connection.ts'
import { cidades } from '../../../db/schema/cidades.ts'

export const getCidadesRoute: FastifyPluginCallback = (app) => {
  // Lista pública de cidades ativas
  app.get('/cidades', {
    schema: {
      querystring: z.object({
        estado: z.string().length(2).optional(),
      }),
      response: {
        200: z.array(
          z.object({
            id: z.string().uuid(),
            nome: z.string(),
            estado: z.string().length(2),
          })
        )
      }
    }
  }, async (request, reply) => {
    try {
      const { estado } = request.query

      let query = db
        .select({
          id: cidades.cid_id,
          nome: cidades.cid_nome,
          estado: cidades.cid_estado,
        })
        .from(cidades)
        .where(eq(cidades.cid_ativo, true))

      if (estado) {
        query = query.where(eq(cidades.cid_estado, estado))
      }

      const cidadesAtivas = await query
      return reply.send(cidadesAtivas)
    } catch (error) {
      console.error('Erro ao buscar cidades:', error)
      return reply.status(500).send({
        message: 'Erro ao buscar cidades',
        error: error.message
      })
    }
  })
}