import { desc, eq } from 'drizzle-orm'
import { db } from '../../../db/index.js'
import { notificacoes } from '../../../db/schema/notificacoes.js'
export const getNotificationsUserRoute = (app) => {
  app.get('/notificacoes/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params
      const userNotifications = await db
        .select({
          id: notificacoes.not_id,
          titulo: notificacoes.not_titulo,
          mensagem: notificacoes.not_mensagem,
          tipo: notificacoes.not_tipo,
          lida: notificacoes.not_lida,
          data: notificacoes.not_data,
          usuarioId: notificacoes.usu_id,
          cha_id: notificacoes.cha_id,
        })
        .from(notificacoes)
        .where(eq(notificacoes.usu_id, userId))
        .orderBy(desc(notificacoes.not_data))
      reply.send(userNotifications)
    } catch (error) {
      console.error('Erro ao buscar notificações do usuário:', error)
      reply.status(500).send({ message: 'Erro ao buscar notificações' })
    }
  })
  // Route to mark notification as read
  app.patch('/notificacoes/:notificationId/read', async (request, reply) => {
    try {
      const { notificationId } = request.params
      console.log('[NOTIFICACAO] Marcando como lida:', notificationId)
      await db
        .update(notificacoes)
        .set({ not_lida: false })
        .where(eq(notificacoes.not_id, notificationId))
      reply.send({ message: 'Notificação marcada como lida' })
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
      reply.status(500).send({ message: 'Erro ao atualizar notificação' })
    }
  })
  // Route to mark all notifications as read for a user
  app.patch('/notificacoes/user/:userId/read-all', async (request, reply) => {
    try {
      const { userId } = request.params
      await db
        .update(notificacoes)
        .set({ not_lida: false })
        .where(eq(notificacoes.usu_id, userId))
      reply.send({ message: 'Todas as notificações marcadas como lidas' })
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      reply.status(500).send({ message: 'Erro ao atualizar notificações' })
    }
  })
  // Route to get notifications for a funcionario (employee)
  app.get(
    '/notificacoes/funcionario/:funcionarioId',
    async (request, reply) => {
      try {
        const { funcionarioId } = request.params
        console.log(
          '[NOTIFICACOES] Buscando notificações para funcionário:',
          funcionarioId,
        )
        const funcionarioNotifications = await db
          .select({
            id: notificacoes.not_id,
            titulo: notificacoes.not_titulo,
            mensagem: notificacoes.not_mensagem,
            tipo: notificacoes.not_tipo,
            lida: notificacoes.not_lida,
            data: notificacoes.not_data,
            link: notificacoes.not_link,
            funcionarioId: notificacoes.fun_id,
            cha_id: notificacoes.cha_id,
          })
          .from(notificacoes)
          .where(eq(notificacoes.fun_id, funcionarioId))
          .orderBy(desc(notificacoes.not_data))
        console.log(
          '[NOTIFICACOES] Notificações encontradas:',
          funcionarioNotifications.length,
        )
        console.log(
          '[NOTIFICACOES] Dados:',
          JSON.stringify(funcionarioNotifications, null, 2),
        )
        reply.send(funcionarioNotifications)
      } catch (error) {
        console.error('Erro ao buscar notificações do funcionário:', error)
        reply.status(500).send({ message: 'Erro ao buscar notificações' })
      }
    },
  )
}
