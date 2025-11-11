import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { schema } from "../../../db/schema/index.ts";

export const deleteFuncionariosRoute: FastifyPluginCallbackZod = (app) => {
  app.delete(
    "/funcionarios/:id",
    {
      schema: {
        params: z.object({
          id: z.string().uuid("ID inválido"),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        // Verifica se funcionário existe
        const funcionario = await db
          .select()
          .from(schema.funcionarios)
          .where(eq(schema.funcionarios.fun_id, id))
          .limit(1);

        if (funcionario.length === 0) {
          return reply.status(404).send({
            message: "Funcionário não encontrado",
          });
        }

        // Deleta o funcionário
        await db
          .delete(schema.funcionarios)
          .where(eq(schema.funcionarios.fun_id, id));

        return reply.status(200).send({
          message: "Funcionário deletado com sucesso",
        });
      } catch (error: any) {
        console.error("Erro ao deletar funcionário:", error);

        // Verificar se é erro de foreign key constraint
        if (
          error?.cause?.code === "23503" ||
          error?.message?.includes("foreign key constraint") ||
          error?.message?.includes("violates foreign key")
        ) {
          return reply.status(400).send({
            message:
              "Não é possível remover este funcionário porque ele possui registros vinculados (chamados atribuídos, etc). Remova primeiro os registros relacionados.",
            code: "EMPLOYEE_HAS_REFERENCES",
          });
        }

        return reply.status(500).send({
          message: "Erro ao deletar funcionário",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
};
