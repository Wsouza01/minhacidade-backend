import { compare, hash } from 'bcrypt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { funcionarios } from '../../../db/schema/funcionarios.js'
export const alterarSenhaServidorRoute = (app) => {
  app.put(
    '/servidores/:servidorId/alterar-senha',
    {
      schema: {
        params: z.object({
          servidorId: z.string().uuid(),
        }),
        body: z.object({
          senhaAtual: z.string(),
          novaSenha: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { servidorId } = request.params
        const { senhaAtual, novaSenha } = request.body
        const [servidor] = await db
          .select()
          .from(funcionarios)
          .where(eq(funcionarios.fun_id, servidorId))
        if (!servidor) {
          return reply.status(404).send({ message: 'Servidor não encontrado' })
        }
        const isPasswordCorrect = await compare(senhaAtual, servidor.fun_senha)
        if (!isPasswordCorrect) {
          return reply.status(401).send({ message: 'Senha atual incorreta' })
        }
        const hashedNovaSenha = await hash(novaSenha, 10)
        await db
          .update(funcionarios)
          .set({ fun_senha: hashedNovaSenha })
          .where(eq(funcionarios.fun_id, servidorId))
        return reply.status(204).send()
      } catch (err) {
        console.error('Erro ao alterar senha do servidor:', err)
        reply.status(500).send({ message: 'Erro ao alterar senha do servidor' })
      }
    },
  )
}
