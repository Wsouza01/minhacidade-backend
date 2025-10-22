import type { FastifyPluginCallback } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../../db/connection.ts"
import { notificacoes } from "../../../db/schema/notificacoes.ts"

export const getNotificationsUserRoute: FastifyPluginCallback = (app) => {
  app.get("/notificacoes/user/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string }

      const userNotifications = await db
        .select({
          id: notificacoes.not_id,
          titulo: notificacoes.not_titulo,
          mensagem: notificacoes.not_mensagem,
          tipo: notificacoes.not_tipo,
          lida: notificacoes.not_lida,
          data: notificacoes.not_data,
          usuarioId: notificacoes.usu_id,
        })
        .from(notificacoes)
        .where(eq(notificacoes.usu_id, userId))
        .orderBy(db.desc(notificacoes.not_data))

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
        .set({ not_lida: true })
        .where(eq(notificacoes.not_id, notificationId))

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
        .set({ not_lida: true })
        .where(eq(notificacoes.usu_id, userId))

      reply.send({ message: "Todas as notificações marcadas como lidas" })
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error)
      reply.status(500).send({ message: "Erro ao atualizar notificações" })
    }
  })

  // Route to get notifications for a funcionario (employee)
  app.get("/notificacoes/funcionario/:funcionarioId", async (request, reply) => {
    try {
      const { funcionarioId } = request.params as { funcionarioId: string }

      const funcionarioNotifications = await db
        .select({
          id: notificacoes.not_id,
          titulo: notificacoes.not_titulo,
          mensagem: notificacoes.not_mensagem,
          tipo: notificacoes.not_tipo,
          lida: notificacoes.not_lida,
          data: notificacoes.not_data,
          funcionarioId: notificacoes.fun_id,
        })
        .from(notificacoes)
        .where(eq(notificacoes.fun_id, funcionarioId))
        .orderBy(db.desc(notificacoes.not_data))

      reply.send(funcionarioNotifications)
    } catch (error) {
      console.error("Erro ao buscar notificações do funcionário:", error)
      reply.status(500).send({ message: "Erro ao buscar notificações" })
    }
  })
}
