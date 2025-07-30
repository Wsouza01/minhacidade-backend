import type { FastifyPluginCallback } from "fastify";
import { z } from "zod";
import { db } from "../../../db/connection.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";

// Schema de resposta
const GetUsersResponse = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  cpf: z.string(),
});

const GetUsersResponseArray = z.array(GetUsersResponse);

export const getUsersRoute: FastifyPluginCallback = (app) => {
  app.get("/users", {
    schema: {
      response: {
        200: GetUsersResponseArray,
      },
    },
  }, async (request, reply) => {
    const results = await db
      .select({
        id: usuarios.usu_id,
        nome: usuarios.usu_nome,
        email: usuarios.usu_email,
        cpf: usuarios.usu_cpf,
      })
      .from(usuarios);

    return reply.send(results);
  });
};