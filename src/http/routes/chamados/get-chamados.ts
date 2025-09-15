import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/connection.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { departamentos } from "../../../db/schema/departamentos.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";
import { eq, desc } from "drizzle-orm";

const getChamadosQuerySchema = z.object({
  limit: z.string().optional(),
});

export const getChamadosRoute: FastifyPluginCallbackZod = (app) => {
  // Route to get all tickets with optional limit
  app.get(
    "/chamados",
    {
      schema: {
        querystring: getChamadosQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        const { limit } = request.query;
        const limitNumber = limit ? parseInt(limit) : undefined;

        let query = db
          .select({
            cha_id: chamados.cha_id,
            cha_nome: chamados.cha_nome,
            cha_titulo: chamados.cha_titulo,
            cha_descricao: chamados.cha_descricao,
            cha_departamento: chamados.cha_departamento,
            cha_responsavel: chamados.cha_responsavel,
            cha_data_abertura: chamados.cha_data_abertura,
            cha_data_fechamento: chamados.cha_data_fechamento,
            cha_prioridade: chamados.cha_prioridade,
            cha_cep: chamados.cha_cep,
            cha_numero_endereco: chamados.cha_numero_endereco,
            cat_id: chamados.cat_id,
            usu_id: chamados.usu_id,
            departamento_nome: departamentos.dep_nome,
            categoria_nome: categorias.cat_nome,
            usuario_nome: usuarios.usu_nome,
          })
          .from(chamados)
          .leftJoin(departamentos, eq(chamados.cha_departamento, departamentos.dep_id))
          .leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .leftJoin(usuarios, eq(chamados.usu_id, usuarios.usu_id))
          .orderBy(desc(chamados.cha_data_abertura));

        if (limitNumber) {
          query = query.limit(limitNumber);
        }

        const results = await query;
        reply.send(results);
      } catch (err) {
        console.error("Erro ao buscar chamados:", err);
        reply.status(500).send({ message: "Erro ao buscar chamados" });
      }
    }
  );

  // Route to get chamados count
  app.get("/chamados/count", async (_, reply) => {
    try {
      const result = await db
        .select({ count: db.count() })
        .from(chamados);

      const totalChamados = Number(result[0]?.count) || 0;
      reply.send({ total: totalChamados });
    } catch (err) {
      console.error("Erro ao contar chamados:", err);
      reply.status(500).send({ message: "Erro ao contar chamados" });
    }
  });
};
