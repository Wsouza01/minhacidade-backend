import type { FastifyPluginCallback } from "fastify"
import { db } from "../../../db/connection.ts"
import { notificacoes } from "../../../db/schema/notificacoes.ts"

export const getNotificationsUserRoute: FastifyPluginCallback = (app) => {
  app.get("/notificacoes/user/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string }

      const userNotifications = await db
        .select({
          id: notificacoes.ntf_id,
          canal: notificacoes.ntf_canal,
          mensagem: notificacoes.ntf_mensagem,
          dataCriacao: notificacoes.ntf_data_envio,
          lida: notificacoes.ntf_lida,
          usuarioId: notificacoes.usu_id,
        })
        .from(notificacoes)
        .where(db.eq(notificacoes.usu_id, userId))
        .orderBy(db.desc(notificacoes.ntf_data_envio))

      reply.send(userNotifications)
    } catch (error) {
      console.error("Erro ao buscar notificações do usuário:", error)
      reply.status(500).send({ message: "Erro ao buscar notificações" })
    }
  })

  // Route to mark notification as read
  app.patch("/notificacoes/:notificationId/read", async (request, reply) => {
    try {
      const { notificationId } = request.params as { notificationId: string }

      await db
        .update(notificacoes)
        .set({ ntf_lida: "true" })
        .where(db.eq(notificacoes.ntf_id, notificationId))

      reply.send({ message: "Notificação marcada como lida" })
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
      reply.status(500).send({ message: "Erro ao atualizar notificação" })
    }
  })

  // Route to mark all notifications as read for a user
  app.patch("/notificacoes/user/:userId/read-all", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string }

      await db
        .update(notificacoes)
        .set({ ntf_lida: "true" })
        .where(db.eq(notificacoes.usu_id, userId))

      reply.send({ message: "Todas as notificações marcadas como lidas" })
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error)
      reply.status(500).send({ message: "Erro ao atualizar notificações" })
    }
  })
}
