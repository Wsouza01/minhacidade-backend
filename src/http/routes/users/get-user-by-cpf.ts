import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { usuarios } from '../../../db/schema/usuarios.js'

const getUserByCpfRequestSchema = z.object({
  cpf: z.string().min(11).max(11),
})

export const getUserByCpfRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/users/cpf/:cpf',
    {
      schema: {
        params: getUserByCpfRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const { cpf } = request.params

        const user = await db
          .select({
            usu_id: usuarios.usu_id,
            usu_nome: usuarios.usu_nome,
            usu_email: usuarios.usu_email,
            usu_cpf: usuarios.usu_cpf,
            usu_tipo: usuarios.usu_tipo,
            usu_ativo: usuarios.usu_ativo,
            cid_id: usuarios.cid_id,
            usu_endereco: usuarios.usu_endereco,
          })
          .from(usuarios)
          .where(eq(usuarios.usu_cpf, cpf))
          .limit(1)

        if (user.length === 0) {
          return reply.status(404).send({ error: 'Usuário não encontrado' })
        }

        reply.send(user[0])
      } catch (error) {
        console.error('Erro ao buscar usuário por CPF:', error)
        reply.status(500).send({ message: 'Erro ao buscar usuário' })
      }
    },
  )
}
