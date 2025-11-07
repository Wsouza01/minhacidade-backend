import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { etapas } from "../../../db/schema/etapas.ts"
import { funcionarios } from "../../../db/schema/funcionarios.ts"
import { notificacoes } from "../../../db/schema/notificacoes.ts"
import { env } from "../../../env.ts"

export const postDevolverChamado: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/chamados/:id/devolver",
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

				// Buscar servidor que está devolvendo
				const [servidor] = await db
					.select()
					.from(funcionarios)
					.where(eq(funcionarios.fun_id, chamado.cha_responsavel))

				if (!servidor) {
					return reply.status(404).send({
						error: "Servidor responsável não encontrado",
					})
				}

				// Buscar atendente do departamento para enviar notificação
				const [atendente] = await db
					.select()
					.from(funcionarios)
					.where(eq(funcionarios.dep_id, chamado.cha_departamento))
					.where(eq(funcionarios.fun_tipo, "atendente"))
					.limit(1)

				if (!atendente) {
					return reply.status(404).send({
						error: "Atendente do departamento não encontrado",
					})
				}

				// Devolver o chamado: remover responsável
				const dataDevolucao = new Date()
				await db
					.update(chamados)
					.set({
						cha_responsavel: null,
					})
					.where(eq(chamados.cha_id, id))

				// Criar etapa no histórico
				await db.insert(etapas).values({
					eta_id: randomUUID(),
					cha_id: id,
					eta_nome: "Chamado devolvido pelo servidor",
					eta_descricao: observacoes
						? `${servidor.fun_nome} devolveu o chamado: ${observacoes}`
						: `${servidor.fun_nome} devolveu o chamado`,
					eta_data_inicio: dataDevolucao,
					eta_data_fim: null,
				})

				// Notificar atendente com link para o chamado
				const chamadoUrl = `${env.FRONTEND_URL}/chamado/${chamado.cha_id}`

				await db.insert(notificacoes).values({
					not_id: randomUUID(),
					not_titulo: "Chamado devolvido",
					not_mensagem: observacoes
						? `Servidor ${servidor.fun_nome} devolveu o chamado #${chamado.cha_id.slice(0, 8)}. Motivo: ${observacoes}`
						: `Servidor ${servidor.fun_nome} devolveu o chamado #${chamado.cha_id.slice(0, 8)}.`,
					not_tipo: "warning",
					not_lida: false,
					not_data: dataDevolucao,
					not_link: chamadoUrl,
					usu_id: null,
					fun_id: atendente.fun_id,
				})

				return reply.status(200).send({
					message: "Chamado devolvido com sucesso",
					chamado: {
						id: chamado.cha_id,
						responsavel: null,
						dataDevolucao,
					},
				})
			} catch (error) {
				console.error("[POST /devolver] Erro:", error)
				return reply.status(500).send({
					error: "Erro ao devolver chamado",
					details: error instanceof Error ? error.message : String(error),
				})
			}
		},
	)
}
