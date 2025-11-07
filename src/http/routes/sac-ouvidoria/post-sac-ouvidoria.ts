import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../../db/connection.ts'
import { sacOuvidoria } from '../../../db/schema/sac-ouvidoria.ts'
import { usuarios } from '../../../db/schema/usuarios.ts'

export const postSacOuvidoriaRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/sac-ouvidoria',
    {
      schema: {
        description: 'Registrar uma nova reclamação/sugestão de SAC/Ouvidoria',
        tags: ['SAC/Ouvidoria'],
        body: z.object({
          tipo: z.enum(['Elogio', 'Reclamação', 'Solicitação', 'Sugestão']),
          descricao: z
            .string()
            .min(10, 'A descrição deve ter pelo menos 10 caracteres')
            .max(1000, 'A descrição não pode ter mais de 1000 caracteres'),
          usuario_id: z.string().uuid('ID do usuário inválido'),
          anexo_url: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { tipo, descricao, usuario_id, anexo_url } = request.body

      try {
        console.log('📥 Recebendo registro SAC/Ouvidoria:', { tipo, usuario_id })

        // Verificar se o usuário existe
        const userExists = await db
          .select({ usu_id: usuarios.usu_id })
          .from(usuarios)
          .where(eq(usuarios.usu_id, usuario_id))

        if (!userExists || userExists.length === 0) {
          console.log('❌ Usuário não encontrado:', usuario_id)
          return reply.status(404).send({
            error: 'Usuário não encontrado',
          })
        }

        console.log('✅ Usuário encontrado, criando registro...')

        // Criar registro de SAC/Ouvidoria
        const result = await db
          .insert(sacOuvidoria)
          .values({
            sac_tipo: tipo,
            sac_descricao: descricao,
            sac_anexo_url: anexo_url || null,
            usu_id: usuario_id,
          })
          .returning()

        const sacRecord = result[0]

        console.log('✅ Registro criado com sucesso:', sacRecord.sac_id)

        return reply.status(201).send({
          sac_id: sacRecord.sac_id,
          sac_tipo: sacRecord.sac_tipo,
          sac_descricao: sacRecord.sac_descricao,
          sac_anexo_url: sacRecord.sac_anexo_url,
          usu_id: sacRecord.usu_id,
          sac_data_criacao: sacRecord.sac_data_criacao?.toISOString() ?? '',
          message: 'Registro de SAC/Ouvidoria criado com sucesso',
        })
      } catch (error) {
        console.error('❌ Erro ao criar registro de SAC/Ouvidoria:', error)
        return reply.status(500).send({
          error: 'Erro ao criar registro',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        })
      }
    }
  )
}
