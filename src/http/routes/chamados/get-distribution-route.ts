import { and, eq, sql } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { departamentos } from "../../../db/schema/departamentos.ts"

export const getDistributionRoute: FastifyPluginCallbackZod = (app) => {
	app.get(
		"/chamados/distribution",
		{
			schema: {
				querystring: z.object({
					period: z.enum(["hoje", "semana", "mes"]).default("mes"),
					cidadeId: z.string().optional(),
				}),
			},
		},
		async (request, reply) => {
			try {
				const { period, cidadeId } = request.query

				// Definir filtro de data baseado no período
				let dateFilter = sql`TRUE`
				const now = new Date()

				if (period === "hoje") {
					const today = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate(),
					)
					const todayStr = today.toISOString()
					dateFilter = sql`${chamados.cha_data_abertura} >= ${todayStr}`
				} else if (period === "semana") {
					const weekStart = new Date(now)
					weekStart.setDate(now.getDate() - now.getDay())
					weekStart.setHours(0, 0, 0, 0)
					const weekStartStr = weekStart.toISOString()
					dateFilter = sql`${chamados.cha_data_abertura} >= ${weekStartStr}`
				} else if (period === "mes") {
					const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
					const monthStartStr = monthStart.toISOString()
					dateFilter = sql`${chamados.cha_data_abertura} >= ${monthStartStr}`
				}

				const cityFilter = cidadeId ? eq(departamentos.cid_id, cidadeId) : sql`TRUE`

				// Buscar distribuição por departamento
				const distribution = await db
					.select({
						name: departamentos.dep_nome,
						count: sql<number>`count(${chamados.cha_id})::int`,
					})
					.from(chamados)
					.leftJoin(
						departamentos,
						sql`${chamados.cha_departamento} = ${departamentos.dep_id}`,
					)
					.where(and(dateFilter, cityFilter))
					.groupBy(departamentos.dep_nome)
					.orderBy(sql`count(${chamados.cha_id}) DESC`)

				console.log(`✅ Distribuição (${period}):`, distribution)
				reply.send(distribution)
			} catch (err) {
				console.error("Erro ao buscar distribuição:", err)
				reply
					.status(500)
					.send({ error: "Erro ao buscar distribuição de chamados" })
			}
		},
	)
}
