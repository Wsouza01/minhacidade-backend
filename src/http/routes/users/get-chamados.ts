// getChamadosRoute.ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection";
import { schema } from "../../../db/schema";

export const getChamadosRoute: FastifyPluginCallbackZod = (app) => {
  app.get("/chamados", async (_, reply) => {
    const chamados = await db.select().from(schema.chamados);
    reply.send(chamados);
  });
};
