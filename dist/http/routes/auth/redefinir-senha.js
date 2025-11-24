import bcrypt from 'bcryptjs'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { funcionarios } from '../../../db/schema/funcionarios.js'
import { tokensRecuperacao } from '../../../db/schema/tokens-recuperacao.js'
import { usuarios } from '../../../db/schema/usuarios.js'
export async function redefinirSenhaRoute(app) {
  app.withTypeProvider().post(
    '/auth/redefinir-senha',
    {
      schema: {
        tags: ['auth'],
        summary: 'Redefinir senha com token',
        body: z.object({
          token: z.string().min(1, 'Token é obrigatório'),
          novaSenha: z
            .string()
            .min(6, 'A senha deve ter no mínimo 6 caracteres')
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              'A senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial',
            ),
        }),
        response: {
          200: z.object({
            message: z.string(),
            senhaAlterada: z.boolean(),
          }),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { token, novaSenha } = request.body
      try {
        // Buscar token válido
        const tokenEncontrado = await db
          .select()
          .from(tokensRecuperacao)
          .where(
            and(
              eq(tokensRecuperacao.tok_token, token),
              isNull(tokensRecuperacao.tok_usado), // Não foi usado ainda
              gt(tokensRecuperacao.tok_expira_em, new Date()),
            ),
          )
          .limit(1)
        if (tokenEncontrado.length === 0) {
          return reply.status(400).send({
            message: 'Token inválido ou expirado',
          })
        }
        const tokenValido = tokenEncontrado[0]
        // Hash da nova senha
        const senhaHash = await bcrypt.hash(novaSenha, 10)
        // Atualizar senha baseado no tipo de usuário
        if (tokenValido.tok_tipo_usuario === 'usuario') {
          // Atualizar senha do usuário
          const resultado = await db
            .update(usuarios)
            .set({
              usu_senha: senhaHash,
            })
            .where(eq(usuarios.usu_email, tokenValido.tok_email))
          if (resultado.length === 0) {
            return reply.status(404).send({
              message: 'Usuário não encontrado',
            })
          }
        } else if (tokenValido.tok_tipo_usuario === 'funcionario') {
          // Atualizar senha do funcionário
          const resultado = await db
            .update(funcionarios)
            .set({
              fun_senha: senhaHash,
            })
            .where(eq(funcionarios.fun_email, tokenValido.tok_email))
          if (resultado.length === 0) {
            return reply.status(404).send({
              message: 'Funcionário não encontrado',
            })
          }
        }
        // Marcar token como usado
        await db
          .update(tokensRecuperacao)
          .set({
            tok_usado: new Date(),
          })
          .where(eq(tokensRecuperacao.tok_id, tokenValido.tok_id))
        return reply.status(200).send({
          message: 'Senha redefinida com sucesso!',
          senhaAlterada: true,
        })
      } catch (error) {
        console.error('[REDEFINIR-SENHA] Erro:', error)
        return reply.status(500).send({
          message: 'Erro ao redefinir senha',
        })
      }
    },
  )
}
