import { eq } from 'drizzle-orm'
import z from 'zod'
import { db } from '../../../db/index.js'
import { notificacoes } from '../../../db/schema/notificacoes.js'
export const deleteNotificationRoute = async (app) => {
  app.delete(
    '/notificacoes/:notificationId',
    {
      schema: {
        params: z.object({
          notificationId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { notificationId } = request.params
        const [deletedNotification] = await db
          .delete(notificacoes)
          .where(eq(notificacoes.not_id, notificationId))
          .returning()
        if (!deletedNotification) {
          return reply
            .status(404)
            .send({ message: 'Notificação não encontrada' })
        }
        return reply
          .status(200)
          .send({ message: 'Notificação excluída com sucesso' })
      } catch (error) {
        console.error('Erro ao excluir notificação:', error)
        return reply
          .status(500)
          .send({ message: 'Erro interno ao excluir notificação' })
      }
    },
  )
}
