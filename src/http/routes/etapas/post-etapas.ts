// postEtapasRoute.ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";
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
        eta_data_inicio: data_inicio, // String ISO
        eta_data_fim: data_fim,       // String ISO
        cha_id: chamado_id,
      });

      reply.status(201).send({ message: "Etapa criada" });
    }
  );
};
