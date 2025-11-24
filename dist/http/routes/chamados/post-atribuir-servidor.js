import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { chamados } from '../../../db/schema/chamados.js'
import { etapas } from '../../../db/schema/etapas.js'
import { funcionarios } from '../../../db/schema/funcionarios.js'
import { notificacoes } from '../../../db/schema/notificacoes.js'
export const postAtribuirServidor = async (app) => {
  app.post(
    '/chamados/:id/atribuir-servidor',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          servidorId: z.string().uuid(),
          observacao: z.string().optional(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params
      const { servidorId, observacao } = req.body
      try {
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
        // Atualizar chamado com servidor responsável
        await db
          .update(chamados)
          .set({
            cha_responsavel: servidorId,
          })
          .where(eq(chamados.cha_id, id))
        // Criar etapa no histórico
        await db.insert(etapas).values({
          eta_id: randomUUID(),
          cha_id: id,
          eta_nome: 'Servidor atribuído',
          eta_descricao: observacao
            ? `Servidor ${servidor.fun_nome} atribuído. Observação: ${observacao}`
            : `Servidor ${servidor.fun_nome} atribuído ao chamado.`,
          eta_data_inicio: new Date(),
          eta_data_fim: null,
        })
        // Criar notificação para o servidor
        await db.insert(notificacoes).values({
          not_id: randomUUID(),
          not_titulo: 'Novo chamado atribuído',
          not_mensagem: `Você foi atribuído ao chamado #${chamado.cha_id.slice(0, 8)}. ${observacao ? `Observação: ${observacao}` : ''}`,
          not_tipo: 'info',
          not_lida: false,
          not_data: new Date(),
          usu_id: null,
          fun_id: servidorId,
        })
        return reply.status(200).send({
          message: 'Servidor atribuído com sucesso',
          servidor: {
            id: servidor.fun_id,
            nome: servidor.fun_nome,
            email: servidor.fun_email,
          },
        })
      } catch (error) {
        console.error('[POST /atribuir-servidor] Erro:', error)
        return reply.status(500).send({
          error: 'Erro ao atribuir servidor ao chamado',
          details: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )
}
