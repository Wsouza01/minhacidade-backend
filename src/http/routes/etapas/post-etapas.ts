// postEtapasRoute.ts

import { eq } from "drizzle-orm";
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { schema } from "../../../db/schema/index.ts";
import { notificacoes } from "../../../db/schema/notificacoes.ts";

export const postEtapasRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/etapas",
    {
      schema: {
        body: z.object({
          nome: z.string(),
          descricao: z.string(),
          data_inicio: z.string().datetime(),
          data_fim: z.string().datetime(),
          chamado_id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { nome, descricao, data_inicio, data_fim, chamado_id } =
        request.body;

      await db.insert(schema.etapas).values({
        eta_nome: nome,
        eta_descricao: descricao,
        eta_data_inicio: data_inicio, // String ISO
        eta_data_fim: data_fim, // String ISO
        cha_id: chamado_id,
      });

      // Buscar o chamado para obter o usuário
      try {
        const chamado = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, chamado_id))
          .limit(1);

        if (chamado.length > 0 && chamado[0].usu_id) {
          // Criar notificação para o usuário
          await db.insert(notificacoes).values({
            not_titulo: "Atualização no seu chamado",
            not_mensagem: `Nova etapa adicionada: "${nome}". ${descricao}`,
            not_tipo: "info",
            not_lida: false,
            cha_id: chamado_id,
            usu_id: chamado[0].usu_id,
          });
          console.log("✅ Notificação criada para atualização de etapa");
        }
      } catch (notifError) {
        console.error("❌ Erro ao criar notificação de etapa:", notifError);
      }

      reply.status(201).send({ message: "Etapa criada" });
    }
  );
};
