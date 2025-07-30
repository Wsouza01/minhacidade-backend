// postChamadosRoute.ts
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";
import { z } from "zod";

export const postChamadosRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/chamados",
    {
      schema: {
        body: z.object({
          titulo: z.string(),
          descricao: z.string(),
          nome: z.string(),
          cep: z.string().optional(),
          numero_endereco: z.string().optional(),
          prioridade: z.string(),
          usuario_id: z.string().uuid(),
          categoria_id: z.string().uuid(),
          departamento_id: z.string().uuid(),
          responsavel_id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const body = request.body;

      await db.insert(schema.chamados).values({
        cha_titulo: body.titulo,
        cha_descricao: body.descricao,
        cha_nome: body.nome,
        cha_cep: body.cep,
        cha_numero_endereco: body.numero_endereco,
        cha_data_abertura: new Date(),
        cha_prioridade: body.prioridade,
        usu_id: body.usuario_id,
        cat_id: body.categoria_id,
        cha_departamento: body.departamento_id,
        cha_responsavel: body.responsavel_id,
      });

      reply.status(201).send({ message: "Chamado criado" });
    }
  );
};
