import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify from "fastify";
import { cidadesRoute } from "./cidades-route.ts";
import { db } from "../../../db/connection.ts";
import { cidades } from "../../../db/schema/cidades.ts";
import { eq } from "drizzle-orm";

// ======================================
// 🔧 MOCKS
// ======================================
vi.mock("../../../db/connection", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([
        {
          id: "111e4567-e89b-12d3-a456-426614174000",
          nome: "São Paulo",
          estado: "SP",
          ativo: true,
          padrao: false,
        },
      ]),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          cid_id: "222e4567-e89b-12d3-a456-426614174000",
          cid_nome: "Campinas",
          cid_estado: "SP",
          cid_ativo: true,
          cid_padrao: false,
        },
      ]),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          cid_id: "333e4567-e89b-12d3-a456-426614174000",
          cid_nome: "Santos",
          cid_estado: "SP",
          cid_ativo: true,
          cid_padrao: false,
        },
      ]),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock("../../../db/schema/cidades", () => ({
  cidades: {
    cid_id: "cid_id",
    cid_nome: "cid_nome",
    cid_estado: "cid_estado",
    cid_ativo: "cid_ativo",
    cid_padrao: "cid_padrao",
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

// ======================================
// 🧪 TESTES
// ======================================
describe("Cidades Route (Supertest)", () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
    app.register(cidadesRoute);
    await app.ready();
  });

  // ======================================
  // ✅ GET /cidades
  // ======================================
  it("deve listar cidades com sucesso", async () => {
    const response = await request(app.server).get("/cidades");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].nome).toBe("São Paulo");
    expect(db.select).toHaveBeenCalled();
  });

  it("deve retornar erro 500 em falha no banco", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Erro DB");
    });

    const response = await request(app.server).get("/cidades");
    expect(response.status).toBe(500);
    expect(response.body.code).toBe("CITIES_FETCH_ERROR");
  });

  // ======================================
  // ✅ GET /cidades/permitidas
  // ======================================
  it("deve listar cidades permitidas (ativas)", async () => {
    const response = await request(app.server).get("/cidades/permitidas");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(eq).toHaveBeenCalledWith(cidades.cid_ativo, true);
  });

  // ======================================
  // ✅ POST /cidades
  // ======================================
  it("deve adicionar uma cidade com sucesso", async () => {
    const response = await request(app.server).post("/cidades").send({
      nome: "Campinas",
      estado: "SP",
      padrao: false,
      ativo: true,
    });

    expect(response.status).toBe(201);
    expect(db.insert).toHaveBeenCalledWith(cidades);
    expect(response.body.cid_nome).toBe("Campinas");
  });

  it("deve retornar erro 400 se falhar ao criar cidade", async () => {
    vi.mocked(db.insert).mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockRejectedValueOnce(new Error("Falha na inserção")),
    } as any);

    const response = await request(app.server).post("/cidades").send({
      nome: "ErroCity",
      estado: "SP",
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("CITY_CREATION_ERROR");
  });

  // ======================================
  // ✅ PUT /cidades/:id
  // ======================================
  it("deve atualizar cidade com sucesso", async () => {
    const response = await request(app.server)
      .put("/cidades/333e4567-e89b-12d3-a456-426614174000")
      .send({ nome: "Santos", estado: "SP", ativo: true });

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(cidades);
    expect(response.body.cid_nome).toBe("Santos");
  });

  it("deve retornar erro 400 em falha ao atualizar cidade", async () => {
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockRejectedValueOnce(new Error("Falha update")),
    } as any);

    const response = await request(app.server)
      .put("/cidades/111e4567-e89b-12d3-a456-426614174000")
      .send({ nome: "ErroCity" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("CITY_UPDATE_ERROR");
  });

  // ======================================
  // ✅ DELETE /cidades/:id
  // ======================================
  it("deve remover cidade com sucesso", async () => {
    const response = await request(app.server).delete(
      "/cidades/111e4567-e89b-12d3-a456-426614174000"
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Cidade removida com sucesso");
    expect(db.delete).toHaveBeenCalledWith(cidades);
  });

  it("deve retornar erro 400 em falha ao remover cidade", async () => {
    vi.mocked(db.delete).mockReturnValueOnce({
      where: vi.fn().mockRejectedValueOnce(new Error("Erro delete")),
    } as any);

    const response = await request(app.server).delete(
      "/cidades/111e4567-e89b-12d3-a456-426614174000"
    );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("CITY_DELETION_ERROR");
  });
});
