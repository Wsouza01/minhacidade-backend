import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { schema } from "../../../db/schema/index.ts"

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
			const { id } = request.params

			// Verifica se funcionário existe
			const funcionario = await db
				.select()
				.from(schema.funcionarios)
				.where(eq(schema.funcionarios.fun_id, id))
				.limit(1)

			if (funcionario.length === 0) {
				return reply.status(404).send({
					message: "Funcionário não encontrado",
				})
			}

			// Deleta o funcionário
			await db
				.delete(schema.funcionarios)
				.where(eq(schema.funcionarios.fun_id, id))

			return reply.status(200).send({
				message: "Funcionário deletado com sucesso",
			})
		},
	)
}
