import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { etapas } from "../../../db/schema/etapas.ts"
import { funcionarios } from "../../../db/schema/funcionarios.ts"
import { notificacoes } from "../../../db/schema/notificacoes.ts"

export const postFinalizarChamado: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/chamados/:id/finalizar",
		{
			schema: {
				params: z.object({
					id: z.string().uuid(),
				}),
				body: z.object({
					observacoes: z.string().optional(),
				}),
			},
		},
		async (req, reply) => {
			const { id } = req.params
			const { observacoes = "" } = req.body

			try {
				// Buscar chamado
				const [chamado] = await db
					.select()
					.from(chamados)
					.where(eq(chamados.cha_id, id))

				if (!chamado) {
					return reply.status(404).send({
						error: "Chamado não encontrado",
					})
				}

				// Buscar servidor responsável
				const [servidor] = await db
					.select()
					.from(funcionarios)
					.where(eq(funcionarios.fun_id, chamado.cha_responsavel))

				if (!servidor) {
					return reply.status(404).send({
						error: "Servidor responsável não encontrado",
					})
				}

				// Atualizar chamado para finalizado
				const dataFinalizacao = new Date()
				await db
					.update(chamados)
					.set({
						cha_status: "Finalizado",
						cha_data_fechamento: dataFinalizacao,
					})
					.where(eq(chamados.cha_id, id))

				// Criar etapa no histórico
				await db.insert(etapas).values({
					eta_id: randomUUID(),
					cha_id: id,
					eta_nome: "Chamado finalizado pelo servidor",
					eta_descricao: observacoes
						? `${servidor.fun_nome} finalizou o chamado: ${observacoes}`
						: `${servidor.fun_nome} finalizou o chamado`,
					eta_data_inicio: dataFinalizacao,
					eta_data_fim: dataFinalizacao,
				})

				// Notificar munícipe (solicitante)
				if (chamado.usu_id) {
					await db.insert(notificacoes).values({
						not_id: randomUUID(),
						not_titulo: "Chamado finalizado",
						not_mensagem: observacoes
							? `Seu chamado foi finalizado. Detalhes: ${observacoes}`
							: "Seu chamado foi finalizado com sucesso.",
						not_tipo: "success",
						not_lida: false,
						not_data: dataFinalizacao,
						usu_id: chamado.usu_id,
						fun_id: null,
					})
				}

				// Notificar atendente do departamento
				const [atendente] = await db
					.select()
					.from(funcionarios)
					.where(eq(funcionarios.dep_id, chamado.cha_departamento))
					.where(eq(funcionarios.fun_tipo, "atendente"))
					.limit(1)

				if (atendente) {
					await db.insert(notificacoes).values({
						not_id: randomUUID(),
						not_titulo: "Chamado finalizado",
						not_mensagem: observacoes
							? `Servidor ${servidor.fun_nome} finalizou o chamado #${chamado.cha_id.slice(0, 8)}. Detalhes: ${observacoes}`
							: `Servidor ${servidor.fun_nome} finalizou o chamado #${chamado.cha_id.slice(0, 8)}.`,
						not_tipo: "success",
						not_lida: false,
						not_data: dataFinalizacao,
						usu_id: null,
						fun_id: atendente.fun_id,
					})
				}

				return reply.status(200).send({
					message: "Chamado finalizado com sucesso",
					chamado: {
						id: chamado.cha_id,
						status: "Finalizado",
						dataFinalizacao,
					},
				})
			} catch (error) {
				console.error("[POST /finalizar] Erro:", error)
				return reply.status(500).send({
					error: "Erro ao finalizar chamado",
					details: error instanceof Error ? error.message : String(error),
				})
			}
		},
	)
}
