import { eq, sql } from 'drizzle-orm'
import type { FastifyPluginCallback } from 'fastify'
import { db } from '../../../db/index.js'
import { usuarios } from '../../../db/schema/usuarios.js'

export const checkCpfRoute: FastifyPluginCallback = (app) => {
  app.get('/users/check-cpf/:cpf', async (request, reply) => {
    const { cpf } = request.params as { cpf: string }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(usuarios)
      .where(eq(usuarios.usu_cpf, cpf))

    const exists = Number(result[0]?.count) > 0

    return reply.send({ exists })
  })
}
