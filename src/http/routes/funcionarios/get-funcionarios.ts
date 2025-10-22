import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { db } from "../../../db/connection.ts"
import { schema } from "../../../db/schema/index.ts"
import { eq } from "drizzle-orm"

export const getFuncionariosRoute: FastifyPluginCallbackZod = (app) => {
  app.get("/funcionarios", async (request, reply) => {
    try {
      // Busca todos os funcionários com joins para departamento e cidade
      const results = await db
        .select({
          fun_id: schema.funcionarios.fun_id,
          fun_nome: schema.funcionarios.fun_nome,
          fun_email: schema.funcionarios.fun_email,
          fun_cpf: schema.funcionarios.fun_cpf,
          fun_data_nascimento: schema.funcionarios.fun_data_nascimento,
          fun_matricula: schema.funcionarios.fun_matricula,
          fun_tipo: schema.funcionarios.fun_tipo,
          fun_ativo: schema.funcionarios.fun_ativo,
          departamento: {
            dep_id: schema.departamentos.dep_id,
            dep_nome: schema.departamentos.dep_nome,
          },
          cidade: {
            cid_id: schema.cidades.cid_id,
            cid_nome: schema.cidades.cid_nome,
            cid_estado: schema.cidades.cid_estado,
          },
        })
        .from(schema.funcionarios)
        .leftJoin(
          schema.departamentos,
          eq(schema.funcionarios.dep_id, schema.departamentos.dep_id),
        )
        .leftJoin(
          schema.cidades,
          eq(schema.funcionarios.cid_id, schema.cidades.cid_id),
        )

      reply.send(results)
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error)
      reply.code(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Erro ao buscar funcionários",
      })
    }
  })
}
