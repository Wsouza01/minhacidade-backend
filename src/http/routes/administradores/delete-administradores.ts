import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { administradores } from "../../../db/schema/administradores.ts"

export const deleteAdministradoresRoute: FastifyPluginCallbackZod = (app) => {
	app.delete(
		"/administradores/:id",
		{
			schema: {
				params: z.object({
					id: z.string().uuid(),
				}),
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
			} catch (error: any) {
				console.error("Erro ao deletar administrador:", error)

				// Verificar se é erro de foreign key constraint
				if (
					error?.cause?.code === "23503" ||
					error?.message?.includes("foreign key constraint") ||
					error?.message?.includes("violates foreign key")
				) {
					return reply.status(400).send({
						message:
							"Não é possível remover este administrador porque ele possui registros vinculados. Remova primeiro os registros relacionados.",
						code: "ADMIN_HAS_REFERENCES",
					})
				}

				return reply.status(500).send({
					message: "Erro ao deletar administrador",
					error: error instanceof Error ? error.message : String(error),
				})
			}
		},
	)
}
