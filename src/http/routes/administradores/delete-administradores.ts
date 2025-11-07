import { eq } from "drizzle-orm"
import type { FastifyPluginCallback } from "fastify"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { administradores } from "../../../db/schema/administradores.ts"

export const deleteAdministradoresRoute: FastifyPluginCallback = (app) => {
	app.delete(
		"/administradores/:id",
		{
			schema: {
				params: z.object({
					id: z.string().uuid(),
				}),
				response: {
					200: z.object({
						message: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params

				// Verificar se o administrador existe
				const admin = await db
					.select()
					.from(administradores)
					.where(eq(administradores.adm_id, id))

				if (admin.length === 0) {
					return reply.status(404).send({
						message: "Administrador não encontrado",
					})
				}

				// Deletar administrador
				await db.delete(administradores).where(eq(administradores.adm_id, id))

				return reply.send({
					message: "Administrador deletado com sucesso",
				})
			} catch (error) {
				console.error("Erro ao deletar administrador:", error)
				return reply.status(500).send({
					message: "Erro ao deletar administrador",
					error: error instanceof Error ? error.message : String(error),
				})
			}
		},
	)
}
