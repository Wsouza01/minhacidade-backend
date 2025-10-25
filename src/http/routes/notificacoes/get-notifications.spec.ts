import request from "supertest";
import { describe, it, beforeEach, expect, vi } from "vitest";
import Fastify from "fastify";
import { db } from "../../../db/connection.ts";
import { notificacoes } from "../../../db/schema/notificacoes.ts";
import { getNotificationsUserRoute } from "./get-notifications-user.ts";

// =============================
// 🔧 MOCKS
// =============================
vi.mock("../../../db/connection", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        {
          id: "not1",
          titulo: "Novo chamado",
          mensagem: "Seu chamado foi aberto com sucesso",
          tipo: "info",
          lida: false,
          data: "2025-10-24T12:00:00Z",
          usuarioId: "user1",
        },
      ]),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    })),
    desc: vi.fn((col: string) => `desc(${col})`),
  },
}));

vi.mock("../../../db/schema/notificacoes", () => ({
  notificacoes: {
    not_id: "not_id",
    not_titulo: "not_titulo",
    not_mensagem: "not_mensagem",
    not_tipo: "not_tipo",
    not_lida: "not_lida",
    not_data: "not_data",
    usu_id: "usu_id",
    fun_id: "fun_id",
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

// =============================
// 🧪 TESTES
// =============================
describe("📬 GET /notificacoes routes (Supertest)", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    app.register(getNotificationsUserRoute);
    await app.ready();
  });

  // =================================================
  // ✅ 1. GET /notificacoes/user/:userId
  // =================================================
  it("deve retornar as notificações do usuário com sucesso", async () => {
    const response = await request(app.server).get("/notificacoes/user/user1");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty("mensagem");
    expect(db.select).toHaveBeenCalled();
  });

  // =================================================
  // ❌ 2. GET /notificacoes/user/:userId → erro interno
  // =================================================
  it("deve retornar 500 se ocorrer erro ao buscar notificações do usuário", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Falha no banco");
    });

    const response = await request(app.server).get("/notificacoes/user/user1");

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao buscar notificações");
  });

  // =================================================
  // ✅ 3. PATCH /notificacoes/:notificationId/read
  // =================================================
  it("deve marcar uma notificação como lida", async () => {
    const response = await request(app.server)
      .patch("/notificacoes/not1/read")
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Notificação marcada como lida");
    expect(db.update).toHaveBeenCalledWith(notificacoes);
  });

  // =================================================
  // ❌ 4. PATCH /notificacoes/:notificationId/read → erro interno
  // =================================================
  it("deve retornar 500 se falhar ao marcar notificação como lida", async () => {
    vi.mocked(db.update).mockImplementationOnce(() => {
      throw new Error("Erro na atualização");
    });

    const response = await request(app.server)
      .patch("/notificacoes/not1/read")
      .send();

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao atualizar notificação");
  });

  // =================================================
  // ✅ 5. PATCH /notificacoes/user/:userId/read-all
  // =================================================
  it("deve marcar todas as notificações do usuário como lidas", async () => {
    const response = await request(app.server)
      .patch("/notificacoes/user/user1/read-all")
      .send();

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Todas as notificações marcadas como lidas"
    );
    expect(db.update).toHaveBeenCalledWith(notificacoes);
  });

  // =================================================
  // ❌ 6. PATCH /notificacoes/user/:userId/read-all → erro interno
  // =================================================
  it("deve retornar 500 se falhar ao marcar todas as notificações como lidas", async () => {
    vi.mocked(db.update).mockImplementationOnce(() => {
      throw new Error("Erro de conexão");
    });

    const response = await request(app.server)
      .patch("/notificacoes/user/user1/read-all")
      .send();

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao atualizar notificações");
  });

  // =================================================
  // ✅ 7. GET /notificacoes/funcionario/:funcionarioId
  // =================================================
  it("deve retornar notificações do funcionário", async () => {
    const response = await request(app.server).get(
      "/notificacoes/funcionario/fun123"
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(db.select).toHaveBeenCalled();
  });

  // =================================================
  // ❌ 8. GET /notificacoes/funcionario/:funcionarioId → erro interno
  // =================================================
  it("deve retornar 500 se ocorrer erro ao buscar notificações do funcionário", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Falha no banco funcionário");
    });

    const response = await request(app.server).get(
      "/notificacoes/funcionario/fun123"
    );

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Erro ao buscar notificações");
  });
});
