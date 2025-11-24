import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { usuarios } from '../../../db/schema/usuarios.js'

const alterarEmailParamsSchema = z.object({
  usuarioId: z.string().uuid(),
})
const alterarEmailBodySchema = z.object({
  novoEmail: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})
export const alterarEmailRoute = (app) => {
  app.put(
    '/usuarios/:usuarioId/alterar-email',
    {
      schema: {
        params: alterarEmailParamsSchema,
        body: alterarEmailBodySchema,
      },
    },
    async (request, reply) => {
      try {
        const { usuarioId } = request.params
        const { novoEmail, senha } = request.body
        // Buscar o usuário
        const usuario = await db
          .select({
            usu_id: usuarios.usu_id,
            usu_email: usuarios.usu_email,
            usu_senha: usuarios.usu_senha,
          })
          .from(usuarios)
          .where(eq(usuarios.usu_id, usuarioId))
          .limit(1)
        if (usuario.length === 0) {
          return reply.status(404).send({
            message: 'Usuário não encontrado',
          })
        }
        const user = usuario[0]
        // Verificar se a senha está correta
        const senhaValida = await bcrypt.compare(senha, user.usu_senha)
        if (!senhaValida) {
          return reply.status(400).send({
            message: 'Senha incorreta',
          })
        }
        // Verificar se o email já está sendo usado por outro usuário
        const emailExiste = await db
          .select({ usu_id: usuarios.usu_id })
          .from(usuarios)
          .where(eq(usuarios.usu_email, novoEmail))
          .limit(1)
        if (emailExiste.length > 0 && emailExiste[0].usu_id !== usuarioId) {
          return reply.status(400).send({
            message: 'Este email já está sendo usado por outro usuário',
          })
        }
        // Verificar se o novo email é diferente do atual
        if (user.usu_email === novoEmail) {
          return reply.status(400).send({
            message: 'O novo email deve ser diferente do email atual',
          })
        }
        // Atualizar o email no banco de dados
        await db
          .update(usuarios)
          .set({
            usu_email: novoEmail,
          })
          .where(eq(usuarios.usu_id, usuarioId))
        return reply.send({
          message: 'Email alterado com sucesso',
        })
      } catch (error) {
        console.error('Erro ao alterar email:', error)
        return reply.status(500).send({
          message: 'Erro interno no servidor',
        })
      }
    },
  )
}
