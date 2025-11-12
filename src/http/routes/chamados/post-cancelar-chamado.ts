import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { chamados } from '../../../db/schema/chamados.ts'
import { etapas } from '../../../db/schema/etapas.ts'
import { funcionarios } from '../../../db/schema/funcionarios.ts'
import { notificacoes } from '../../../db/schema/notificacoes.ts'
import { env } from '../../../env.ts'

export const postCancelarChamado: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/chamados/:id/cancelar',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          motivo: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params
      const { motivo = 'Chamado cancelado pela atendente' } = req.body

      try {
        // Buscar chamado
        const [chamado] = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, id))

        if (!chamado) {
          return reply.status(404).send({
            error: 'Chamado não encontrado',
          })
        }

        // Buscar atendente que está cancelando (se atribuído)
        let _atendenteNome = 'Sistema'
        if (chamado.cha_responsavel) {
          const [responsavel] = await db
            .select()
            .from(funcionarios)
            .where(eq(funcionarios.fun_id, chamado.cha_responsavel))

          if (responsavel) {
            _atendenteNome = responsavel.fun_nome
          }
        }

        // Cancelar o chamado
        const dataCancelamento = new Date()
        await db
          .update(chamados)
          .set({
            cha_status: 'Cancelado',
            cha_data_fechamento: dataCancelamento,
          })
          .where(eq(chamados.cha_id, id))

        // Criar etapa no histórico
        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: id,
          eta_nome: 'Chamado cancelado',
          eta_descricao: motivo,
          eta_data_inicio: dataCancelamento,
          eta_data_fim: dataCancelamento,
        })

        // Notificar munícipe (solicitante) sobre cancelamento
        if (chamado.usu_id) {
          const chamadoUrl = `${env.FRONTEND_URL}/chamado/${chamado.cha_id}`

          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: 'Chamado cancelado',
            not_mensagem: `Seu chamado foi cancelado. Motivo: ${motivo}`,
            not_tipo: 'warning',
            not_lida: false,
            not_data: dataCancelamento,
            not_link: chamadoUrl,
            cha_id: id,
            usu_id: chamado.usu_id,
            fun_id: null,
          })
        }

        // Notificar servidor responsável (se houver)
        if (chamado.cha_responsavel) {
          const chamadoUrl = `${env.FRONTEND_URL}/chamado/${chamado.cha_id}`

          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: 'Chamado cancelado',
            not_mensagem: `O chamado atribuído a você foi cancelado. Motivo: ${motivo}`,
            not_tipo: 'warning',
            not_lida: false,
            not_data: dataCancelamento,
            not_link: chamadoUrl,
            cha_id: id,
            usu_id: null,
            fun_id: chamado.cha_responsavel,
          })
        }

        return reply.status(200).send({
          message: 'Chamado cancelado com sucesso',
          chamado: {
            id: chamado.cha_id,
            status: 'Cancelado',
            dataCancelamento,
          },
        })
      } catch (error) {
        console.error('[POST /cancelar] Erro:', error)
        return reply.status(500).send({
          error: 'Erro ao cancelar chamado',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )
}
