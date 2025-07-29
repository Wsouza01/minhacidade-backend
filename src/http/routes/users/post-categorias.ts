// routes/postCategorias.ts
import { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { z } from "zod";

export const postCategoriasRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/categorias",
    {
      schema: {
        body: z.object({
          nome: z.string(),
          descricao: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { nome, descricao } = request.body;
      await db.insert(categorias).values({
        cat_nome: nome,
        cat_descricao: descricao,
      });
      reply.status(201).send({ message: "Categoria criada" });
    }
  );
};
