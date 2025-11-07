import { eq } from "drizzle-orm"
import type { FastifyPluginCallback } from "fastify"
import { db } from "../../../db/connection.ts"
import { usuarios } from "../../../db/schema/usuarios.ts"

export const checkCpfRoute: FastifyPluginCallback = (app) => {
	app.post("/users/check-cpf", async (request, reply) => {
		try {
			const { cpf } = request.body as { cpf: string }
			// Verifica se já existe usuário ativo com esse CPF
			const [existing] = await db
				.select({ count: db.raw<number>`count(*)` })
				.from(usuarios)
				.where(eq(usuarios.usu_cpf, cpf))
				.and(eq(usuarios.usu_ativo, true))

			return reply.send({ available: existing.count === 0 })
		} catch (error) {
			console.error("Erro ao checar CPF:", error)
			return reply.status(500).send({ available: false })
		}
	})
}
