import stream from "node:stream"
import { pipeline } from "node:stream/promises"
import { eq } from "drizzle-orm"
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
import { anexos } from "../../../db/schema/anexos.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { postAnexosRoute } from "./post-anexos.ts"

// 🧩 Mocks necessários
vi.mock("node:fs", () => ({
	existsSync: vi.fn().mockReturnValue(true),
	mkdirSync: vi.fn(),
	createWriteStream: vi.fn(
		() =>
			new stream.Writable({
				write(_chunk, _encoding, callback) {
					callback() // Simula escrita bem-sucedida
				},
			}),
	),
}))

vi.mock("node:path", async () => {
	const actual = await vi.importActual<typeof import("node:path")>("node:path")
	return { ...actual, join: vi.fn((...args) => args.join("/")) }
})

vi.mock("node:stream/promises", () => ({
	pipeline: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../../../db/connection", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi
				.fn()
				.mockResolvedValue([
					{ cha_id: "111e4567-e89b-12d3-a456-426614174000" },
				]),
		})),
		insert: vi.fn(() => ({
			values: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([
				{
					anx_id: "999e4567-e89b-12d3-a456-426614174999",
					anx_tipo: "image/png",
					anx_url:
						"/uploads/anexos/111e4567-e89b-12d3-a456-426614174000_123.png",
					cha_id: "111e4567-e89b-12d3-a456-426614174000",
				},
			]),
		})),
	},
}))

vi.mock("drizzle-orm", async () => {
	const actual =
		await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm")
	return { ...actual, eq: vi.fn((a, b) => ({ field: a, value: b })) }
})

describe("POST /anexos (Supertest)", () => {
	const app = Fastify()
	app.register(require("@fastify/multipart"))
	app.register(postAnexosRoute)

	beforeAll(async () => {
		await app.ready()
	})

	afterAll(async () => {
		await app.close()
	})

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("deve fazer upload de um anexo com sucesso", async () => {
		const response = await request(app.server)
			.post("/anexos")
			.field("chamado_id", "111e4567-e89b-12d3-a456-426614174000")
			.field("tipo", "image/png")
			.attach("file", Buffer.from("fakefilecontent"), {
				filename: "imagem.png",
				contentType: "image/png",
			})
			.expect(201)

		expect(response.body).toMatchObject({
			message: "Anexo enviado com sucesso",
			anexo: expect.objectContaining({
				anx_tipo: "image/png",
				anx_url: expect.stringContaining("/uploads/anexos/"),
			}),
		})

		expect(pipeline).toHaveBeenCalled()
		expect(db.insert).toHaveBeenCalledWith(anexos)
		expect(eq).toHaveBeenCalledWith(
			chamados.cha_id,
			"111e4567-e89b-12d3-a456-426614174000",
		)
	})

	it("deve retornar 400 se nenhum arquivo for enviado", async () => {
		// Simula request.file() retornando undefined
		const appMock = Fastify()
		appMock.decorateRequest("file", async () => undefined)
		appMock.register(postAnexosRoute)
		await appMock.ready()

		const response = await request(appMock.server)
			.post("/anexos")
			.field("chamado_id", "111e4567-e89b-12d3-a456-426614174000")
			.expect(400)

		expect(response.body).toEqual({ error: "Nenhum arquivo enviado" })
	})

	it("deve retornar 404 se o chamado não for encontrado", async () => {
		vi.mocked(db.select).mockReturnValueOnce({
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([]),
		} as any)

		const response = await request(app.server)
			.post("/anexos")
			.field("chamado_id", "99999999-9999-9999-9999-999999999999")
			.attach("file", Buffer.from("fakefilecontent"), {
				filename: "imagem.png",
				contentType: "image/png",
			})
			.expect(404)

		expect(response.body).toEqual({ error: "Chamado não encontrado" })
	})

	it("deve retornar 500 se ocorrer erro inesperado", async () => {
		vi.mocked(db.insert).mockImplementationOnce(() => {
			throw new Error("Erro genérico de banco")
		})

		const response = await request(app.server)
			.post("/anexos")
			.field("chamado_id", "111e4567-e89b-12d3-a456-426614174000")
			.attach("file", Buffer.from("fakefilecontent"), {
				filename: "imagem.png",
				contentType: "image/png",
			})
			.expect(500)

		expect(response.body).toEqual({ error: "Erro ao fazer upload do anexo" })
	})
})
