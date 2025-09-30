import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/connection.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { departamentos } from "../../../db/schema/departamentos.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";
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
            id: chamados.cha_id,
            nome: usuarios.usu_nome,
            titulo: chamados.cha_titulo,
            mensagem: chamados.cha_descricao,
            departamento: departamentos.dep_nome,
            responsavel: chamados.cha_responsavel,
            dataCriacao: chamados.cha_data_abertura,
            dataFechamento: chamados.cha_data_fechamento,
            prioridade: chamados.cha_prioridade,
            cep: chamados.cha_cep,
            numeroEndereco: chamados.cha_numero_endereco,
            categoriaId: chamados.cat_id,
            usuarioId: chamados.usu_id,
            status: chamados.cha_responsavel, // Use responsavel as status indicator
          })
          .from(chamados)
          .leftJoin(departamentos, eq(chamados.cha_departamento, departamentos.dep_id))
          .leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .leftJoin(usuarios, eq(chamados.usu_id, usuarios.usu_id))
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
