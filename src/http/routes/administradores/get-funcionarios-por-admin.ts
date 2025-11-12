import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { schema } from "../../../db/schema/index.ts";

export const getFuncionariosPorAdminRoute: FastifyPluginCallbackZod = (app) => {
	app.get(
		"/admin/funcionarios",
		{
			schema: {
				description:
					"Recupera a lista de funcionários pertencentes à cidade do administrador.",
				tags: ["administradores"],
				querystring: z.object({
					adminId: z.string().uuid("ID do administrador inválido"),
				}),
			},
		},
		async (request, reply) => {
			const { adminId } = request.query;

			try {
				const [admin] = await db
					.select({ cidadeId: schema.administradores.cid_id })
					.from(schema.administradores)
					.where(eq(schema.administradores.adm_id, adminId));

				if (!admin) {
					return reply
						.status(403)
						.send({ message: "Administrador não encontrado." });
				}

				// Buscar funcionários da mesma cidade do administrador
				let query = db
					.select({
						fun_id: schema.funcionarios.fun_id,
						fun_nome: schema.funcionarios.fun_nome,
						fun_email: schema.funcionarios.fun_email,
						fun_cpf: schema.funcionarios.fun_cpf,
						fun_matricula: schema.funcionarios.fun_matricula,
						fun_tipo: schema.funcionarios.fun_tipo,
						fun_ativo: schema.funcionarios.fun_ativo,
						dep_id: schema.funcionarios.dep_id,
					})
					.from(schema.funcionarios);

				// Filtrar por cidade se o admin tiver uma cidade associada
				if (admin.cidadeId) {
					query = query.where(eq(schema.funcionarios.cid_id, admin.cidadeId));
				}

				const funcionarios = await query;

				return reply.status(200).send({
					cidadeId: admin.cidadeId,
					funcionarios,
				});
			} catch (error) {
				console.error("Erro ao buscar funcionários para o admin:", error);
				return reply
					.status(500)
					.send({ message: "Erro interno ao buscar funcionários." });
			}
		},
	);
};
