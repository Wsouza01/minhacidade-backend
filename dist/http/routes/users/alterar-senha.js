import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { usuarios } from '../../../db/schema/usuarios.js'

// Definindo as validações do esquema
const alterarSenhaParamsSchema = z.object({
  usuarioId: z.string().uuid(), // O ID do usuário vem do token JWT ou sessão
})
const alterarSenhaBodySchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
})
export const alterarSenhaRoute = (app) => {
  app.put(
    '/usuarios/:usuarioId/alterar-senha', // A rota para alterar a senha
    {
      schema: {
        params: alterarSenhaParamsSchema, // Validação do ID do usuário
        body: alterarSenhaBodySchema, // Validação das senhas
      },
    },
    async (request, reply) => {
      try {
        const { usuarioId } = request.params // ID do usuário
        const { senhaAtual, novaSenha } = request.body // Senhas fornecidas pelo usuário
        // Buscar o usuário no banco de dados
        const usuario = await db
          .select({
            usu_id: usuarios.usu_id,
            usu_senha: usuarios.usu_senha, // A senha criptografada
          })
          .from(usuarios)
          .where(eq(usuarios.usu_id, usuarioId)) // Verifica pelo ID do usuário
          .limit(1)
        if (usuario.length === 0) {
          return reply.status(404).send({
            message: 'Usuário não encontrado',
          })
        }
        const user = usuario[0]
        // Verificar se a senha atual está correta
        const senhaValida = await bcrypt.compare(senhaAtual, user.usu_senha)
        if (!senhaValida) {
          return reply.status(400).send({
            message: 'Senha atual incorreta',
          })
        }
        // Verificar se a nova senha é diferente da atual
        const mesmaSenha = await bcrypt.compare(novaSenha, user.usu_senha)
        if (mesmaSenha) {
          return reply.status(400).send({
            message: 'A nova senha deve ser diferente da senha atual',
          })
        }
        // Criptografar a nova senha
        const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10)
        // Atualizar a senha no banco de dados
        await db
          .update(usuarios)
          .set({
            usu_senha: novaSenhaCriptografada, // Atualiza a senha do usuário
          })
          .where(eq(usuarios.usu_id, usuarioId)) // Verifica pelo ID do usuário
        return reply.send({
          message: 'Senha alterada com sucesso', // Resposta positiva
        })
      } catch (error) {
        console.error('Erro ao alterar senha:', error)
        return reply.status(500).send({
          message: 'Erro interno no servidor',
        })
      }
    },
  )
}
