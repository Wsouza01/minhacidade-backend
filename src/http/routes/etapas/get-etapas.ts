// getEtapasRoute.ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/index.ts";
import { schema } from "../../../db/schema/index.ts";

export const getEtapasRoute: FastifyPluginCallbackZod = (app) => {
  app.get("/etapas", async (_, reply) => {
    const etapas = await db.select().from(schema.etapas);
    reply.send(etapas);
  });
};
