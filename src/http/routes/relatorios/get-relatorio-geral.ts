import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/connection.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { departamentos } from "../../../db/schema/departamentos.ts";
import { funcionarios } from "../../../db/schema/funcionarios.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";

export async function getRelatorioGeralRoute(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/relatorios/geral",
    {
      schema: {
        tags: ["relatorios"],
        summary: "Obter relatório geral do sistema",
        querystring: z.object({
          dataInicio: z.string().optional(),
          dataFim: z.string().optional(),
        }),
        response: {
          200: z.object({
            periodo: z.object({
              inicio: z.string().optional(),
              fim: z.string().optional(),
            }),
            totais: z.object({
              chamados: z.number(),
              usuarios: z.number(),
              funcionarios: z.number(),
              departamentos: z.number(),
              categorias: z.number(),
            }),
            chamadosPorStatus: z.array(
              z.object({
                status: z.string(),
                quantidade: z.number(),
                percentual: z.number(),
              })
            ),
            chamadosPorPrioridade: z.array(
              z.object({
                prioridade: z.string(),
                quantidade: z.number(),
                percentual: z.number(),
              })
            ),
            chamadosPorDepartamento: z.array(
              z.object({
                departamento: z.string(),
                quantidade: z.number(),
                resolvidos: z.number(),
                pendentes: z.number(),
                emAndamento: z.number(),
                tempoMedioResolucao: z.number().nullable(),
              })
            ),
            chamadosPorCategoria: z.array(
              z.object({
                categoria: z.string(),
                quantidade: z.number(),
              })
            ),
            tempoMedioResolucao: z
              .object({
                dias: z.number(),
                horas: z.number(),
                minutos: z.number(),
              })
              .nullable(),
            taxaResolucao: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { dataInicio, dataFim } = request.query;

        // -------------------------------------------------------------
        // 🔍 Filtros de Data
        // -------------------------------------------------------------
        const filters: any[] = [];
        if (dataInicio)
          filters.push(gte(chamados.cha_data_abertura, new Date(dataInicio)));
        if (dataFim)
          filters.push(lte(chamados.cha_data_abertura, new Date(dataFim)));

        const whereFilters = filters.length > 0 ? and(...filters) : undefined;

        // -------------------------------------------------------------
        // 📊 Totais Gerais
        // -------------------------------------------------------------
        const totalChamados = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(chamados)
          .where(whereFilters);

        const totalUsuarios = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(usuarios);

        const totalFuncionarios = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(funcionarios);

        const totalDepartamentos = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(departamentos);

        const totalCategorias = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(categorias);

        // -------------------------------------------------------------
        // 📈 Chamados por Status
        // -------------------------------------------------------------
        const chamadosPorStatus = await db
          .select({
            status: chamados.cha_status,
            quantidade: sql<number>`count(*)::int`,
          })
          .from(chamados)
          .where(whereFilters)
          .groupBy(chamados.cha_status);

        const totalParaPercentual = totalChamados[0]?.count ?? 0;
        const statusComPercentual = chamadosPorStatus.map((item) => ({
          status: item.status,
          quantidade: item.quantidade,
          percentual:
            totalParaPercentual > 0
              ? Number(
                  ((item.quantidade / totalParaPercentual) * 100).toFixed(2)
                )
              : 0,
        }));

        // -------------------------------------------------------------
        // 🚦 Chamados por Prioridade
        // -------------------------------------------------------------
        const chamadosPorPrioridade = await db
          .select({
            prioridade: chamados.cha_prioridade,
            quantidade: sql<number>`count(*)::int`,
          })
          .from(chamados)
          .where(whereFilters)
          .groupBy(chamados.cha_prioridade);

        const prioridadeComPercentual = chamadosPorPrioridade.map((item) => ({
          prioridade: item.prioridade,
          quantidade: item.quantidade,
          percentual:
            totalParaPercentual > 0
              ? Number(
                  ((item.quantidade / totalParaPercentual) * 100).toFixed(2)
                )
              : 0,
        }));

        // -------------------------------------------------------------
        // 🏢 Chamados por Departamento
        // -------------------------------------------------------------
        const chamadosPorDepartamento = await db
          .select({
            departamento: departamentos.dep_nome,
            quantidade: sql<number>`count(*)::int`,
            resolvidos: sql<number>`count(*) filter (where ${chamados.cha_status} = 'Resolvido')::int`,
            pendentes: sql<number>`count(*) filter (where ${chamados.cha_status} = 'Pendente')::int`,
            emAndamento: sql<number>`count(*) filter (where ${chamados.cha_status} = 'Em Andamento')::int`,
            tempoMedioResolucao: sql<number>`
              avg(
                extract(epoch from (${chamados.cha_data_fechamento} - ${chamados.cha_data_abertura})) / 3600
              )
            `,
          })
          .from(chamados)
          .innerJoin(
            departamentos,
            eq(chamados.cha_departamento, departamentos.dep_id)
          )
          .where(whereFilters)
          .groupBy(departamentos.dep_nome);

        // -------------------------------------------------------------
        // 🗂️ Chamados por Categoria
        // -------------------------------------------------------------
        const chamadosPorCategoria = await db
          .select({
            categoria: categorias.cat_nome,
            quantidade: sql<number>`count(*)::int`,
          })
          .from(chamados)
          .innerJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .where(whereFilters)
          .groupBy(categorias.cat_nome)
          .limit(10);

        // -------------------------------------------------------------
        // ⏱️ Tempo Médio de Resolução
        // -------------------------------------------------------------
        let whereTempoMedio = eq(chamados.cha_status, "Resolvido");
        if (whereFilters) whereTempoMedio = and(whereTempoMedio, whereFilters);

        const tempoMedioQuery = await db
          .select({
            tempoMedio: sql<number>`
              avg(
                extract(epoch from (${chamados.cha_data_fechamento} - ${chamados.cha_data_abertura}))
              )
            `,
          })
          .from(chamados)
          .where(whereTempoMedio);

        let tempoMedioResolucao = null;
        if (tempoMedioQuery[0]?.tempoMedio) {
          const segundos = tempoMedioQuery[0].tempoMedio;
          const dias = Math.floor(segundos / 86_400);
          const horas = Math.floor((segundos % 86_400) / 3600);
          const minutos = Math.floor((segundos % 3600) / 60);
          tempoMedioResolucao = { dias, horas, minutos };
        }

        // -------------------------------------------------------------
        // 📊 Taxa de Resolução
        // -------------------------------------------------------------
        const resolvidos =
          chamadosPorStatus.find((s) => s.status === "Resolvido")?.quantidade ??
          0;

        const taxaResolucao =
          totalParaPercentual > 0
            ? Number(((resolvidos / totalParaPercentual) * 100).toFixed(2))
            : 0;

        // -------------------------------------------------------------
        // 📤 Resposta Final
        // -------------------------------------------------------------
        return reply.status(200).send({
          periodo: {
            inicio: dataInicio,
            fim: dataFim,
          },
          totais: {
            chamados: totalChamados[0]?.count ?? 0,
            usuarios: totalUsuarios[0]?.count ?? 0,
            funcionarios: totalFuncionarios[0]?.count ?? 0,
            departamentos: totalDepartamentos[0]?.count ?? 0,
            categorias: totalCategorias[0]?.count ?? 0,
          },
          chamadosPorStatus: statusComPercentual,
          chamadosPorPrioridade: prioridadeComPercentual,
          chamadosPorDepartamento: chamadosPorDepartamento.map((d) => ({
            departamento: d.departamento,
            quantidade: d.quantidade,
            resolvidos: d.resolvidos,
            pendentes: d.pendentes,
            emAndamento: d.emAndamento,
            tempoMedioResolucao: d.tempoMedioResolucao,
          })),
          chamadosPorCategoria: chamadosPorCategoria.map((c) => ({
            categoria: c.categoria,
            quantidade: c.quantidade,
          })),
          tempoMedioResolucao,
          taxaResolucao,
        });
      } catch (error) {
        console.error("[RELATORIO_GERAL] Erro:", error);
        return reply.status(500).send({
          message: "Erro ao gerar relatório",
        });
      }
    }
  );
}
