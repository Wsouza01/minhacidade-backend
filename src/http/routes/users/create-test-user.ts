import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { cidades } from '../../../db/schema/cidades.ts'
import { usuarios } from '../../../db/schema/usuarios.ts'

const createTestUserRequestSchema = z.object({
  cpf: z.string().min(11).max(11),
})

export const createTestUserRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/users/test/:cpf',
    {
      schema: {
        params: createTestUserRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const { cpf } = request.params

        // Verificar se usuário já existe
        const existingUser = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.usu_cpf, cpf))
          .limit(1)

        if (existingUser.length > 0) {
          return reply.send({
            message: 'Usuário já existe',
            user: {
              usu_id: existingUser[0].usu_id,
              usu_nome: existingUser[0].usu_nome,
              usu_email: existingUser[0].usu_email,
              usu_cpf: existingUser[0].usu_cpf,
            },
          })
        }

        // Buscar primeira cidade disponível
        const cidade = await db.select().from(cidades).limit(1)

        if (cidade.length === 0) {
          return reply.status(404).send({ error: 'Nenhuma cidade encontrada' })
        }

        // Criar usuário de teste
        const novoUsuario = await db
          .insert(usuarios)
          .values({
            usu_nome: 'Usuário Teste',
            usu_email: `teste${cpf}@email.com`,
            usu_cpf: cpf,
            usu_data_nascimento: new Date('1990-01-01'),
            usu_login: `user${cpf}`,
            usu_senha: '123456', // Em produção, isso deveria ser hasheado
            usu_tipo: 'municipe',
            usu_ativo: true,
            usu_endereco: {
              logradouro: 'Rua Teste',
              numero: '123',
              bairro: 'Centro',
              cep: '12345-678',
              cidade: cidade[0].cid_nome,
              estado: 'SP',
            },
            cid_id: cidade[0].cid_id,
          })
          .returning()

        console.log('✅ Usuário de teste criado:', novoUsuario[0])

        reply.send({
          message: 'Usuário de teste criado com sucesso',
          user: {
            usu_id: novoUsuario[0].usu_id,
            usu_nome: novoUsuario[0].usu_nome,
            usu_email: novoUsuario[0].usu_email,
            usu_cpf: novoUsuario[0].usu_cpf,
          },
        })
      } catch (error) {
        console.error('Erro ao criar usuário de teste:', error)
        reply.status(500).send({ message: 'Erro ao criar usuário de teste' })
      }
    },
  )
}
