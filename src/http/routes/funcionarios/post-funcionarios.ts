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
          data_nascimento: z.string(),
          login: z.string(),
          senha: z.string().min(6),
          departamento_id: z.string().uuid(),
          matricula: z.string().min(3), // 👈 aqui
          tipo: z.enum(["atendente", "servidor"]),
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
        matricula,
        tipo,
      } = request.body

      // Assumindo que seu schema do banco de dados `funcionarios`
      // também tem as colunas `fun_matricula` e `fun_tipo`.
      await db.insert(schema.funcionarios).values({
        fun_nome: nome,
        fun_email: email,
        fun_cpf: cpf,
        fun_data_nascimento: data_nascimento,
        fun_login: login,
        fun_senha: senha,
        fun_matricula: matricula, // agora existe
        fun_tipo: tipo,
        dep_id: departamento_id,
      })

      return reply.status(201).send({ message: "Funcionário criado" })
    }
  )
}
