import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";
import { z } from 'zod'

export const postUsersRoute: FastifyPluginCallbackZod = (app) => {
  app.post('/users', {
    schema: {
      body: z.object({
        nome: z.string().min(1, 'Nome é obrigatório'),
      }),
    },
  }, async (request, reply) => {
    const { nome } = request.body as { nome: string }

    await db.insert(schema.usuarios).values({ usu_nome: nome })

    const results = await db
      .select({
        id: schema.usuarios.usu_id,
        name: schema.usuarios.usu_nome,
      })
      .from(schema.usuarios)
      .orderBy(schema.usuarios.usu_criado)

    reply.send(results)
  })
}