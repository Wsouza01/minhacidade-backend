import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { administradores } from "../../../db/schema/administradores.ts"
import { schema } from "../../../db/schema/index.ts"

// Função auxiliar para validar CPF
function validarCPF(cpf: string): boolean {
	const cpfLimpo = cpf.replace(/\D/g, "")

	if (cpfLimpo.length !== 11) return false
	if (/^(\d)\1{10}$/.test(cpfLimpo)) return false

	let soma = 0
	for (let i = 0; i < 9; i++) {
		soma += parseInt(cpfLimpo.charAt(i), 10) * (10 - i)
	}
	let resto = 11 - (soma % 11)
	const digitoVerificador1 = resto === 10 || resto === 11 ? 0 : resto

	if (digitoVerificador1 !== parseInt(cpfLimpo.charAt(9), 10)) {
		return false
	}

	soma = 0
	for (let i = 0; i < 10; i++) {
		soma += parseInt(cpfLimpo.charAt(i), 10) * (11 - i)
	}
	resto = 11 - (soma % 11)
	const digitoVerificador2 = resto === 10 || resto === 11 ? 0 : resto

	if (digitoVerificador2 !== parseInt(cpfLimpo.charAt(10), 10)) {
		return false
	}

	return true
}

// Função auxiliar para validar idade mínima
function validarIdadeMinima(
	dataNascimento: string,
	idadeMinima: number,
): boolean {
	const data = new Date(dataNascimento)
	const hoje = new Date()
	let idade = hoje.getFullYear() - data.getFullYear()
	const mes = hoje.getMonth() - data.getMonth()

	if (mes < 0 || (mes === 0 && hoje.getDate() < data.getDate())) {
		idade--
	}

	return idade >= idadeMinima
}

export const postAdministradoresRoute: FastifyPluginCallbackZod = (app) => {
	app.post(
		"/administradores",
		{
			schema: {
				body: z.object({
					nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
					email: z.string().email("Email inválido"),
					cpf: z.string().min(11, "CPF inválido"),
					dataNascimento: z
						.string()
						.refine((date) => !Number.isNaN(Date.parse(date)), "Data inválida"),
					login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
					senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
					cidadeId: z
						.string()
						.uuid("ID da cidade inválido")
						.nullable()
						.optional(),
					ativo: z.boolean().optional().default(true),
				}),
			},
		},
		async (request, reply) => {
			const {
				nome,
				email,
				cpf,
				dataNascimento,
				login,
				senha,
				cidadeId,
				ativo,
			} = request.body

			try {
				// ✅ Validação 1: CPF válido
				if (!validarCPF(cpf)) {
					return reply.status(400).send({
						message: "CPF inválido",
					})
				}

				// ✅ Validação 2: CPF já existe
				const cpfSemFormatacao = cpf.replace(/\D/g, "")
				const cpfExistente = await db
					.select()
					.from(administradores)
					.where(eq(administradores.adm_cpf, cpfSemFormatacao))
					.limit(1)

				if (cpfExistente.length > 0) {
					return reply.status(400).send({
						message: "CPF já cadastrado",
					})
				}

				// ✅ Validação 3: Email já existe
				const emailExistente = await db
					.select()
					.from(administradores)
					.where(eq(administradores.adm_email, email))
					.limit(1)

				if (emailExistente.length > 0) {
					return reply.status(400).send({
						message: "Email já cadastrado",
					})
				}

				// ✅ Validação 4: Login já existe
				const loginExistente = await db
					.select()
					.from(administradores)
					.where(eq(administradores.adm_login, login))
					.limit(1)

				if (loginExistente.length > 0) {
					return reply.status(400).send({
						message: "Login já cadastrado",
					})
				}

				// ✅ Validação 5: Idade mínima 18 anos
				if (!validarIdadeMinima(dataNascimento, 18)) {
					return reply.status(400).send({
						message: "Administrador deve ter pelo menos 18 anos",
					})
				}

				// ✅ Validação 6: Cidade existe (se fornecida)
				if (cidadeId) {
					const cidadeExistente = await db
						.select()
						.from(schema.cidades)
						.where(eq(schema.cidades.cid_id, cidadeId))
						.limit(1)

					if (cidadeExistente.length === 0) {
						return reply.status(400).send({
							message: "Cidade não encontrada",
						})
					}
				}

				// ✅ Hash de senha
				const senhaHash = await bcrypt.hash(senha, 10)

				// ✅ Insere administrador no banco
				await db.insert(administradores).values({
					adm_nome: nome,
					adm_email: email,
					adm_cpf: cpfSemFormatacao,
					adm_data_nascimento: new Date(dataNascimento),
					adm_login: login,
					adm_senha: senhaHash,
					cid_id: cidadeId || null,
					adm_ativo: ativo ?? true,
				})

				return reply.status(201).send({
					message: "Administrador criado com sucesso",
					data: {
						nome,
						email,
						login,
						cidadeId: cidadeId || null,
						tipo: cidadeId ? "admin" : "admin-global",
					},
				})
			} catch (error) {
				console.error("Erro ao criar administrador:", error)

				// Verificar erro de unicidade
				if (error instanceof Error && error.message.includes("unique")) {
					return reply.status(400).send({
						message:
							"Email, CPF ou login já cadastrado. Verifique os dados e tente novamente.",
						code: "DUPLICATE_ENTRY",
					})
				}

				return reply.status(500).send({
					message: "Erro ao criar administrador",
					error: error instanceof Error ? error.message : String(error),
				})
			}
		},
	)
}
