import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { schema } from "../../../db/schema/index.ts";
import { getCPFDuplicateMessage } from "../../../utils/check-duplicate-cpf.ts";

export const putFuncionariosRoute: FastifyPluginCallbackZod = (app) => {
	app.put(
		"/funcionarios/:id",
		{
			schema: {
				params: z.object({
					id: z.string().uuid("ID inválido"),
				}),
				body: z.object({
					nome: z.string().optional(),
					email: z.string().email().optional(),
					cpf: z.string().min(11).optional(),
					dataNascimento: z.string().optional(),
					matricula: z.string().optional(),
					tipo: z.enum(["atendente", "servidor"]).optional(),
					senha: z.string().min(6).optional(),
					departamentoId: z.string().uuid().nullable().optional(),
					cidadeId: z.string().uuid().nullable().optional(),
				}),
			},
		},
		async (request, reply) => {
			const { id } = request.params;
			const {
				nome,
				email,
				cpf,
				dataNascimento,
				matricula,
				tipo,
				senha,
				departamentoId,
				cidadeId,
			} = request.body;

			// Verifica se funcionário existe
			const funcionario = await db
				.select()
				.from(schema.funcionarios)
				.where(eq(schema.funcionarios.fun_id, id))
				.limit(1);

			if (funcionario.length === 0) {
				return reply.status(404).send({
					message: "Funcionário não encontrado",
				});
			}

			// Validar CPF duplicado se estiver sendo alterado
			if (cpf !== undefined) {
				const cpfSemFormatacao = cpf.replace(/\D/g, "");
				const cpfDuplicadoMsg = await getCPFDuplicateMessage(
					cpfSemFormatacao,
					id,
				);
				if (cpfDuplicadoMsg) {
					return reply.status(400).send({
						message: cpfDuplicadoMsg,
					});
				}
			}

			// Prepara dados para atualizar
			const updateData: {
				fun_nome?: string;
				fun_email?: string;
				fun_cpf?: string;
				fun_data_nascimento?: Date;
				fun_matricula?: string;
				fun_tipo?: "atendente" | "servidor";
				dep_id?: string | null;
				cid_id?: string;
				fun_senha?: string;
			} = {};

			if (nome !== undefined) updateData.fun_nome = nome;
			if (email !== undefined) updateData.fun_email = email;
			if (cpf !== undefined) updateData.fun_cpf = cpf.replace(/\D/g, "");
			if (dataNascimento !== undefined)
				updateData.fun_data_nascimento = new Date(dataNascimento);
			if (matricula !== undefined) updateData.fun_matricula = matricula;
			if (tipo !== undefined) updateData.fun_tipo = tipo;
			if (departamentoId !== undefined)
				updateData.dep_id =
					departamentoId && departamentoId.trim() !== ""
						? departamentoId
						: null;
			if (cidadeId !== undefined) updateData.cid_id = cidadeId;

			// Se houver senha, faz hash
			if (senha !== undefined) {
				const senhaHash = await hash(senha, 10);
				updateData.fun_senha = senhaHash;
			}

			// Atualiza funcionário
			await db
				.update(schema.funcionarios)
				.set(updateData)
				.where(eq(schema.funcionarios.fun_id, id));

			return reply.status(200).send({
				message: "Funcionário atualizado com sucesso",
			});
		},
	);
};
