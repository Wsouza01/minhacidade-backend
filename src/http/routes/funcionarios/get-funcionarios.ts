import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";

export const getFuncionariosRoute: FastifyPluginCallbackZod = (app) => {
  app.get("/funcionarios", async (_, reply) => {
    const results = await db.select().from(schema.funcionarios);
    reply.send(results);
  });
};
