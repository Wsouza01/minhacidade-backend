import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/connection.ts";
import { notificacoes } from "../../../db/schema/notificacoes.ts";

const postNotificationBodySchema = z.object({
  usu_id: z.string().uuid(),
  not_titulo: z.string().optional(),
  not_mensagem: z.string(),
  not_tipo: z.string().optional(),
  cha_id: z.string().uuid().optional(),
});

export const postNotificationRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/notifications",
    {
      schema: {
        body: postNotificationBodySchema,
      },
    },
    async (request, reply) => {
      try {
        const { usu_id, not_mensagem, cha_id } = request.body;

        console.log('📬 Criando notificação para usuário:', usu_id);

        // Inserir notificação no banco
        const novaNotificacao = await db
          .insert(notificacoes)
          .values({
            usu_id: usu_id,
            ntf_mensagem: not_mensagem,
            ntf_canal: 'app',
            ntf_lida: 'false',
            cha_id: cha_id || null,
          })
          .returning();

        console.log('✅ Notificação criada:', novaNotificacao[0].ntf_id);

        reply.status(201).send({
          message: "Notificação criada com sucesso",
          notificacao: novaNotificacao[0],
        });
      } catch (error) {
        console.error("❌ Erro ao criar notificação:", error);
        reply.status(500).send({
          message: "Erro ao criar notificação",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }
  );
};
