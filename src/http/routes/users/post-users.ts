import type { FastifyPluginCallback } from "fastify";
import { db } from "../../../db/connection.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";
import { z } from "zod";

export const postUsersRoute: FastifyPluginCallback = (app) => {
  app.post(
    "/users",
    {
      schema: {
        body: z.object({
          nome: z.string().min(1, "Nome é obrigatório"),
          cpf: z.string().min(11).max(14),
          email: z.string().email(),
          senha: z.string().min(6),
          login: z.string().min(3, "Login é obrigatório"),
          data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato deve ser YYYY-MM-DD"),
          // Removido criado_em - será preenchido automaticamente
        }),
      },
    },
    async (request, reply) => {
      const { nome, cpf, email, senha, login, data_nascimento } = request.body as {
        nome: string;
        cpf: string;
        email: string;
        senha: string;
        login: string;
        data_nascimento: string;
      };

      await db.insert(usuarios).values({
        usu_nome: nome,
        usu_cpf: cpf,
        usu_email: email,
        usu_senha: senha,
        usu_login: login,
        usu_data_nascimento: data_nascimento, // String no formato "YYYY-MM-DD"
        // usu_criado será preenchido automaticamente pelo .defaultNow()
      });

      return reply.status(201).send({ message: "Usuário criado com sucesso" });
    }
  );
};