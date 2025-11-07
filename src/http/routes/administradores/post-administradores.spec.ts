import bcrypt from "bcryptjs"
import Fastify from "fastify"
import request from "supertest"
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest"
import { db } from "../../../db/connection.ts"
import { administradores } from "../../../db/schema/administradores.ts"
import { postAdministradoresRoute } from "./post-administradores.ts"

// 🧩 Mock do banco
vi.mock("../../../db/connection", () => ({
	db: {
		insert: vi.fn(() => ({
			values: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "c6d5a3d6-9c6a-4a40-b8a7-8153f0e9f7a1",
					nome: "João Silva",
					email: "joao@example.com",
					cpf: "123.456.789-10",
					login: "joaosilva",
					ativo: true,
					cidadeId: null,
				},
			]),
		})),
	},
}))

// 🧩 Mock do bcrypt
vi.mock("bcryptjs", () => ({
	default: {
		hash: vi.fn().mockResolvedValue("hashedPassword123"),
	},
}))

describe("POST /administradores (Supertest)", () => {
	const app = Fastify()
	app.register(postAdministradoresRoute)

	beforeAll(async () => {
		await app.ready()
	})

	afterAll(async () => {
		await app.close()
	})

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("deve criar um novo administrador com sucesso", async () => {
		const response = await request(app.server)
			.post("/administradores")
			.send({
				nome: "João Silva",
				email: "joao@example.com",
				cpf: "123.456.789-10",
				dataNascimento: "1990-01-01",
				login: "joaosilva",
				senha: "senhaSegura",
				cidadeId: null,
			})
			.expect(201)

		expect(response.body).toMatchObject({
			nome: "João Silva",
			email: "joao@example.com",
			cpf: "123.456.789-10",
			login: "joaosilva",
			ativo: true,
			cidadeId: null,
		})

		expect(bcrypt.hash).toHaveBeenCalledWith("senhaSegura", 10)
		expect(db.insert).toHaveBeenCalledWith(administradores)
	})

	it("deve retornar erro 400 se houver duplicidade", async () => {
		vi.mocked(db.insert).mockReturnValueOnce({
			values: vi.fn().mockReturnThis(),
			returning: vi
				.fn()
				.mockRejectedValueOnce(
					new Error("duplicate key value violates unique constraint"),
				),
		} as any)

		const response = await request(app.server)
			.post("/administradores")
			.send({
				nome: "João Silva",
				email: "joao@example.com",
				cpf: "123.456.789-10",
				dataNascimento: "1990-01-01",
				login: "joaosilva",
				senha: "senhaSegura",
				cidadeId: null,
			})
			.expect(400)

		expect(response.body).toMatchObject({
			code: "DUPLICATE_ENTRY",
		})
	})

	it("deve retornar erro 500 em erro inesperado", async () => {
		vi.mocked(db.insert).mockReturnValueOnce({
			values: vi.fn().mockReturnThis(),
			returning: vi.fn().mockRejectedValueOnce(new Error("Erro genérico")),
		} as any)

		const response = await request(app.server)
			.post("/administradores")
			.send({
				nome: "João Silva",
				email: "joao@example.com",
				cpf: "123.456.789-10",
				dataNascimento: "1990-01-01",
				login: "joaosilva",
				senha: "senhaSegura",
				cidadeId: null,
			})
			.expect(500)

		expect(response.body.message).toBe("Erro ao criar administrador")
	})
})
