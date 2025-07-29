// postEtapasRoute.ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection";
import { schema } from "../../../db/schema";
import { z } from "zod";

export const postEtapasRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/etapas",
    {
      schema: {
        body: z.object({
          nome: z.string(),
          descricao: z.string(),
          data_inicio: z.string().datetime(),
          data_fim: z.string().datetime(),
          chamado_id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { nome, descricao, data_inicio, data_fim, chamado_id } =
        request.body;

      await db.insert(schema.etapas).values({
        eta_nome: nome,
        eta_descricao: descricao,
        eta_data_inicio: new Date(data_inicio),
        eta_data_fim: new Date(data_fim),
        cha_id: chamado_id,
      });

      reply.status(201).send({ message: "Etapa criada" });
    }
  );
};
