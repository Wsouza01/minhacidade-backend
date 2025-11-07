import { hash } from "bcryptjs"
import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
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

export const postFuncionariosRoute: FastifyPluginCallbackZod = (app) => {
	app.post(
		"/funcionarios",
		{
			schema: {
				body: z.object({
					nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
					email: z.string().email("Email inválido"),
					cpf: z.string().min(11, "CPF inválido"),
					dataNascimento: z
						.string()
						.refine((date) => !Number.isNaN(Date.parse(date)), "Data inválida"),
					matricula: z
						.string()
						.min(3, "Matrícula deve ter pelo menos 3 caracteres"),
					tipo: z.enum(["atendente", "servidor"]),
					senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
					departamentoId: z
						.string()
						.uuid("ID do departamento inválido")
						.optional()
						.nullable(),
					cidadeId: z.string().uuid("ID da cidade inválido"),
				}),
			},
		},
		async (request, reply) => {
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
			} = request.body

			// ✅ Validação 1: CPF válido
			if (!validarCPF(cpf)) {
				return reply.status(400).send({
					message: "CPF inválido",
				})
			}

			// ✅ Limpar CPF (remover pontos e traços)
			const cpfLimpo = cpf.replace(/\D/g, "")

			// ✅ Validação 2: CPF já existe
			const cpfExistente = await db
				.select()
				.from(schema.funcionarios)
				.where(eq(schema.funcionarios.fun_cpf, cpfLimpo))
				.limit(1)

			if (cpfExistente.length > 0) {
				return reply.status(400).send({
					message: "CPF já cadastrado",
				})
			}

			// ✅ Validação 3: Email já existe
			const emailExistente = await db
				.select()
				.from(schema.funcionarios)
				.where(eq(schema.funcionarios.fun_email, email))
				.limit(1)

			if (emailExistente.length > 0) {
				return reply.status(400).send({
					message: "Email já cadastrado",
				})
			}

			// ✅ Validação 4: Idade mínima 18 anos
			if (!validarIdadeMinima(dataNascimento, 18)) {
				return reply.status(400).send({
					message: "Funcionário deve ter pelo menos 18 anos",
				})
			}

			// ✅ Validação 5: Cidade existe
			const cidades = await db
				.select()
				.from(schema.cidades)
				.where(eq(schema.cidades.cid_id, cidadeId))
				.limit(1)

			if (cidades.length === 0) {
				return reply.status(400).send({
					message: "Cidade não encontrada",
				})
			}

			// ✅ Validação 6: Departamento existe e pertence à cidade
			if (departamentoId) {
				const departamento = await db
					.select()
					.from(schema.departamentos)
					.where(eq(schema.departamentos.dep_id, departamentoId))
					.limit(1)

				if (departamento.length === 0 || departamento[0].cid_id !== cidadeId) {
					return reply.status(400).send({
						message: "Departamento não encontrado ou não pertence à cidade",
					})
				}
			}

			// ✅ Hash de senha
			const senhaHash = await hash(senha, 10)

			// ✅ Gera um login único a partir do email
			const login = email.split("@")[0]

			// ✅ Insere funcionário no banco
			await db.insert(schema.funcionarios).values({
				fun_nome: nome,
				fun_email: email,
				fun_cpf: cpfLimpo,
				fun_data_nascimento: new Date(dataNascimento),
				fun_login: login,
				fun_senha: senhaHash,
				fun_matricula: matricula,
				fun_tipo: tipo,
				dep_id: departamentoId && departamentoId.trim() !== '' ? departamentoId : null,
				cid_id: cidadeId,
				fun_requer_troca_senha: true, // 🆕 Obriga trocar senha no primeiro acesso
			})

			return reply.status(201).send({
				message: "Funcionário criado com sucesso",
			})
		},
	)
}
