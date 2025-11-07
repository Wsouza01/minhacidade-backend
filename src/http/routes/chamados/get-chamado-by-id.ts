import { asc, eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { anexos } from "../../../db/schema/anexos.ts"
import { categorias } from "../../../db/schema/categorias.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { departamentos } from "../../../db/schema/departamentos.ts"
import { etapas } from "../../../db/schema/etapas.ts"
import { funcionarios } from "../../../db/schema/funcionarios.ts"
import { usuarios } from "../../../db/schema/usuarios.ts"
import { env } from "../../../env.ts"

const getChamadoByIdParamsSchema = z.object({
	id: z.string().uuid(),
})

export const getChamadoByIdRoute: FastifyPluginCallbackZod = (app) => {
	app.get(
		"/chamados/:id",
		{
			schema: {
				params: getChamadoByIdParamsSchema,
			},
		},
		async (request, reply) => {
			try {
				const { id } = request.params

				// Buscar dados do chamado com joins
				const chamadoResult = await db
					.select({
						cha_id: chamados.cha_id,
						cha_nome: chamados.cha_nome,
						cha_titulo: chamados.cha_titulo,
						cha_descricao: chamados.cha_descricao,
						cha_departamento: chamados.cha_departamento,
						cha_responsavel: chamados.cha_responsavel,
						cha_data_abertura: chamados.cha_data_abertura,
						cha_data_fechamento: chamados.cha_data_fechamento,
						cha_prioridade: chamados.cha_prioridade,
						cha_cep: chamados.cha_cep,
						cha_numero_endereco: chamados.cha_numero_endereco,
						cat_id: chamados.cat_id,
						usu_id: chamados.usu_id,
						// Dados do departamento
						departamento_nome: departamentos.dep_nome,
						departamento_telefone: departamentos.dep_telefone,
						// Dados da categoria
						categoria_nome: categorias.cat_nome,
						// Dados do usuário solicitante
						usuario_nome: usuarios.usu_nome,
						usuario_email: usuarios.usu_email,
						usuario_telefone: usuarios.usu_telefone,
						usuario_cpf: usuarios.usu_cpf,
						// Dados do responsável
						responsavel_nome: funcionarios.fun_nome,
						responsavel_email: funcionarios.fun_email,
					})
					.from(chamados)
					.leftJoin(
						departamentos,
						eq(chamados.cha_departamento, departamentos.dep_id),
					)
					.leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
					.leftJoin(usuarios, eq(chamados.usu_id, usuarios.usu_id))
					.leftJoin(
						funcionarios,
						eq(chamados.cha_responsavel, funcionarios.fun_id),
					)
					.where(eq(chamados.cha_id, id))
					.limit(1)

				if (chamadoResult.length === 0) {
					return reply.status(404).send({ message: "Chamado não encontrado" })
				}

				const chamado = chamadoResult[0]

				// Buscar anexos do chamado (try-catch para debug)
				let chamadoAnexos = []
				try {
					chamadoAnexos = await db
						.select({
							anx_id: anexos.anx_id,
							anx_tipo: anexos.anx_tipo,
							anx_url: anexos.anx_url,
						})
						.from(anexos)
						.where(eq(anexos.cha_id, id))
				} catch (anexosError) {
					console.error("Erro ao buscar anexos:", anexosError)
					// Continue sem anexos se houver erro
					chamadoAnexos = []
				}

				// Buscar etapas/timeline do chamado (try-catch para debug)
				let chamadoEtapas = []
				try {
					chamadoEtapas = await db
						.select({
							eta_id: etapas.eta_id,
							eta_nome: etapas.eta_nome,
							eta_descricao: etapas.eta_descricao,
							eta_data_inicio: etapas.eta_data_inicio,
							eta_data_fim: etapas.eta_data_fim,
						})
						.from(etapas)
						.where(eq(etapas.cha_id, id))
						.orderBy(asc(etapas.eta_data_inicio))
				} catch (etapasError) {
					console.error("Erro ao buscar etapas:", etapasError)
					// Continue sem etapas se houver erro
					chamadoEtapas = []
				}

				// Montar resposta completa
				const response = {
					...chamado,
					anexos: chamadoAnexos,
					etapas: chamadoEtapas,
					// Determinar status baseado nos dados
					status: chamado.cha_data_fechamento
						? "resolvido"
						: chamado.cha_responsavel
							? "em_andamento"
							: "pendente",
					// Formatação de endereço
					endereco_completo:
						chamado.cha_cep && chamado.cha_numero_endereco
							? `${chamado.cha_numero_endereco}, CEP: ${chamado.cha_cep}`
							: chamado.cha_cep || "Não informado",
				}

				reply.send(response)
			} catch (err) {
				console.error("Erro detalhado ao buscar chamado:", err)
				console.error(
					"Stack trace:",
					err instanceof Error ? err.stack : "No stack trace",
				)
				reply.status(500).send({
					message: "Erro ao buscar chamado",
					error:
						env.NODE_ENV === "development" ? err.message : undefined,
				})
			}
		},
	)
}
