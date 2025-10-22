import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { schema } from "../../../db/schema/index.ts"
import { eq } from "drizzle-orm"
import { hash } from "bcryptjs"

export const putFuncionariosRoute: FastifyPluginCallbackZod = (app) => {
  app.put(
    "/funcionarios/:id",
    {
      schema: {
        params: z.object({
          id: z.string().uuid("ID inválido"),
        }),
        body: z.object({
          nome: z.string().optional(),
          email: z.string().email().optional(),
          cpf: z.string().min(11).optional(),
          dataNascimento: z.string().optional(),
          matricula: z.string().optional(),
          tipo: z.enum(["atendente", "servidor"]).optional(),
          senha: z.string().min(6).optional(),
          departamentoId: z.string().uuid().nullable().optional(),
          cidadeId: z.string().uuid().nullable().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const {
        nome,
        email,
        cpf,
        dataNascimento,
        matricula,
        tipo,
        senha,
        departamentoId,
        cidadeId,
      } = request.body

      // Verifica se funcionário existe
      const funcionario = await db
        .select()
        .from(schema.funcionarios)
        .where(eq(schema.funcionarios.fun_id, id))
        .limit(1)

      if (funcionario.length === 0) {
        return reply.status(404).send({
          message: "Funcionário não encontrado",
        })
      }

      // Prepara dados para atualizar
      const updateData: any = {}

      if (nome !== undefined) updateData.fun_nome = nome
      if (email !== undefined) updateData.fun_email = email
      if (cpf !== undefined) updateData.fun_cpf = cpf
      if (dataNascimento !== undefined)
        updateData.fun_data_nascimento = new Date(dataNascimento)
      if (matricula !== undefined) updateData.fun_matricula = matricula
      if (tipo !== undefined) updateData.fun_tipo = tipo
      if (departamentoId !== undefined) updateData.dep_id = departamentoId
      if (cidadeId !== undefined) updateData.cid_id = cidadeId

      // Se houver senha, faz hash
      if (senha !== undefined) {
        const senhaHash = await hash(senha, 10)
        updateData.fun_senha = senhaHash
      }

      // Atualiza funcionário
      await db
        .update(schema.funcionarios)
        .set(updateData)
        .where(eq(schema.funcionarios.fun_id, id))

      return reply.status(200).send({
        message: "Funcionário atualizado com sucesso",
      })
    }
  )
}
