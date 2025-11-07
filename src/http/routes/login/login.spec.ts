import bcrypt from "bcrypt"
import Fastify from "fastify"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "../../../db/connection.ts"
import { usuarios } from "../../../db/schema/usuarios.ts"
import { loginRoute } from "./login.ts"

// =========================================
// 🔧 MOCKS DO BANCO DE DADOS
// =========================================
vi.mock("../../../db/connection", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([
				{
					usu_id: "111e4567-e89b-12d3-a456-426614174000",
					usu_senha: "hashedPassword",
					usu_tipo: "municipe",
					usu_nome: "Maria Souza",
					usu_ativo: true,
					usu_tentativas_login: 0,
					usu_bloqueado_ate: null,
				},
			]),
		})),
		update: vi.fn(() => ({
			set: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue(undefined),
		})),
	},
}))

// =========================================
// 🔧 MOCKS DO BCRYPT
// =========================================
vi.mock("bcrypt", () => ({
	compare: vi.fn().mockResolvedValue(true),
}))

// =========================================
// 🔧 MOCKS DO DRIZZLE ORM
// =========================================
vi.mock("drizzle-orm", async () => {
	const actual =
		await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm")
	return {
		...actual,
		eq: vi.fn((a, b) => ({ field: a, value: b })),
		or: vi.fn((...conds) => conds),
	}
})

describe("POST /login (Supertest)", () => {
	let app: ReturnType<typeof Fastify>

	beforeEach(async () => {
		vi.clearAllMocks()
		app = Fastify()
		app.register(loginRoute)
		await app.ready()
	})

	// =========================================
	// ✅ Cenário 1 — Login bem-sucedido
	// =========================================
	it("deve fazer login com sucesso", async () => {
		const response = await request(app.server).post("/login").send({
			login: "maria",
			senha: "senhaSegura123",
			tipo: "municipe",
		})

		expect(response.status).toBe(200)
		expect(response.body.success).toBe(true)
		expect(response.body.data.nome).toBe("Maria Souza")
		expect(bcrypt.compare).toHaveBeenCalledWith(
			"senhaSegura123",
			"hashedPassword",
		)
		expect(db.update).toHaveBeenCalledWith(usuarios)
	})

	// =========================================
	// ❌ Cenário 2 — Usuário inexistente
	// =========================================
	it("deve retornar 401 se o usuário não existir", async () => {
		vi.mocked(db.select).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([]),
		} as any)

		const response = await request(app.server).post("/login").send({
			login: "inexistente",
			senha: "senhaErrada",
			tipo: "municipe",
		})

		expect(response.status).toBe(401)
		expect(response.body.code).toBe("INVALID_CREDENTIALS")
	})

	// =========================================
	// ❌ Cenário 3 — Conta bloqueada
	// =========================================
	it("deve retornar 403 se a conta estiver bloqueada", async () => {
		const futureDate = new Date(Date.now() + 30 * 60 * 1000)
		vi.mocked(db.select).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([
				{
					usu_id: "111",
					usu_senha: "hash",
					usu_tipo: "municipe",
					usu_nome: "Maria",
					usu_ativo: true,
					usu_tentativas_login: 3,
					usu_bloqueado_ate: futureDate,
				},
			]),
		} as any)

		const response = await request(app.server).post("/login").send({
			login: "maria",
			senha: "senhaSegura",
			tipo: "municipe",
		})

		expect(response.status).toBe(403)
		expect(response.body.code).toBe("ACCOUNT_TEMPORARILY_LOCKED")
	})

	// =========================================
	// ❌ Cenário 4 — Conta desativada
	// =========================================
	it("deve retornar 403 se a conta estiver desativada", async () => {
		vi.mocked(db.select).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([
				{
					usu_id: "111",
					usu_senha: "hash",
					usu_tipo: "municipe",
					usu_nome: "Maria",
					usu_ativo: false,
					usu_tentativas_login: 0,
					usu_bloqueado_ate: null,
				},
			]),
		} as any)

		const response = await request(app.server).post("/login").send({
			login: "maria",
			senha: "senhaSegura",
			tipo: "municipe",
		})

		expect(response.status).toBe(403)
		expect(response.body.code).toBe("ACCOUNT_DISABLED")
	})

	// =========================================
	// ❌ Cenário 5 — Tipo de perfil incorreto
	// =========================================
	it("deve retornar 403 se o tipo de perfil for inválido", async () => {
		vi.mocked(db.select).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([
				{
					usu_id: "111",
					usu_senha: "hash",
					usu_tipo: "municipe",
					usu_nome: "Maria",
					usu_ativo: true,
					usu_tentativas_login: 0,
					usu_bloqueado_ate: null,
				},
			]),
		} as any)

		const response = await request(app.server).post("/login").send({
			login: "maria",
			senha: "senhaSegura",
			tipo: "servidor",
		})

		expect(response.status).toBe(403)
		expect(response.body.code).toBe("UNAUTHORIZED_PROFILE")
	})

	// =========================================
	// ❌ Cenário 6 — Senha incorreta
	// =========================================
	it("deve retornar 401 se a senha estiver incorreta", async () => {
		vi.mocked(bcrypt.compare).mockResolvedValueOnce(false)

		vi.mocked(db.select).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([
				{
					usu_id: "111",
					usu_senha: "hash",
					usu_tipo: "municipe",
					usu_nome: "Maria",
					usu_ativo: true,
					usu_tentativas_login: 4,
					usu_bloqueado_ate: null,
				},
			]),
		} as any)

		const response = await request(app.server).post("/login").send({
			login: "maria",
			senha: "senhaErrada",
			tipo: "municipe",
		})

		expect(response.status).toBe(401)
		expect(response.body.code).toBe("INVALID_CREDENTIALS")
		expect(db.update).toHaveBeenCalled()
	})

	// =========================================
	// ❌ Cenário 7 — Erro inesperado
	// =========================================
	it("deve retornar 500 em erro inesperado", async () => {
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw new Error("Falha inesperada")
		})

		const response = await request(app.server).post("/login").send({
			login: "maria",
			senha: "senhaSegura",
			tipo: "municipe",
		})

		expect(response.status).toBe(500)
		expect(response.body.code).toBe("INTERNAL_SERVER_ERROR")
	})
})
