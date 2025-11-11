import { and, count, eq, isNull } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { funcionarios } from "../../../db/schema/funcionarios.ts";

const getFuncionariosByDepartamentoParamsSchema = z.object({
  id: z.string().uuid("ID do departamento deve ser um UUID válido"),
});

export const getFuncionariosByDepartamentoRoute: FastifyPluginCallbackZod = (
  app
) => {
  app.get(
    "/funcionarios/departamento/:id",
    {
      schema: {
        params: getFuncionariosByDepartamentoParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id: departamentoId } = request.params;

        // Subquery para contar chamados atribuídos a cada funcionário (chamados abertos)
        const chamadosCountSubquery = db
          .select({
            funcionarioId: chamados.cha_responsavel,
            count: count(chamados.cha_id).as("chamados_count"),
          })
          .from(chamados)
          .where(isNull(chamados.cha_data_fechamento))
          .groupBy(chamados.cha_responsavel)
          .as("chamados_count_sq");

        // Busca todos os servidores do departamento e junta com a contagem de chamados
        const results = await db
          .select({
            fun_id: funcionarios.fun_id,
            fun_nome: funcionarios.fun_nome,
            chamados_atribuidos: chamadosCountSubquery.count,
          })
          .from(funcionarios)
          .where(
            and(
              eq(funcionarios.dep_id, departamentoId),
              eq(funcionarios.fun_tipo, "servidor")
            )
          )
          .leftJoin(
            chamadosCountSubquery,
            eq(funcionarios.fun_id, chamadosCountSubquery.funcionarioId)
          );

        const finalResults = results.map((r) => ({
          ...r,
          chamados_atribuidos: r.chamados_atribuidos ?? 0,
        }));

        reply.send(finalResults);
      } catch (error) {
        console.error("Erro ao buscar funcionários por departamento:", error);
        reply.code(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message:
            error instanceof Error
              ? error.message
              : "Erro ao buscar funcionários do departamento",
        });
      }
    }
  );
};
