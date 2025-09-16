import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/connection.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { departamentos } from "../../../db/schema/departamentos.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { eq, desc } from "drizzle-orm";

const getChamadosUserRequestSchema = z.object({
  usuarioId: z.string().uuid(),
});

export const getChamadosUserRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    "/chamados/user/:usuarioId",
    {
      schema: {
        params: getChamadosUserRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const { usuarioId } = request.params;

        const results = await db
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
            departamento_nome: departamentos.dep_nome,
            categoria_nome: categorias.cat_nome,
          })
          .from(chamados)
          .leftJoin(departamentos, eq(chamados.cha_departamento, departamentos.dep_id))
          .leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .where(eq(chamados.usu_id, usuarioId))
          .orderBy(desc(chamados.cha_data_abertura));

        reply.send(results);
      } catch (error) {
        console.error("Erro ao buscar chamados do usuário:", error);
        reply.status(500).send({ message: "Erro ao buscar chamados" });
      }
    }
  );
};
