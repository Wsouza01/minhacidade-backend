// postAnexosRoute.ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection";
import { schema } from "../../../db/schema";
import { z } from "zod";

export const postAnexosRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/anexos",
    {
      schema: {
        body: z.object({
          url: z.string().url(),
          chamado_id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { url, chamado_id } = request.body;

      await db.insert(schema.anexos).values({
        anx_url: url,
        cha_id: chamado_id,
      });

      reply.status(201).send({ message: "Anexo criado" });
    }
  );
};
