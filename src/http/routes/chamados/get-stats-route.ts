// src/routes/getStatsRoute.ts
import { and, isNotNull, isNull } from "drizzle-orm";
import fastify from "fastify";
import { db } from "../../../db/connection.ts";
import { chamados } from "../../../db/schema/chamados.ts";

const { FastifyPluginCallback } = fastify;

export const getStatsRoute: FastifyPluginCallback = (app) => {
  app.get("/chamados/stats", async (_, reply) => {
    try {
      const [total, resolvidos, pendentes, emAndamento] = await Promise.all([
        db.$count(chamados),
        // Contagem de chamados fechados
        db.$count(chamados, isNotNull(chamados.cha_data_fechamento)),
        // Contagem de chamados abertos sem responsável
        db.$count(
          chamados,
          and(
            isNull(chamados.cha_data_fechamento),
            isNull(chamados.cha_responsavel)
          )
        ),
        // Contagem de chamados em andamento (abertos com responsável)
        db.$count(
          chamados,
          and(
            isNull(chamados.cha_data_fechamento),
            isNotNull(chamados.cha_responsavel)
          )
        ),
      ]);

      return reply.send({ total, resolvidos, pendentes, emAndamento });
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
      return reply.status(500).send({ message: "Erro ao buscar estatísticas" });
    }
  });
};
