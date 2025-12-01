import { eq } from "drizzle-orm";
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
					cidadeId: z.string().uuid().optional(),
					prioridade: z
						.enum(["Baixa", "Média", "Alta", "Urgente"])
						.optional()
						.default("Média"),
					motivos: z.array(z.string()).optional().default([]),
					adminId: z.string().uuid().optional(),
				}),
			},
		},
		async (request, reply) => {
			const { nome, descricao, cidadeId, prioridade, motivos, adminId } =
				request.body;

			let resolvedCidadeId = cidadeId;

			if (adminId) {
				const [admin] = await db
					.select({
						id: schema.administradores.adm_id,
						cidadeId: schema.administradores.cid_id,
					})
					.from(schema.administradores)
					.where(eq(schema.administradores.adm_id, adminId));

				if (!admin) {
					return reply
						.status(400)
						.send({ message: "Administrador não encontrado" });
				}

				if (admin.cidadeId) {
					resolvedCidadeId = admin.cidadeId;
				} else if (!resolvedCidadeId) {
					return reply.status(400).send({
						message: "Cidade é obrigatória para administradores globais",
					});
				}
			}

			if (!resolvedCidadeId) {
				return reply
					.status(400)
					.send({ message: "Cidade é obrigatória para criar o departamento" });
			}

			await db.insert(schema.departamentos).values({
				dep_nome: nome,
				dep_descricao: descricao,
				cid_id: resolvedCidadeId,
				dep_prioridade: prioridade ?? "Média",
				dep_motivos: motivos ?? [],
			});
			reply.status(201).send({ message: "Departamento criado" });
		},
	);
};
