import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify from "fastify";
import { postEtapasRoute } from "./post-etapas-route.ts";
import { db } from "../../../db/connection.ts";
import { notificacoes } from "../../../db/schema/notificacoes.ts";

// =============================
// 🔧 Mocks do banco de dados
// =============================
vi.mock("../../../db/connection", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ eta_id: "1" }]),
    })),
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          cha_id: "222e4567-e89b-12d3-a456-426614174000",
          usu_id: "333e4567-e89b-12d3-a456-426614174000",
        },
      ]),
    })),
  },
}));

vi.mock("../../../db/schema/chamados", () => ({
  chamados: {
    cha_id: "cha_id",
    usu_id: "usu_id",
  },
}));

vi.mock("../../../db/schema/notificacoes", () => ({
  notificacoes: {
    not_titulo: "not_titulo",
    not_mensagem: "not_mensagem",
    not_tipo: "not_tipo",
    not_lida: "not_lida",
    cha_id: "cha_id",
    usu_id: "usu_id",
  },
}));

vi.mock("../../../db/schema/index", () => ({
  schema: {
    etapas: "etapas",
  },
}));

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>(
    "drizzle-orm"
  );
  return {
    ...actual,
    eq: vi.fn((a, b) => ({ field: a, value: b })),
  };
});

describe("POST /etapas (Supertest)", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    app.register(postEtapasRoute);
    await app.ready();
  });

  // =================================================
  // ✅ Cenário 1 — Criação de etapa e notificação
  // =================================================
  it("deve criar uma nova etapa e notificação com sucesso", async () => {
    const response = await request(app.server)
      .post("/etapas")
      .send({
        nome: "Análise",
        descricao: "Chamado em análise pelo setor técnico",
        data_inicio: new Date().toISOString(),
        data_fim: new Date(Date.now() + 3600000).toISOString(),
        chamado_id: "222e4567-e89b-12d3-a456-426614174000",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Etapa criada");

    // Verifica se o insert foi chamado duas vezes:
    // 1x para etapa e 1x para notificação
    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(db.insert).toHaveBeenNthCalledWith(1, "etapas");
    expect(db.insert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining(notificacoes)
    );
  });

  // =================================================
  // ❌ Cenário 2 — Falha ao criar notificação
  // =================================================
  it("deve criar etapa mesmo se falhar ao criar notificação", async () => {
    // Simula erro na consulta de chamado
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Erro ao buscar chamado");
    });

    const response = await request(app.server)
      .post("/etapas")
      .send({
        nome: "Verificação",
        descricao: "Verificação de documentação",
        data_inicio: new Date().toISOString(),
        data_fim: new Date(Date.now() + 3600000).toISOString(),
        chamado_id: "111e4567-e89b-12d3-a456-426614174000",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Etapa criada");
    expect(db.insert).toHaveBeenCalledWith("etapas");
  });
});
