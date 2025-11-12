import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { chamados } from '../../../db/schema/chamados.ts'
import { etapas } from '../../../db/schema/etapas.ts'
import { funcionarios } from '../../../db/schema/funcionarios.ts'
import { notificacoes } from '../../../db/schema/notificacoes.ts'

export const postResolverChamado: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/chamados/:id/resolver',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          servidorId: z.string().uuid(),
          resolvido: z.boolean(),
          observacao: z.string(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params
      const { servidorId, resolvido, observacao } = req.body

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

        // Buscar servidor
        const [servidor] = await db
          .select()
          .from(funcionarios)
          .where(eq(funcionarios.fun_id, servidorId))

        if (!servidor) {
          return reply.status(404).send({
            error: 'Servidor não encontrado',
          })
        }

        // Atualizar status do chamado
        const novoStatus = resolvido ? 'Resolvido' : 'Em Andamento'
        const dataResolucao = resolvido ? new Date() : null

        await db
          .update(chamados)
          .set({
            cha_status: novoStatus,
            cha_data_fechamento: dataResolucao,
          })
          .where(eq(chamados.cha_id, id))

        // Criar etapa no histórico
        const etapaNome = resolvido
          ? 'Chamado resolvido'
          : 'Chamado em andamento'
        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: id,
          eta_nome: etapaNome,
          eta_descricao: `${servidor.fun_nome}: ${observacao}`,
          eta_data_inicio: new Date(),
          eta_data_fim: resolvido ? new Date() : null,
        })

        // Notificar munícipe (solicitante)
        if (chamado.usu_id) {
          await db.insert(notificacoes).values({
            not_id: randomUUID(),
            not_titulo: resolvido
              ? 'Chamado resolvido!'
              : 'Atualização no seu chamado',
            not_mensagem: resolvido
              ? `Seu chamado foi resolvido. ${observacao}`
              : `Servidor ${servidor.fun_nome} está trabalhando no seu chamado. ${observacao}`,
            not_tipo: resolvido ? 'success' : 'info',
            not_lida: false,
            not_data: new Date(),
            cha_id: id,
            usu_id: chamado.usu_id,
            fun_id: null,
          })
        }

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
            not_titulo: resolvido
              ? 'Chamado resolvido pelo servidor'
              : 'Atualização de chamado',
            not_mensagem: resolvido
              ? `Servidor ${
                  servidor.fun_nome
                } resolveu o chamado #${chamado.cha_id.slice(
                  0,
                  8,
                )}. ${observacao}`
              : `Servidor ${
                  servidor.fun_nome
                } atualizou o chamado #${chamado.cha_id.slice(
                  0,
                  8,
                )}. ${observacao}`,
            not_tipo: 'info',
            not_lida: false,
            not_data: new Date(),
            cha_id: id,
            usu_id: null,
            fun_id: atendente.fun_id,
          }))
          await db.insert(notificacoes).values(notificacoesAtendentes)
        }

        return reply.status(200).send({
          message: resolvido
            ? 'Chamado resolvido com sucesso'
            : 'Chamado atualizado com sucesso',
          chamado: {
            id: chamado.cha_id,
            status: novoStatus,
            dataResolucao,
          },
        })
      } catch (error) {
        console.error('[POST /resolver] Erro:', error)
        return reply.status(500).send({
          error: 'Erro ao resolver chamado',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )
}
