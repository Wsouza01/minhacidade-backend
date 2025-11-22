import { and, eq, ne } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { schema } from '../../../db/schema/index.js'

export const designateAttendantRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/admin/funcionarios/:funcionarioId/designate-attendant',
    {
      schema: {
        params: z.object({
          funcionarioId: z.string().uuid(),
        }),
        querystring: z.object({
          adminId: z.string().uuid('ID do administrador inválido'),
        }),
        description:
          'Designa um funcionário como o atendente principal da cidade.',
        tags: ['administradores'],
      },
    },
    async (request, reply) => {
      const { adminId } = request.query
      const { funcionarioId } = request.params

      try {
        // Verificar se o usuário é um admin
        const [admin] = await db
          .select({ cidadeId: schema.administradores.cid_id })
          .from(schema.administradores)
          .where(eq(schema.administradores.adm_id, adminId))

        if (!admin) {
          return reply.status(403).send({ message: 'Acesso negado.' })
        }

        // Encontrar o funcionário a ser promovido e sua cidade
        const [funcionarioParaPromover] = await db
          .select({ cidadeId: schema.funcionarios.cid_id })
          .from(schema.funcionarios)
          .where(eq(schema.funcionarios.fun_id, funcionarioId))

        if (!funcionarioParaPromover || !funcionarioParaPromover.cidadeId) {
          return reply.status(404).send({
            message: 'Funcionário ou cidade do funcionário não encontrados.',
          })
        }

        // Garantir que o admin só pode modificar funcionários da sua própria cidade (se não for admin global)
        if (
          admin.cidadeId &&
          admin.cidadeId !== funcionarioParaPromover.cidadeId
        ) {
          return reply.status(403).send({
            message:
              'Você não tem permissão para modificar funcionários de outra cidade.',
          })
        }

        const cidadeDoFuncionario = funcionarioParaPromover.cidadeId

        // Executar a lógica em uma transação
        await db.transaction(async (tx) => {
          // 1. Rebaixar o atendente atual da cidade (se houver) para servidor
          await tx
            .update(schema.funcionarios)
            .set({ fun_tipo: 'servidor' })
            .where(
              and(
                eq(schema.funcionarios.cid_id, cidadeDoFuncionario),
                eq(schema.funcionarios.fun_tipo, 'atendente'),
                ne(schema.funcionarios.fun_id, funcionarioId), // Não rebaixa o que está sendo promovido
              ),
            )

          // 2. Promover o funcionário escolhido para atendente
          await tx
            .update(schema.funcionarios)
            .set({ fun_tipo: 'atendente' })
            .where(eq(schema.funcionarios.fun_id, funcionarioId))
        })

        return reply.status(200).send({
          message:
            'Funcionário designado como atendente da cidade com sucesso.',
        })
      } catch (error) {
        console.error('Erro ao designar atendente:', error)
        return reply
          .status(500)
          .send({ message: 'Erro interno ao designar atendente.' })
      }
    },
  )
}
