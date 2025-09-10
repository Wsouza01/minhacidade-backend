// src/routes/getChamadosUserRoute.ts
import fastify from "fastify";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";

const { FastifyPluginCallback } = fastify;

export const getChamadosUserRoute: FastifyPluginCallback = (app) => {
  app.get("/chamados/user/:usuarioId", async (request, reply) => {
    const { usuarioId } = request.params as { usuarioId: string };
    const chamados = await db
      .select({
        id: schema.chamados.cha_id,
        nome: schema.chamados.cha_nome,
        departamento: schema.chamados.cha_departamento,
        status: schema.chamados.cha_data_fechamento, // ajuste conforme seu status
        mensagem: schema.chamados.cha_descricao,
        dataCriacao: schema.chamados.cha_data_abertura,
        prioridade: schema.chamados.cha_prioridade,
        protocolo: schema.chamados.cha_protocolo,
      })
      .from(schema.chamados)
      .where(schema.chamados.usu_id.eq(usuarioId));
    reply.send(chamados);
  });
};
