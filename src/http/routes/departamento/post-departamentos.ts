import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { schema } from "../../../db/schema/index.js";

export const postDepartamentosRoute: FastifyPluginCallbackZod = (app) => {
	app.post(
		"/departamentos",
		{
			schema: {
				body: z.object({
					nome: z.string(),
					descricao: z.string().optional(),
					cidadeId: z.string().uuid(),
					prioridade: z
						.enum(["Baixa", "Média", "Alta", "Urgente"])
						.optional()
						.default("Média"),
					motivos: z.array(z.string()).optional().default([]),
					ativo: z.boolean().optional().default(true),
				}),
			},
		},
		async (request, reply) => {
			const { nome, descricao, cidadeId, prioridade, motivos, ativo } =
				request.body;
			await db.insert(schema.departamentos).values({
				dep_nome: nome,
				dep_descricao: descricao,
				cid_id: cidadeId,
				dep_prioridade: prioridade,
				dep_motivos: motivos,
				dep_ativo: ativo,
			});
			reply.status(201).send({ message: "Departamento criado" });
		},
	);
};
