import { randomUUID } from "node:crypto"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { chamados } from "../../../db/schema/chamados.ts"
import { eq, and } from "drizzle-orm"
import { etapas } from "../../../db/schema/etapas.ts"
import { funcionarios } from "../../../db/schema/funcionarios.ts"
import { notificacoes } from "../../../db/schema/notificacoes.ts"

export const devolverChamadoRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/chamados/:chamadoId/devolver",
    {
      schema: {
        params: z.object({
          chamadoId: z.string().uuid(),
        }),
        body: z.object({
          observacoes: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { chamadoId } = request.params
        const { observacoes } = request.body

        const [chamado] = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, chamadoId))

        if (!chamado) {
          return reply.status(404).send({ message: "Chamado não encontrado" })
        }

        if (chamado.cha_data_fechamento) {
          return reply.status(400).send({
            message: "Não é possível devolver um chamado que já foi finalizado.",
          })
        }

        let servidorNome = "Servidor não identificado"
        if (chamado.cha_responsavel) {
          const [servidor] = await db
            .select()
            .from(funcionarios)
            .where(eq(funcionarios.fun_id, chamado.cha_responsavel))
          if (servidor) {
            servidorNome = servidor.fun_nome
          }
        }

        await db
          .update(chamados)
          .set({ cha_responsavel: null })
          .where(eq(chamados.cha_id, chamadoId))

        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: chamadoId,
          eta_nome: "Chamado devolvido",
          eta_descricao: `${servidorNome}: ${observacoes}`,
          eta_data_inicio: new Date(),
        })

        // Notificar atendente do departamento
        const [atendente] = chamado.cha_departamento
          ? await db
              .select()
              .from(funcionarios)
              .where(
                and(
                  eq(funcionarios.dep_id, chamado.cha_departamento),
                  eq(funcionarios.fun_tipo, "atendente")
                )
              )
              .limit(1)
          : []

        if (atendente) {
          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: "Chamado devolvido",
            not_mensagem: `${servidorNome} devolveu o chamado #${chamadoId.slice(0, 8)}. Motivo: ${observacoes}`,
            not_tipo: "warning",
            not_lida: false,
            not_data: new Date(),
            not_link: `/chamado/${chamadoId}`,
            usu_id: null,
            fun_id: atendente.fun_id,
          })
        }

        // Notificar munícipe sobre devolução
        if (chamado.usu_id) {
          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: "Chamado devolvido",
            not_mensagem: `Seu chamado foi devolvido para reatribuição. Em breve será encaminhado novamente.`,
            not_tipo: "info",
            not_lida: false,
            not_data: new Date(),
            not_link: `/chamado/${chamadoId}`,
            usu_id: chamado.usu_id,
            fun_id: null,
          })
        }

        return reply.status(204).send()
      } catch (err) {
        console.error("Erro ao devolver chamado:", err)
        reply.status(500).send({ message: "Erro ao devolver chamado" })
      }
    },
  )
}
