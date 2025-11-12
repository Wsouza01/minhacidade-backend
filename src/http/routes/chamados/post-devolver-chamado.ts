import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { chamados } from '../../../db/schema/chamados.ts'
import { etapas } from '../../../db/schema/etapas.ts'
import { funcionarios } from '../../../db/schema/funcionarios.ts'
import { notificacoes } from '../../../db/schema/notificacoes.ts'

export const devolverChamadoRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/chamados/:chamadoId/devolver',
    {
      schema: {
        params: z.object({
          chamadoId: z.string().uuid(),
        }),
        body: z.object({
          observacoes: z.string().nullish(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { chamadoId } = request.params
        const { observacoes = 'Chamado devolvido pelo servidor.' } =
          request.body

        const [chamado] = await db
          .select()
          .from(chamados)
          .where(eq(chamados.cha_id, chamadoId))

        if (!chamado) {
          return reply.status(404).send({ message: 'Chamado não encontrado' })
        }

        let servidorNome = 'Servidor não identificado'
        if (chamado.cha_responsavel) {
          const [servidor] = await db
            .select()
            .from(funcionarios)
            .where(eq(funcionarios.fun_id, chamado.cha_responsavel))
          if (servidor) {
            servidorNome = servidor.fun_nome
          }
        }

        await db
          .update(chamados)
          .set({
            cha_responsavel: null,
            cha_status: 'Aguardando Atribuição',
            cha_data_fechamento: null, // Reabre o chamado
          })
          .where(eq(chamados.cha_id, chamadoId))

        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: chamadoId,
          eta_nome: 'Chamado devolvido',
          eta_descricao: `${servidorNome}: ${observacoes}`,
          eta_data_inicio: new Date(),
        })

        // Notificar todos os atendentes do departamento
        const atendentes = chamado.cha_departamento
          ? await db
              .select({ fun_id: funcionarios.fun_id })
              .from(funcionarios)
              .where(
                and(
                  eq(funcionarios.dep_id, chamado.cha_departamento),
                  eq(funcionarios.fun_tipo, 'atendente'),
                  eq(funcionarios.fun_ativo, true),
                ),
              )
          : []

        if (atendentes.length > 0) {
          const notificacoesAtendentes = atendentes.map((atendente) => ({
            not_id: randomUUID(),
            not_titulo: 'Chamado Devolvido',
            not_mensagem: `O chamado #${chamadoId.slice(0, 8)} foi devolvido e precisa de reatribuição.`,
            not_tipo: 'warning',
            not_lida: false,
            not_data: new Date(),
            cha_id: chamadoId,
            usu_id: null,
            fun_id: atendente.fun_id,
          }))
          await db.insert(notificacoes).values(notificacoesAtendentes)
        }

        // Notificar munícipe sobre devolução
        if (chamado.usu_id) {
          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: 'Seu chamado foi atualizado',
            not_mensagem: `Seu chamado foi devolvido para o setor de atendimento e será reatribuído em breve.`,
            not_tipo: 'info',
            not_lida: false,
            not_data: new Date(),
            cha_id: chamadoId,
            usu_id: chamado.usu_id,
            fun_id: null,
          })
        }

        return reply.status(204).send()
      } catch (err) {
        console.error('Erro ao devolver chamado:', err)
        reply.status(500).send({ message: 'Erro ao devolver chamado' })
      }
    },
  )
}
