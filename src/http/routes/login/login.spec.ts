import { describe, it, expect, beforeEach, vi } from "vitest";
import Fastify from "fastify";
import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";
import { loginRoute } from "./login.ts";
import { db } from "../../../db/connection.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";

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
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>(
    "drizzle-orm"
  );
  return {
    ...actual,
    eq: vi.fn((a, b) => ({ field: a, value: b })),
    or: vi.fn((...conds) => conds),
  };
});

describe("POST /login", () => {
  const app = Fastify();
  app.register(loginRoute);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve fazer login com sucesso", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        login: "maria",
        senha: "senhaSegura123",
        tipo: "municipe",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.success).toBe(true);
    expect(body.data.nome).toBe("Maria Souza");
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledWith(usuarios);
  });

  it("deve retornar 401 se o usuário não existir", async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        login: "inexistente",
        senha: "senhaErrada",
        tipo: "municipe",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("INVALID_CREDENTIALS");
  });

  it("deve retornar 403 se a conta estiver bloqueada", async () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000);
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
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        login: "maria",
        senha: "senhaSegura",
        tipo: "municipe",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("ACCOUNT_TEMPORARILY_LOCKED");
  });

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
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        login: "maria",
        senha: "senhaSegura",
        tipo: "municipe",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("ACCOUNT_DISABLED");
  });

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
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        login: "maria",
        senha: "senhaSegura",
        tipo: "servidor", // tipo incorreto
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("UNAUTHORIZED_PROFILE");
  });

  it("deve retornar 401 se a senha estiver incorreta", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);

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
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        login: "maria",
        senha: "senhaErrada",
        tipo: "municipe",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe("INVALID_CREDENTIALS");
    expect(db.update).toHaveBeenCalled(); // Atualiza tentativas
  });

  it("deve retornar 500 em erro inesperado", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Falha inesperada");
    });

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        login: "maria",
        senha: "senhaSegura",
        tipo: "municipe",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().code).toBe("INTERNAL_SERVER_ERROR");
  });
});
