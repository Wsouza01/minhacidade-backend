// getChamadosRoute.ts
import fastify from "fastify";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";

// Extrai a constante após importar o pacote
const { FastifyPluginCallback } = fastify;

export const getChamadosRoute: FastifyPluginCallback = (app) => {
  app.get("/chamados", async (_, reply) => {
    try {
      // Contagem do número de chamados
      const result = await db
        .select(db.fn.count("*").as("total")) // Contagem do total de registros
        .from(schema.chamados)
        .first(); // Retorna o primeiro valor (somente a contagem)

      const totalChamados = result?.total || 0; // Se não encontrar, retorna 0

      reply.send({ total: totalChamados });
    } catch (err) {
      console.error("Erro ao contar chamados:", err);
      reply.status(500).send({ message: "Erro ao contar chamados" });
    }
  });
};
