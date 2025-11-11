import Fastify from "fastify";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../../db/index.ts";
import { getEtapasRoute } from "./get-etapas-route.ts";

// ====================================
// 🔧 Mock do banco de dados e schema
// ====================================
vi.mock("../../../db/index", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn().mockResolvedValue([
				{
					eta_id: "1",
					eta_nome: "Abertura",
					eta_ordem: 1,
				},
				{
					eta_id: "2",
					eta_nome: "Encaminhamento",
					eta_ordem: 2,
				},
			]),
		})),
	},
}));

vi.mock("../../../db/schema/index", () => ({
	schema: {
		etapas: "etapas",
	},
}));

describe("GET /etapas (Supertest)", () => {
	let app: ReturnType<typeof Fastify>;

	beforeEach(async () => {
		vi.clearAllMocks();
		app = Fastify();
		app.register(getEtapasRoute);
		await app.ready();
	});

	// ====================================
	// ✅ Cenário 1 — Sucesso
	// ====================================
	it("deve retornar a lista de etapas com sucesso", async () => {
		const response = await request(app.server).get("/etapas");

		expect(response.status).toBe(200);
		expect(Array.isArray(response.body)).toBe(true);
		expect(response.body.length).toBe(2);
		expect(response.body[0]).toHaveProperty("eta_id");
		expect(db.select).toHaveBeenCalled();
	});

	// ====================================
	// ❌ Cenário 2 — Erro interno
	// ====================================
	it("deve retornar 500 se ocorrer um erro no banco", async () => {
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw new Error("Erro de conexão com o banco");
		});

		const appErro = Fastify();
		appErro.register(getEtapasRoute);
		await appErro.ready();

		const response = await request(appErro.server).get("/etapas");

		// Fastify retorna 500 automaticamente em exceções não tratadas
		expect(response.status).toBe(500);
	});
});
