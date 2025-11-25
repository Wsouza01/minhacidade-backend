import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { schema } from "../../../db/schema/index.js";

export const putDepartamentosRoute: FastifyPluginCallbackZod = (app) => {
	app.put(
		"/departamentos/:id",
		{
			schema: {
				params: z.object({
					id: z.string().uuid("ID inválido"),
				}),
				body: z.object({
					nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
					descricao: z.string().optional(),
					cidadeId: z.string().uuid(),
					prioridade: z.enum(["Baixa", "Média", "Alta", "Urgente"]),
					motivos: z.array(z.string()).optional().default([]),
					ativo: z.boolean().optional().default(true),
				}),
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const { nome, descricao, cidadeId, prioridade, motivos, ativo } =
				request.body;

			try {
				const departamentoExiste = await db
					.select({ id: schema.departamentos.dep_id })
					.from(schema.departamentos)
					.where(eq(schema.departamentos.dep_id, id))
					.limit(1);

				if (departamentoExiste.length === 0) {
					return reply.status(404).send({
						message: "Departamento não encontrado",
					});
				}

				await db
					.update(schema.departamentos)
					.set({
						dep_nome: nome,
						dep_descricao: descricao,
						cid_id: cidadeId,
						dep_prioridade: prioridade,
						dep_motivos: motivos ?? [],
						dep_ativo: ativo ?? true,
					})
					.where(eq(schema.departamentos.dep_id, id));

				return reply.send({ message: "Departamento atualizado com sucesso" });
			} catch (error) {
				console.error("Erro ao atualizar departamento:", error);
				return reply
					.status(500)
					.send({ message: "Erro ao atualizar departamento" });
			}
		},
	);
};
