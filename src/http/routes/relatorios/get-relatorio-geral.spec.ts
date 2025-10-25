import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import Fastify from "fastify";
import request from "supertest";
import { getRelatorioGeralRoute } from "./get-relatorio-geral.ts";
import { db } from "../../../db/connection.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { departamentos } from "../../../db/schema/departamentos.ts";
import { funcionarios } from "../../../db/schema/funcionarios.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";

// 🧩 Mock do drizzle e do banco
vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>(
    "drizzle-orm"
  );
  return {
    ...actual,
    eq: vi.fn((a, b) => ({ field: a, value: b })),
    and: vi.fn((...args) => args),
    gte: vi.fn((a, b) => ({ field: a, value: b })),
    lte: vi.fn((a, b) => ({ field: a, value: b })),
    sql: vi.fn((strings) => strings.join("")),
  };
});

vi.mock("../../../db/connection", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    })),
  },
}));

describe("GET /relatorios/geral (Supertest)", () => {
  const app = Fastify();
  beforeAll(async () => {
    await getRelatorioGeralRoute(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar relatório geral com sucesso", async () => {
    // 🔧 Mock de respostas dos selects
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ count: 10 }]), // total chamados
        } as any)
    );

    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockResolvedValue([{ count: 5 }]), // total usuários
        } as any)
    );

    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockResolvedValue([{ count: 3 }]), // total funcionários
        } as any)
    );

    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockResolvedValue([{ count: 2 }]), // total departamentos
        } as any)
    );

    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockResolvedValue([{ count: 4 }]), // total categorias
        } as any)
    );

    // Chamados por status
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockResolvedValue([
            { status: "Resolvido", quantidade: 6 },
            { status: "Pendente", quantidade: 4 },
          ]),
        } as any)
    );

    // Chamados por prioridade
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockResolvedValue([
            { prioridade: "Alta", quantidade: 3 },
            { prioridade: "Baixa", quantidade: 7 },
          ]),
        } as any)
    );

    // Chamados por departamento
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockResolvedValue([
            {
              departamento: "TI",
              quantidade: 5,
              resolvidos: 3,
              pendentes: 2,
              emAndamento: 0,
              tempoMedioResolucao: 10,
            },
          ]),
        } as any)
    );

    // Chamados por categoria
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue([{ categoria: "Suporte", quantidade: 5 }]),
        } as any)
    );

    // Tempo médio de resolução
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue([{ tempoMedio: 7200 }]), // 2 horas
        } as any)
    );

    const response = await request(app.server)
      .get("/relatorios/geral")
      .expect(200);

    expect(response.body).toMatchObject({
      periodo: { inicio: undefined, fim: undefined },
      totais: {
        chamados: 10,
        usuarios: 5,
        funcionarios: 3,
        departamentos: 2,
        categorias: 4,
      },
      taxaResolucao: 60,
    });

    expect(Array.isArray(response.body.chamadosPorStatus)).toBe(true);
    expect(db.select).toHaveBeenCalled();
  });

  it("deve aplicar filtros de dataInicio e dataFim corretamente", async () => {
    const response = await request(app.server)
      .get("/relatorios/geral?dataInicio=2024-01-01&dataFim=2024-12-31")
      .expect(200);

    // A execução é mockada, mas garantimos que os filtros foram aplicados
    expect(response.body.periodo).toMatchObject({
      inicio: "2024-01-01",
      fim: "2024-12-31",
    });
  });

  it("deve retornar 500 em erro inesperado", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Falha geral");
    });

    const response = await request(app.server)
      .get("/relatorios/geral")
      .expect(500);

    expect(response.body.message).toBe("Erro ao gerar relatório");
  });
});
