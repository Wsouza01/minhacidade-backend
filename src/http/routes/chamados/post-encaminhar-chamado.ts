import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "@/db";
import { chamados } from "@/db/schema/chamados";
import { etapas } from "@/db/schema/etapas";
import { funcionarios } from "@/db/schema/funcionarios";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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
