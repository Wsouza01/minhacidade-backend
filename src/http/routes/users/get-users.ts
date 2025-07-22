import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";

export const getUsersRoute: FastifyPluginCallbackZod = (app) => {
  app.get('/users', async () => {
    const results = await db
      .select({
        id: schema.usuarios.usu_id,
        name: schema.usuarios.usu_nome,
      })
      .from(schema.usuarios)
      .orderBy(schema.usuarios.usu_criado)

    return results
  })
}