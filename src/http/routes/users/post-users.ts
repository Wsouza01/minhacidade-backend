import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { schema } from "../../../db/schema/index.ts";
import { z } from "zod";

export const postUsersRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/users",
    {
      schema: {
        body: z.object({
          nome: z.string().min(1, "Nome é obrigatório"),
          cpf: z.string().min(11).max(14),
          email: z.string().email(),
          senha: z.string().min(6),
          criado_em: z.string().datetime(), // ajustar conforme o tipo da coluna
        }),
      },
    },
    async (request, reply) => {
      const { nome, cpf, email, senha, criado_em } = request.body as {
        nome: string;
        cpf: string;
        email: string;
        senha: string;
        criado_em: string;
      };

      await db.insert(schema.usuarios).values({
        usu_nome: nome,
        usu_cpf: cpf,
        usu_email: email,
        usu_senha: senha,
        usu_criado: criado_em,
      });

      reply.status(201).send({ message: "Usuário criado com sucesso" });
    }
  );
};
