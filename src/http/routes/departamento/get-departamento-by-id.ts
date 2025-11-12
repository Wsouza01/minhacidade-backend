import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { departamentos } from '../../../db/schema/departamentos.ts'

export const getDepartamentoByIdRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/departamentos/:id',
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

        const departamento = await db
          .select()
          .from(departamentos)
          .where(eq(departamentos.dep_id, id))
          .limit(1)

        if (departamento.length === 0) {
          return reply.status(404).send({
            message: 'Departamento não encontrado',
          })
        }

        console.log('📋 Departamento encontrado:', departamento[0])

        reply.send(departamento[0])
      } catch (error) {
        console.error('Erro ao buscar departamento:', error)
        reply.status(500).send({ message: 'Erro interno do servidor' })
      }
    },
  )
}
