import Fastify from "fastify"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "../../../db/connection.ts"
import { notificacoes } from "../../../db/schema/notificacoes.ts"
import { postNotificationRoute } from "./post-notification.ts"

// =============================
// 🔧 Mocks do banco de dados
// =============================
vi.mock("../../../db/connection", () => ({
	db: {
		insert: vi.fn(() => ({
			values: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([
				{
					ntf_id: "111e4567-e89b-12d3-a456-426614174000",
					usu_id: "222e4567-e89b-12d3-a456-426614174000",
					ntf_mensagem: "Chamado atualizado com sucesso",
					ntf_canal: "app",
					ntf_lida: "false",
					cha_id: "333e4567-e89b-12d3-a456-426614174000",
				},
			]),
		})),
	},
}))

vi.mock("../../../db/schema/notificacoes", () => ({
	notificacoes: {
		ntf_id: "ntf_id",
		usu_id: "usu_id",
		ntf_mensagem: "ntf_mensagem",
		ntf_canal: "ntf_canal",
		ntf_lida: "ntf_lida",
		cha_id: "cha_id",
	},
}))

describe("POST /notifications (Supertest)", () => {
	let app: ReturnType<typeof Fastify>

	beforeEach(async () => {
		vi.clearAllMocks()
		app = Fastify()
		app.register(postNotificationRoute)
		await app.ready()
	})

	// =================================================
	// ✅ Cenário 1 — Criação bem-sucedida
	// =================================================
	it("deve criar uma notificação com sucesso", async () => {
		const payload = {
			usu_id: "222e4567-e89b-12d3-a456-426614174000",
			not_mensagem: "Seu chamado foi atualizado.",
			cha_id: "333e4567-e89b-12d3-a456-426614174000",
		}

		const response = await request(app.server)
			.post("/notifications")
			.send(payload)

		expect(response.status).toBe(201)
		expect(response.body.message).toBe("Notificação criada com sucesso")

		expect(db.insert).toHaveBeenCalledWith(notificacoes)
		expect(response.body.notificacao).toHaveProperty("ntf_id")
	})

	// =================================================
	// ❌ Cenário 2 — Falha no banco de dados
	// =================================================
	it("deve retornar 500 se ocorrer erro ao criar notificação", async () => {
		vi.mocked(db.insert).mockImplementationOnce(() => {
			throw new Error("Falha na conexão com o banco")
		})

		const payload = {
			usu_id: "222e4567-e89b-12d3-a456-426614174000",
			not_mensagem: "Erro ao salvar notificação",
		}

		const response = await request(app.server)
			.post("/notifications")
			.send(payload)

		expect(response.status).toBe(500)
		expect(response.body.message).toBe("Erro ao criar notificação")
		expect(response.body.error).toBe("Falha na conexão com o banco")
	})

	// =================================================
	// ❌ Cenário 3 — Payload inválido (usu_id ausente)
	// =================================================
	it("deve retornar 400 se o corpo da requisição for inválido", async () => {
		const payload = {
			not_mensagem: "Mensagem sem ID de usuário",
		}

		const response = await request(app.server)
			.post("/notifications")
			.send(payload)

		expect(response.status).toBe(400)
	})
})
