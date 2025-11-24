import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { usuarios } from "../../../db/schema/usuarios.js";
import { verifyCPF } from "../../../utils/cpfHash.js";

const getUserByCpfRequestSchema = z.object({
	cpf: z.string().min(11).max(11),
});

export const getUserByCpfRoute: FastifyPluginCallbackZod = (app) => {
	app.get(
		"/users/cpf/:cpf",
		{
			schema: {
				params: getUserByCpfRequestSchema,
			},
		},
		async (request, reply) => {
			try {
				const { cpf } = request.params;

				// Buscar TODOS os usuários ativos
				const allUsers = await db
					.select({
						usu_id: usuarios.usu_id,
						usu_nome: usuarios.usu_nome,
						usu_email: usuarios.usu_email,
						usu_cpf: usuarios.usu_cpf, // Hash do CPF
						usu_tipo: usuarios.usu_tipo,
						usu_ativo: usuarios.usu_ativo,
						cid_id: usuarios.cid_id,
						usu_endereco: usuarios.usu_endereco,
					})
					.from(usuarios)
					.where(eq(usuarios.usu_ativo, true));

				// Verificar qual usuário tem o CPF correspondente
				for (const user of allUsers) {
					const match = await verifyCPF(cpf, user.usu_cpf);
					if (match) {
						// Retornar sem o hash do CPF
						return reply.send({
							usu_id: user.usu_id,
							usu_nome: user.usu_nome,
							usu_email: user.usu_email,
							usu_tipo: user.usu_tipo,
							usu_ativo: user.usu_ativo,
							cid_id: user.cid_id,
							usu_endereco: user.usu_endereco,
						});
					}
				}

				return reply.status(404).send({ error: "Usuário não encontrado" });
			} catch (error) {
				console.error("Erro ao buscar usuário por CPF:", error);
				reply.status(500).send({ message: "Erro ao buscar usuário" });
			}
		},
	);
};
