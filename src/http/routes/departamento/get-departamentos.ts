import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";

export const getDepartamentosRoute: FastifyPluginCallbackZod = (app) => {
  app.get("/departamentos", async (_, reply) => {
    try {
      const dados = await db.select().from(schema.departamentos);
      reply.send(dados);
    } catch (err) {
      console.error("Erro ao buscar departamentos:", err);
      reply.status(500).send({ message: "Erro ao buscar departamentos" });
    }
  });
};
