import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "@/db/index.ts";
import { chamados } from "@/db/schema/chamados.ts";
import { etapas } from "@/db/schema/etapas.ts";
import { funcionarios } from "@/db/schema/funcionarios.ts";
import { notificacoes } from "@/db/schema/notificacoes.ts";

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
        // Buscar chamado
        const [chamado] = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, id));

        if (!chamado) {
          return reply.status(404).send({ error: "Chamado não encontrado" });
        }

        // Verificar se o responsavel_id existe na tabela de funcionários
        if (responsavel_id) {
          const [funcionario] = await db
            .select()
            .from(funcionarios)
            .where(eq(funcionarios.fun_id, responsavel_id));

          if (!funcionario) {
            return reply
              .status(400)
              .send({ error: "Funcionário não encontrado" });
          }
        }

        // Atualiza o chamado com o novo departamento e prioridade
        await db
          .update(chamados)
          .set({
            cha_departamento,
            cha_prioridade,
            cha_responsavel: responsavel_id || null,
          })
          .where(eq(chamados.cha_id, id));

        // Cria uma nova etapa no histórico
        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: id,
          eta_nome: "Chamado encaminhado",
          eta_descricao: observacao
            ? `Encaminhado com observação: ${observacao}`
            : "Chamado encaminhado para novo departamento.",
          eta_data_inicio: new Date(),
          eta_data_fim: null,
        });

        // Se um servidor foi atribuído, notificar
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

        // Notificar munícipe sobre o encaminhamento
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
