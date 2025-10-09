import bcrypt from "bcrypt"
import { eq } from "drizzle-orm"
import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { usuarios } from "../../../db/schema/usuarios.ts"

const alterarSenhaParamsSchema = z.object({
  usuarioId: z.string().uuid(),
})

const alterarSenhaBodySchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
})

export const alterarSenhaRoute: FastifyPluginCallbackZod = (app) => {
  app.put(
    "/usuarios/:usuarioId/alterar-senha",
    {
      schema: {
        params: alterarSenhaParamsSchema,
        body: alterarSenhaBodySchema,
      },
    },
    async (request, reply) => {
      try {
        const { usuarioId } = request.params
        const { senhaAtual, novaSenha } = request.body

        // Buscar o usuário
        const usuario = await db
          .select({
            usu_id: usuarios.usu_id,
            usu_senha: usuarios.usu_senha,
          })
          .from(usuarios)
          .where(eq(usuarios.usu_id, usuarioId))
          .limit(1)

        if (usuario.length === 0) {
          return reply.status(404).send({
            message: "Usuário não encontrado",
          })
        }

        const user = usuario[0]

        // Verificar se a senha atual está correta
        const senhaValida = await bcrypt.compare(senhaAtual, user.usu_senha)
        if (!senhaValida) {
          return reply.status(400).send({
            message: "Senha atual incorreta",
          })
        }

        // Verificar se a nova senha é diferente da atual
        const mesmaSeha = await bcrypt.compare(novaSenha, user.usu_senha)
        if (mesmaSeha) {
          return reply.status(400).send({
            message: "A nova senha deve ser diferente da senha atual",
          })
        }

        // Criptografar a nova senha
        const saltRounds = 10
        const novaSenhaCriptografada = await bcrypt.hash(novaSenha, saltRounds)

        // Atualizar a senha no banco de dados
        await db
          .update(usuarios)
          .set({
            usu_senha: novaSenhaCriptografada,
          })
          .where(eq(usuarios.usu_id, usuarioId))

        return reply.send({
          message: "Senha alterada com sucesso",
        })
      } catch (error) {
        console.error("Erro ao alterar senha:", error)
        return reply.status(500).send({
          message: "Erro interno no servidor",
        })
      }
    }
  )
}
