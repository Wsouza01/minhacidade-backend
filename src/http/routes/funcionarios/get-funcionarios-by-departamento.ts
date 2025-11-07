import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { schema } from "../../../db/schema/index.ts"

const getFuncionariosByDepartamentoParamsSchema = z.object({
	id: z.string().uuid("ID do departamento deve ser um UUID válido"),
})

export const getFuncionariosByDepartamentoRoute: FastifyPluginCallbackZod = (
	app,
) => {
	app.get<{
		Params: z.infer<typeof getFuncionariosByDepartamentoParamsSchema>
	}>(
		"/funcionarios/departamento/:id",
		{
			schema: {
				params: getFuncionariosByDepartamentoParamsSchema,
			},
		},
		async (request, reply) => {
			try {
				const { id: departamentoId } = request.params

				// Busca todos os servidores do departamento
				const results = await db
					.select({
						fun_id: schema.funcionarios.fun_id,
						fun_nome: schema.funcionarios.fun_nome,
						fun_email: schema.funcionarios.fun_email,
						fun_cpf: schema.funcionarios.fun_cpf,
						fun_tipo: schema.funcionarios.fun_tipo,
						fun_ativo: schema.funcionarios.fun_ativo,
						fun_matricula: schema.funcionarios.fun_matricula,
						departamento: {
							dep_id: schema.departamentos.dep_id,
							dep_nome: schema.departamentos.dep_nome,
						},
					})
					.from(schema.funcionarios)
					.where(eq(schema.funcionarios.dep_id, departamentoId))
					.leftJoin(
						schema.departamentos,
						eq(schema.funcionarios.dep_id, schema.departamentos.dep_id),
					)

				reply.send(results)
			} catch (error) {
				console.error("Erro ao buscar funcionários por departamento:", error)
				reply.code(500).send({
					statusCode: 500,
					error: "Internal Server Error",
					message:
						error instanceof Error
							? error.message
							: "Erro ao buscar funcionários do departamento",
				})
			}
		},
	)
}
