import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { administradores } from "../../../db/schema/administradores.js";
import { categorias } from "../../../db/schema/categorias.js";
import { chamados } from "../../../db/schema/chamados.js";
import { departamentos } from "../../../db/schema/departamentos.js";
import { funcionarios } from "../../../db/schema/funcionarios.js";
import { usuarios } from "../../../db/schema/usuarios.js";

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
					adminId: z.string().optional(),
				}),
			},
		},
		async (request, reply) => {
			try {
				const { dataInicio, dataFim, adminId } = request.query;
				console.log("[RELATORIO] Parâmetros recebidos:", {
					dataInicio,
					dataFim,
					adminId,
				});

				let cidadeId: string | null = null;

				// Se adminId foi fornecido, buscar a cidade do administrador
				if (adminId) {
					console.log("[RELATORIO] Buscando cidade do admin:", adminId);
					const admin = await db
						.select({ cidadeId: administradores.cid_id })
						.from(administradores)
						.where(eq(administradores.adm_id, adminId));

					console.log("[RELATORIO] Admin encontrado:", admin);
					if (admin.length > 0 && admin[0].cidadeId) {
						cidadeId = admin[0].cidadeId;
						console.log("[RELATORIO] CidadeId do admin:", cidadeId);
					}
				}

				// -------------------------------------------------------------
				// 🔍 Filtros de Data e Cidade
				// -------------------------------------------------------------
				const filters: any[] = [];
				if (dataInicio)
					filters.push(gte(chamados.cha_data_abertura, new Date(dataInicio)));
				if (dataFim)
					filters.push(lte(chamados.cha_data_abertura, new Date(dataFim)));

				// Filtro de cidade - join com departamentos
				let whereFilters = filters.length > 0 ? and(...filters) : undefined;

				// Se cidadeId foi obtido do admin, adicionar filtro de cidade
				if (cidadeId) {
					const cidadeFilter = eq(departamentos.cid_id, cidadeId);
					whereFilters = whereFilters
						? and(whereFilters, cidadeFilter)
						: cidadeFilter;
				}

				// Função helper para contar chamados com filtro de cidade
				const countChamadosComFiltro = async () => {
					const base = db
						.select({ count: sql<number>`count(*)::int` })
						.from(chamados)
						.leftJoin(
							departamentos,
							eq(chamados.cha_departamento, departamentos.dep_id),
						);

					return whereFilters ? base.where(whereFilters) : base;
				};

				// Função helper para queries de chamados com filtro de cidade
				const queryChamadosComFiltro = (
					selectClause: ReturnType<typeof db.select>,
				) => {
					const base = selectClause
						.from(chamados)
						.leftJoin(
							departamentos,
							eq(chamados.cha_departamento, departamentos.dep_id),
						);

					return whereFilters ? base.where(whereFilters) : base;
				};

				// -------------------------------------------------------------
				// 📊 Totais Gerais
				// -------------------------------------------------------------
				const totalChamados = await countChamadosComFiltro();

				const totalUsuarios = await db
					.select({ count: sql<number>`count(*)::int` })
					.from(usuarios);

				// Filtrar funcionários por cidade se cidadeId foi obtido
				const baseFuncionariosQuery = db
					.select({ count: sql<number>`count(*)::int` })
					.from(funcionarios);

				const totalFuncionarios = await (cidadeId
					? baseFuncionariosQuery.where(eq(funcionarios.cid_id, cidadeId))
					: baseFuncionariosQuery);

				// Filtrar departamentos por cidade se cidadeId foi obtido
				const baseDepartamentosQuery = db
					.select({ count: sql<number>`count(*)::int` })
					.from(departamentos);

				const totalDepartamentos = await (cidadeId
					? baseDepartamentosQuery.where(eq(departamentos.cid_id, cidadeId))
					: baseDepartamentosQuery);
				console.log(
					"[RELATORIO] Total de departamentos:",
					totalDepartamentos[0]?.count,
				);

				const totalCategorias = await db
					.select({ count: sql<number>`count(*)::int` })
					.from(categorias);

				// -------------------------------------------------------------
				// 🔄 Lista base de chamados (para consolidar métricas em JS)
				// -------------------------------------------------------------
				const chamadosList = await db
					.select({
						id: chamados.cha_id,
						status: chamados.cha_status,
						dataAbertura: chamados.cha_data_abertura,
						dataFechamento: chamados.cha_data_fechamento,
						responsavel: chamados.cha_responsavel,
						prioridade: chamados.cha_prioridade,
						depId: departamentos.dep_id,
						depNome: departamentos.dep_nome,
						catNome: categorias.cat_nome,
					})
					.from(chamados)
					.leftJoin(
						departamentos,
						eq(chamados.cha_departamento, departamentos.dep_id),
					)
					.leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
					.where(whereFilters ?? sql`true`);

				const totalChamadosJs = chamadosList.length;

				// -------------------------------------------------------------
				// 📈 Chamados por Status
				// -------------------------------------------------------------
				const statusMap: Record<string, number> = {};
				chamadosList.forEach((c) => {
					const key = c.status || "Indefinido";
					statusMap[key] = (statusMap[key] || 0) + 1;
				});

				const chamadosPorStatus = Object.entries(statusMap).map(
					([status, quantidade]) => ({
						status,
						quantidade,
					}),
				);

				const totalParaPercentual =
					totalChamadosJs > 0
						? totalChamadosJs
						: Number(totalChamados[0]?.count ?? 0);
				const statusComPercentual = chamadosPorStatus.map((item: any) => ({
					status: item.status,
					quantidade: Number(item.quantidade ?? 0),
					percentual:
						totalParaPercentual > 0
							? Number(
									(
										(Number(item.quantidade ?? 0) / totalParaPercentual) *
										100
									).toFixed(2),
								)
							: 0,
				}));

				// -------------------------------------------------------------
				// 🚦 Chamados por Prioridade
				// -------------------------------------------------------------
				const prioridadeMap: Record<string, number> = {};
				chamadosList.forEach((c) => {
					const key = c.prioridade || "Indefinida";
					prioridadeMap[key] = (prioridadeMap[key] || 0) + 1;
				});
				const chamadosPorPrioridade = Object.entries(prioridadeMap).map(
					([prioridade, quantidade]) => ({ prioridade, quantidade }),
				);

				const prioridadeComPercentual = chamadosPorPrioridade.map((item) => ({
					prioridade: item.prioridade,
					quantidade: Number(item.quantidade ?? 0),
					percentual:
						totalParaPercentual > 0
							? Number(
									(
										(Number(item.quantidade ?? 0) / totalParaPercentual) *
										100
									).toFixed(2),
								)
							: 0,
				}));

				// -------------------------------------------------------------
				// 🏢 Chamados por Departamento
				// -------------------------------------------------------------
				const depMap: Record<
					string,
					{
						departamento: string;
						quantidade: number;
						resolvidos: number;
						pendentes: number;
						emAndamento: number;
						tempos: number[];
					}
				> = {};

				chamadosList.forEach((c) => {
					const depKey = c.depNome || "Sem departamento";
					if (!depMap[depKey]) {
						depMap[depKey] = {
							departamento: depKey,
							quantidade: 0,
							resolvidos: 0,
							pendentes: 0,
							emAndamento: 0,
							tempos: [],
						};
					}

					const dep = depMap[depKey];
					dep.quantidade += 1;

					const resolvido = c.dataFechamento !== null;
					const pendente = c.dataFechamento === null && c.responsavel === null;
					const emAndamento =
						c.dataFechamento === null && c.responsavel !== null;

					if (resolvido) {
						dep.resolvidos += 1;
						const diff =
							(new Date(c.dataFechamento!).getTime() -
								new Date(c.dataAbertura).getTime()) /
							3_600_000;
						if (!Number.isNaN(diff)) dep.tempos.push(diff);
					} else if (emAndamento) {
						dep.emAndamento += 1;
					} else if (pendente) {
						dep.pendentes += 1;
					}
				});

				const chamadosPorDepartamento = Object.values(depMap).map((dep) => {
					const tempoMedioResolucao =
						dep.tempos.length > 0
							? dep.tempos.reduce((a, b) => a + b, 0) / dep.tempos.length
							: null;
					return {
						departamento: dep.departamento,
						quantidade: dep.quantidade,
						resolvidos: dep.resolvidos,
						pendentes: dep.pendentes,
						emAndamento: dep.emAndamento,
						tempoMedioResolucao,
					};
				});

				// -------------------------------------------------------------
				// 🗂️ Chamados por Categoria
				// -------------------------------------------------------------
				const catMap: Record<string, number> = {};
				chamadosList.forEach((c) => {
					const key = c.catNome || "Sem categoria";
					catMap[key] = (catMap[key] || 0) + 1;
				});

				const chamadosPorCategoria = Object.entries(catMap)
					.map(([categoria, quantidade]) => ({ categoria, quantidade }))
					.slice(0, 10);

				// -------------------------------------------------------------
				// ⏱️ Tempo Médio de Resolução
				// -------------------------------------------------------------
				const resolvidosList = chamadosList.filter(
					(c) => c.dataFechamento !== null,
				);
				const temposMs = resolvidosList
					.map(
						(c) =>
							new Date(c.dataFechamento!).getTime() -
							new Date(c.dataAbertura).getTime(),
					)
					.filter((diff) => !Number.isNaN(diff) && diff >= 0);

				let tempoMedioResolucao = null;
				if (temposMs.length > 0) {
					const mediaSegundos =
						temposMs.reduce((a, b) => a + b, 0) / temposMs.length / 1000;
					const dias = Math.floor(mediaSegundos / 86_400);
					const horas = Math.floor((mediaSegundos % 86_400) / 3600);
					const minutos = Math.floor((mediaSegundos % 3600) / 60);
					tempoMedioResolucao = { dias, horas, minutos };
				}

				// -------------------------------------------------------------
				// 📊 Taxa de Resolução
				// -------------------------------------------------------------
				const resolvidos = resolvidosList.length;

				const taxaResolucao =
					totalParaPercentual > 0
						? Number(((resolvidos / totalParaPercentual) * 100).toFixed(2))
						: 0;

				// -------------------------------------------------------------
				// 📤 Resposta Final
				// -------------------------------------------------------------
				const response = {
					periodo: {
						inicio: dataInicio,
						dataFim: dataFim,
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
						tempoMedioResolucao: d.tempoMedioResolucao
							? Number(d.tempoMedioResolucao)
							: null,
					})),
					chamadosPorCategoria: chamadosPorCategoria.map((c: any) => ({
						categoria: c.categoria,
						quantidade: c.quantidade,
					})),
					tempoMedioResolucao,
					taxaResolucao,
				};

				console.log(
					"[RELATORIO_GERAL] Resposta:",
					JSON.stringify(response, null, 2),
				);
				return reply.status(200).send(response);
			} catch (error) {
				console.error("[RELATORIO_GERAL] Erro:", error);
				return reply.status(500).send({});
			}
		},
	);
}
