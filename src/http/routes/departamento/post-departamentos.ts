import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { schema } from "../../../db/schema/index.ts"

export const postDepartamentosRoute: FastifyPluginCallbackZod = (app) => {
	app.post(
		"/departamentos",
		{
			schema: {
				body: z.object({
					nome: z.string(),
					descricao: z.string().optional(),
				}),
			},
		},
		async (request, reply) => {
			const { nome, descricao } = request.body
			await db.insert(schema.departamentos).values({
				dep_nome: nome,
				dep_descricao: descricao,
			})
			reply.status(201).send({ message: "Departamento criado" })
		},
	)
}
