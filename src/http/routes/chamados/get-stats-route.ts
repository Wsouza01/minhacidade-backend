import { and, count, eq, inArray, isNotNull, isNull } from "drizzle-orm"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { departamentos } from "../../../db/schema/departamentos.ts"

export const getStatsRoute: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/chamados/stats",
		{
			schema: {
				querystring: z.object({
					cidadeId: z.string().uuid().optional(),
					servidorId: z.string().uuid().optional(),
				}),
			},
		},
		async (request, reply) => {
			const { cidadeId, servidorId } = request.query

			try {
				const baseQuery = db.select({ total: count() }).from(chamados)
				const statsQuery = db
					.select({
						total: count(chamados.cha_id),
						resolvidos: count(
							and(
								isNotNull(chamados.cha_data_fechamento),
								servidorId ? eq(chamados.cha_responsavel, servidorId) : undefined,
							),
						),
						pendentes: count(
							and(
								isNull(chamados.cha_data_fechamento),
								isNull(chamados.cha_responsavel),
							),
						),
						emAndamento: count(
							and(
								isNull(chamados.cha_data_fechamento),
								isNotNull(chamados.cha_responsavel),
								servidorId ? eq(chamados.cha_responsavel, servidorId) : undefined,
							),
						),
						prioridadeAlta: count(
							and(
								eq(chamados.cha_prioridade, "Alta"),
								isNull(chamados.cha_data_fechamento),
							),
						),
					})
					.from(chamados)

				if (cidadeId) {
					const subquery = db
						.select({ id: departamentos.dep_id })
						.from(departamentos)
						.where(eq(departamentos.cid_id, cidadeId))

					statsQuery.where(inArray(chamados.cha_departamento, subquery))
				}

				if (servidorId) {
					statsQuery.where(eq(chamados.cha_responsavel, servidorId))
				}

				const [stats] = await statsQuery

				return reply.send(stats)
			} catch (err) {
				console.error("Erro ao buscar estatísticas:", err)
				return reply.status(500).send({
					error: "Internal Server Error",
					message: "Erro ao buscar estatísticas de chamados.",
				})
			}
		},
	)
}
