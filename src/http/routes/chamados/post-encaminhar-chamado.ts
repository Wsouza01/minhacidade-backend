import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../../../db/connection.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { etapas } from "../../../db/schema/etapas.ts";
import { notificacoes } from "../../../db/schema/notificacoes.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const postEncaminharChamado: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/chamados/:id/encaminhar",
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          cha_departamento: z.string().uuid(),
          cha_prioridade: z.enum(["Alta", "Média", "Baixa"]),
          responsavel_id: z.string().uuid().optional(),
          observacao: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params;
      const { cha_departamento, cha_prioridade, responsavel_id, observacao } =
        req.body;

      try {
        // Verificar se o chamado existe
        const [chamado] = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, id));

        if (!chamado) {
          return reply.status(404).send({ error: "Chamado não encontrado" });
        }

        // Atualizar o chamado com novo departamento e prioridade
        await db
          .update(chamados)
          .set({
            cha_departamento,
            cha_prioridade,
            cha_responsavel: responsavel_id || null,
          })
          .where(eq(chamados.cha_id, id));

        // Inserir etapa de encaminhamento
        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: id,
          eta_nome: "Chamado encaminhado",
          eta_descricao: observacao || null, // Garantir que não seja undefined
          eta_data_inicio: new Date(),
          eta_data_fim: null,
        });

        // Notificar servidor e usuário sobre o encaminhamento
        if (responsavel_id) {
          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: "Novo chamado atribuído",
            not_mensagem: observacao
              ? `Você foi atribuído ao chamado #${id.slice(
                  0,
                  8
                )}. Observação: ${observacao}`
              : `Você foi atribuído ao chamado #${id.slice(0, 8)}.`,
            not_tipo: "info",
            not_lida: false,
            not_data: new Date(),
            usu_id: null,
            fun_id: responsavel_id,
          });
        }

        // Notificar o munícipe sobre o encaminhamento
        if (chamado.usu_id) {
          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: "Chamado encaminhado",
            not_mensagem: observacao
              ? `Seu chamado foi encaminhado para análise. ${observacao}`
              : "Seu chamado foi encaminhado para o departamento responsável.",
            not_tipo: "info",
            not_lida: false,
            not_data: new Date(),
            usu_id: chamado.usu_id,
            fun_id: null,
          });
        }

        return reply
          .status(200)
          .send({ message: "Chamado encaminhado com sucesso" });
      } catch (error) {
        console.error("[POST /encaminhar] Erro:", error);
        return reply.status(500).send({
          error: "Erro ao encaminhar chamado",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
};
