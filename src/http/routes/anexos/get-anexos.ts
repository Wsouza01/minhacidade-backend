import type { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { anexos } from '../../../db/schema/anexos.ts'

// Schema de resposta
const GetAnexosResponse = z.object({
  id: z.string(),
  tipo: z.string(),
  url: z.string(),
  chamado_id: z.string().optional(),
})

const GetAnexosResponseArray = z.array(GetAnexosResponse)

export const getAnexosRoute: FastifyPluginCallback = (app) => {
  app.get(
    '/anexos',
    {
      schema: {
        response: {
          200: GetAnexosResponseArray,
        },
      },
    },
    async (_request, reply) => {
      const results = await db
        .select({
          id: anexos.anx_id,
          tipo: anexos.anx_tipo,
          url: anexos.anx_url,
          chamado_id: anexos.cha_id,
        })
        .from(anexos)

      return reply.send(results)
    },
  )
}
