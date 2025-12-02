import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { categorias } from "../../../db/schema/categorias.js";

export const putCategoriaRoute: FastifyPluginAsyncZod = async (app) => {
	app.put(
		"/categorias/:id",
		{
			schema: {
				params: z.object({
					id: z.string().uuid(),
				}),
				body: z.object({
					nome: z.string().min(1),
					descricao: z.string().optional(),
				}),
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { nome, descricao } = request.body;

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

				// Atualizar categoria
				await db
					.update(categorias)
					.set({
						cat_nome: nome,
						cat_descricao: descricao,
					})
					.where(eq(categorias.cat_id, id));

				reply.status(200).send({
					message: "Categoria atualizada com sucesso",
				});
			} catch (error) {
				console.error("[PUT /categorias/:id] Erro:", error);
				reply.status(500).send({
					error: "Erro ao atualizar categoria",
				});
			}
		},
	);
};
