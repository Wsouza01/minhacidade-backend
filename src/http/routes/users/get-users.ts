import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";

export const getUsersRoute: FastifyPluginCallbackZod = (app) => {
  app.get("/users", async (request, reply) => {
    const results = await db
      .select({
        id: schema.usuarios.usu_id,
        nome: schema.usuarios.usu_nome,
        email: schema.usuarios.usu_email,
        cpf: schema.usuarios.usu_cpf,
      })
      .from(schema.usuarios);

    reply.send(results);
  });
};
