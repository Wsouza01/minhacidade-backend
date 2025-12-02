import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { categorias } from "../../../db/schema/categorias.js";
import { chamados } from "../../../db/schema/chamados.js";

export const deleteCategoriaRoute: FastifyPluginAsyncZod = async (app) => {
	app.delete(
		"/categorias/:id",
		{
			schema: {
				params: z.object({
					id: z.string().uuid(),
				}),
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			try {
				// Verificar se categoria existe
				const [categoria] = await db
					.select()
					.from(categorias)
					.where(eq(categorias.cat_id, id));

				if (!categoria) {
					return reply.status(404).send({
						error: "Categoria não encontrada",
					});
				}

				// Verificar se há chamados usando essa categoria
				const [chamadoCount] = await db
					.select({ count: db.$count(chamados.cha_id) })
					.from(chamados)
					.where(eq(chamados.cat_id, id));

				if (chamadoCount && chamadoCount.count > 0) {
					return reply.status(400).send({
						error: `Não é possível excluir. Existem ${chamadoCount.count} chamado(s) usando esta categoria.`,
					});
				}

				// Excluir categoria
				await db.delete(categorias).where(eq(categorias.cat_id, id));

				reply.status(200).send({
					message: "Categoria excluída com sucesso",
				});
			} catch (error) {
				console.error("[DELETE /categorias/:id] Erro:", error);
				reply.status(500).send({
					error: "Erro ao excluir categoria",
				});
			}
		},
	);
};
