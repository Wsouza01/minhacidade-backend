import { and, desc, eq, isNotNull } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { administradores } from '../../../db/schema/administradores.js'
import { sacOuvidoria } from '../../../db/schema/sac-ouvidoria.js'
import { usuarios } from '../../../db/schema/usuarios.js'

export const getSacByCidadeRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/sac-ouvidoria/cidade',
    {
      schema: {
        description:
          'Recupera mensagens de SAC/Ouvidoria para a cidade do administrador.',
        tags: ['SAC/Ouvidoria'],
        querystring: z.object({
          adminId: z.string().uuid('ID do administrador inválido'),
        }),
      },
    },
    async (req, reply) => {
      const { adminId } = req.query

      try {
        // 1. Encontrar o administrador e sua cidade
        const [admin] = await db
          .select({ cityId: administradores.cid_id })
          .from(administradores)
          .where(eq(administradores.adm_id, adminId))

        if (!admin || !admin.cityId) {
          // Se não for um admin de cidade, não tem acesso a esta rota
          return reply.status(403).send({
            message:
              'Acesso negado. Rota disponível apenas para administradores de cidade.',
          })
        }

        // 2. Buscar as mensagens da ouvidoria dos usuários daquela cidade
        const mensagens = await db
          .select({
            id: sacOuvidoria.sac_id,
            tipo: sacOuvidoria.sac_tipo,
            descricao: sacOuvidoria.sac_descricao,
            dataCriacao: sacOuvidoria.sac_data_criacao,
            anexoUrl: sacOuvidoria.sac_anexo_url,
            usuario: {
              id: usuarios.usu_id,
              nome: usuarios.usu_nome,
              email: usuarios.usu_email,
            },
          })
          .from(sacOuvidoria)
          .innerJoin(usuarios, eq(sacOuvidoria.usu_id, usuarios.usu_id))
          .where(
            and(
              eq(usuarios.cid_id, admin.cityId),
              isNotNull(sacOuvidoria.usu_id), // Garantir que a mensagem tem um usuário associado
            ),
          )
          .orderBy(desc(sacOuvidoria.sac_data_criacao))

        return reply.status(200).send(mensagens)
      } catch (error) {
        console.error(
          'Erro ao buscar mensagens da ouvidoria por cidade:',
          error,
        )
        return reply.status(500).send({
          message: 'Erro interno ao processar a solicitação.',
        })
      }
    },
  )
}
