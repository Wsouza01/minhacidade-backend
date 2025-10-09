import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { schema } from "../../../db/schema/index.ts"

export const postFuncionariosRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/funcionarios",
    {
      schema: {
        body: z.object({
          nome: z.string(),
          email: z.string().email(),
          cpf: z.string().min(11),
          data_nascimento: z.string().date(),
          login: z.string(),
          senha: z.string().min(6),
          departamento_id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const {
        nome,
        email,
        cpf,
        data_nascimento,
        login,
        senha,
        departamento_id,
      } = request.body

      await db.insert(schema.funcionarios).values({
        fun_nome: nome,
        fun_email: email,
        fun_cpf: cpf,
        fun_data_nascimento: data_nascimento, // String, não Date
        fun_login: login,
        fun_senha: senha,
        dep_id: departamento_id,
      })

      reply.status(201).send({ message: "Funcionário criado" })
    }
  )
}
