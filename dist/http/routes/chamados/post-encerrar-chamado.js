import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { chamados } from '../../../db/schema/chamados.js'
import { etapas } from '../../../db/schema/etapas.js'
import { funcionarios } from '../../../db/schema/funcionarios.js'
import { notificacoes } from '../../../db/schema/notificacoes.js'
export const postEncerrarChamado = async (app) => {
  app.post(
    '/chamados/:id/encerrar',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          atendenteId: z.string().uuid(),
          observacaoFinal: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params
      const { atendenteId, observacaoFinal } = req.body
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
        // Verificar se já está encerrado
        if (chamado.cha_status === 'Encerrado') {
          return reply.status(400).send({
            error: 'Chamado já está encerrado',
          })
        }
        // Buscar atendente
        const [atendente] = await db
          .select()
          .from(funcionarios)
          .where(eq(funcionarios.fun_id, atendenteId))
        if (!atendente) {
          return reply.status(404).send({
            error: 'Atendente não encontrado',
          })
        }
        // Atualizar status para Encerrado
        const dataEncerramento = new Date()
        await db
          .update(chamados)
          .set({
            cha_status: 'Encerrado',
            cha_data_fechamento: dataEncerramento,
          })
          .where(eq(chamados.cha_id, id))
        // Criar etapa final no histórico
        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: id,
          eta_nome: 'Chamado encerrado',
          eta_descricao: observacaoFinal
            ? `Atendente ${atendente.fun_nome} encerrou o chamado. Observação: ${observacaoFinal}`
            : `Atendente ${atendente.fun_nome} encerrou o chamado.`,
          eta_data_inicio: dataEncerramento,
          eta_data_fim: dataEncerramento,
        })
        // Notificar munícipe (solicitante)
        if (chamado.usu_id) {
          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: 'Chamado encerrado',
            not_mensagem: observacaoFinal
              ? `Seu chamado foi encerrado. ${observacaoFinal}`
              : 'Seu chamado foi encerrado pela equipe de atendimento.',
            not_tipo: 'success',
            not_lida: false,
            not_data: new Date(),
            usu_id: chamado.usu_id,
            fun_id: null,
          })
        }
        return reply.status(200).send({
          message: 'Chamado encerrado com sucesso',
          chamado: {
            id: chamado.cha_id,
            status: 'Encerrado',
            dataEncerramento,
          },
        })
      } catch (error) {
        console.error('[POST /encerrar] Erro:', error)
        return reply.status(500).send({
          error: 'Erro ao encerrar chamado',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )
}
