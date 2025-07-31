import { and, eq } from 'drizzle-orm'
import type { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { db } from '../../../db/connection.ts'
import { cidades } from '../../../db/schema/cidades.ts'

export const cidadesRoute: FastifyPluginCallback = (app) => {
  // Listar todas as cidades (com filtros)
  app.get(
    '/cidades',
    {
      schema: {
        querystring: z.object({
          ativo: z.string().optional(),
          estado: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { ativo, estado } = request.query

      const query = db
        .select({
          cid_id: cidades.cid_id,
          cid_nome: cidades.cid_nome,
          cid_estado: cidades.cid_estado,
          cid_ativo: cidades.cid_ativo,
          cid_padrao: cidades.cid_padrao,
        })
        .from(cidades)

      if (ativo !== undefined) {
        query.where(eq(cidades.cid_ativo, ativo === 'true'))
      }

      if (estado) {
        query.where(eq(cidades.cid_estado, estado))
      }

      const result = await query
      return reply.send(result)
    }
  )

  // Listar cidades permitidas (apenas ativas)
  app.get(
    '/cidades/permitidas',
    {
      schema: {
        response: {
          200: z.array(
            z.object({
              cid_id: z.string().uuid(),
              cid_nome: z.string(),
              cid_estado: z.string().length(2),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await db
          .select({
            cid_id: cidades.cid_id,
            cid_nome: cidades.cid_nome,
            cid_estado: cidades.cid_estado,
          })
          .from(cidades)
          .where(eq(cidades.cid_ativo, true))
          .orderBy(cidades.cid_nome)

        return reply.send(result)
      } catch (error) {
        console.error('Erro ao buscar cidades permitidas:', error)
        return reply.status(500).send({
          message: 'Erro ao buscar cidades permitidas',
          error: error.message,
          code: 'CITIES_FETCH_ERROR',
        })
      }
    }
  )

  // Adicionar nova cidade (apenas admin)
  app.post(
    '/cidades',
    {
      schema: {
        body: z.object({
          nome: z.string().min(3),
          estado: z.string().length(2),
          padrao: z.boolean().optional(),
          ativo: z.boolean().optional().default(true),
        }),
      },
    },
    async (request, reply) => {
      const { nome, estado, padrao, ativo } = request.body

      try {
        // Se for cidade padrão, remove o padrão das outras
        if (padrao) {
          await db
            .update(cidades)
            .set({ cid_padrao: false })
            .where(eq(cidades.cid_padrao, true))
        }

        const [novaCidade] = await db
          .insert(cidades)
          .values({
            cid_nome: nome,
            cid_estado: estado,
            cid_padrao: padrao,
            cid_ativo: ativo,
          })
          .returning()

        return reply.status(201).send(novaCidade)
      } catch (error) {
        console.error('Erro ao adicionar cidade:', error)
        return reply.status(400).send({
          message: 'Erro ao adicionar cidade',
          error: error.message,
          code: 'CITY_CREATION_ERROR',
        })
      }
    }
  )

  // Atualizar cidade (apenas admin)
  app.put(
    '/cidades/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          nome: z.string().min(3).optional(),
          estado: z.string().length(2).optional(),
          padrao: z.boolean().optional(),
          ativo: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { nome, estado, padrao, ativo } = request.body

      try {
        if (padrao) {
          await db
            .update(cidades)
            .set({ cid_padrao: false })
            .where(eq(cidades.cid_padrao, true))
        }

        const [cidadeAtualizada] = await db
          .update(cidades)
          .set({
            cid_nome: nome,
            cid_estado: estado,
            cid_padrao: padrao,
            cid_ativo: ativo,
          })
          .where(eq(cidades.cid_id, id))
          .returning()

        return reply.send(cidadeAtualizada)
      } catch (error) {
        console.error('Erro ao atualizar cidade:', error)
        return reply.status(400).send({
          message: 'Erro ao atualizar cidade',
          error: error.message,
          code: 'CITY_UPDATE_ERROR',
        })
      }
    }
  )

  // Remover cidade (apenas admin)
  app.delete(
    '/cidades/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params

      try {
        await db.delete(cidades).where(eq(cidades.cid_id, id))
        return reply.send({ message: 'Cidade removida com sucesso' })
      } catch (error) {
        console.error('Erro ao remover cidade:', error)
        return reply.status(400).send({
          message: 'Erro ao remover cidade',
          error: error.message,
          code: 'CITY_DELETION_ERROR',
        })
      }
    }
  )
}
