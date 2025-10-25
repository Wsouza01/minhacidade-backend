import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify from "fastify";
import { db } from "../../../db/connection.ts";
import { hash } from "bcryptjs";
import { postFuncionariosRoute } from "./post-funcionarios.ts";

// =============================
// 🔧 Mocks do banco de dados
// =============================
vi.mock("../../../db/connection", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ fun_id: "1" }]),
    })),
  },
}));

vi.mock("../../../db/schema/index", () => ({
  schema: {
    funcionarios: {
      fun_id: "fun_id",
      fun_nome: "fun_nome",
      fun_email: "fun_email",
      fun_cpf: "fun_cpf",
      fun_data_nascimento: "fun_data_nascimento",
      fun_login: "fun_login",
      fun_senha: "fun_senha",
      fun_matricula: "fun_matricula",
      fun_tipo: "fun_tipo",
      dep_id: "dep_id",
      cid_id: "cid_id",
      fun_requer_troca_senha: "fun_requer_troca_senha",
    },
    cidades: {
      cid_id: "cid_id",
    },
    departamentos: {
      dep_id: "dep_id",
      cid_id: "cid_id",
    },
  },
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashedPassword"),
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

describe("POST /funcionarios (Supertest)", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    app.register(postFuncionariosRoute);
    await app.ready();
  });

  const basePayload = {
    nome: "Carlos Silva",
    email: "carlos@example.com",
    cpf: "12345678909", // CPF válido fictício
    dataNascimento: "1995-05-10",
    matricula: "MAT123",
    tipo: "servidor",
    senha: "senhaSegura123",
    cidadeId: "111e4567-e89b-12d3-a456-426614174000",
  };

  // =================================================
  // ❌ Cenário 1 — CPF inválido
  // =================================================
  it("deve retornar 400 se o CPF for inválido", async () => {
    const response = await request(app.server)
      .post("/funcionarios")
      .send({ ...basePayload, cpf: "11111111111" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("CPF inválido");
    expect(db.insert).not.toHaveBeenCalled();
  });

  // =================================================
  // ❌ Cenário 2 — CPF já cadastrado
  // =================================================
  it("deve retornar 400 se o CPF já estiver cadastrado", async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ fun_id: "1" }]),
    } as any);

    const response = await request(app.server)
      .post("/funcionarios")
      .send(basePayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("CPF já cadastrado");
  });

  // =================================================
  // ❌ Cenário 3 — Email já cadastrado
  // =================================================
  it("deve retornar 400 se o email já estiver cadastrado", async () => {
    // Primeira verificação de CPF -> sem resultados
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    } as any);

    // Segunda verificação (email) -> já existe
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ fun_id: "2" }]),
    } as any);

    const response = await request(app.server)
      .post("/funcionarios")
      .send(basePayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email já cadastrado");
  });

  // =================================================
  // ❌ Cenário 4 — Menor de idade
  // =================================================
  it("deve retornar 400 se o funcionário tiver menos de 18 anos", async () => {
    const response = await request(app.server)
      .post("/funcionarios")
      .send({ ...basePayload, dataNascimento: "2010-01-01" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Funcionário deve ter pelo menos 18 anos"
    );
  });

  // =================================================
  // ❌ Cenário 5 — Cidade não encontrada
  // =================================================
  it("deve retornar 400 se a cidade não for encontrada", async () => {
    // CPF e Email válidos
    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any)
      // Cidades vazias
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

    const response = await request(app.server)
      .post("/funcionarios")
      .send(basePayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Cidade não encontrada");
  });

  // =================================================
  // ❌ Cenário 6 — Departamento inválido
  // =================================================
  it("deve retornar 400 se o departamento não pertencer à cidade", async () => {
    vi.mocked(db.select)
      // CPF OK
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any)
      // Email OK
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any)
      // Cidade OK
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ cid_id: "CITY1" }]),
      } as any)
      // Departamento pertence a outra cidade
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ dep_id: "DEP1", cid_id: "CITY2" }]),
      } as any);

    const response = await request(app.server)
      .post("/funcionarios")
      .send({ ...basePayload, departamentoId: "DEP1" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Departamento não encontrado ou não pertence à cidade"
    );
  });

  // =================================================
  // ✅ Cenário 7 — Criação bem-sucedida
  // =================================================
  it("deve criar um funcionário com sucesso", async () => {
    vi.mocked(db.select)
      // CPF OK
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any)
      // Email OK
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any)
      // Cidade OK
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue([
            { cid_id: "111e4567-e89b-12d3-a456-426614174000" },
          ]),
      } as any);

    const response = await request(app.server)
      .post("/funcionarios")
      .send(basePayload);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Funcionário criado com sucesso");

    expect(hash).toHaveBeenCalledWith("senhaSegura123", 10);
    expect(db.insert).toHaveBeenCalled();
  });
});
