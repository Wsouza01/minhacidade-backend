import type { FastifyPluginCallback } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../../../db/connection.ts";
import { notificacoes } from "../../../db/schema/notificacoes.ts";

export const getNotificacoesRoute: FastifyPluginCallback = (app) => {
  // Buscar notificações por usuário
  app.get("/notificacoes/user/:userId", async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

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
        .orderBy(desc(notificacoes.not_data)); // Ordenar por data (decrescente)

      reply.send(userNotifications);
    } catch (error) {
      console.error("Erro ao buscar notificações do usuário:", error);
      reply.status(500).send({ message: "Erro ao buscar notificações" });
    }
  });

  // Buscar notificações por funcionário
  app.get(
    "/notificacoes/funcionario/:funcionarioId",
    async (request, reply) => {
      try {
        const { funcionarioId } = request.params as { funcionarioId: string };

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
          .orderBy(desc(notificacoes.not_data)); // Ordenar por data (decrescente)

        reply.send(funcionarioNotifications);
      } catch (error) {
        console.error("Erro ao buscar notificações do funcionário:", error);
        reply.status(500).send({ message: "Erro ao buscar notificações" });
      }
    }
  );
};
