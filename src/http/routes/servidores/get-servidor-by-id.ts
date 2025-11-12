import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { cidades } from '../../../db/schema/cidades.ts'
import { departamentos } from '../../../db/schema/departamentos.ts'
import { funcionarios } from '../../../db/schema/funcionarios.ts'

export const getServidorByIdRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/servidores/:servidorId',
    {
      schema: {
        params: z.object({
          servidorId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { servidorId } = request.params

        const [servidor] = await db
          .select({
            id: funcionarios.fun_id,
            nome: funcionarios.fun_nome,
            email: funcionarios.fun_email,
            cidade: cidades.cid_nome,
          })
          .from(funcionarios)
          .leftJoin(
            departamentos,
            eq(funcionarios.dep_id, departamentos.dep_id),
          )
          .leftJoin(cidades, eq(departamentos.cid_id, cidades.cid_id))
          .where(eq(funcionarios.fun_id, servidorId))

        if (!servidor) {
          return reply.status(404).send({ message: 'Servidor não encontrado' })
        }

        return reply.send(servidor)
      } catch (err) {
        console.error('Erro ao buscar servidor:', err)
        reply.status(500).send({ message: 'Erro ao buscar servidor' })
      }
    },
  )
}
