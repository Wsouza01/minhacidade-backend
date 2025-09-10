import { and, eq } from 'drizzle-orm'
import type { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { db } from '../../../db/connection.ts'
import { cidades } from '../../../db/schema/cidades.ts'

export const cidadesRoute: FastifyPluginCallback = (app) => {
  // Lista de cidades (público, com filtros)
  app.get(
    '/cidades',
    {
      schema: {
        querystring: z.object({
          ativo: z.string().optional(), // "true" | "false"
          estado: z.string().length(2).optional(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string().uuid(),
              nome: z.string(),
              estado: z.string().length(2),
              ativo: z.boolean(),
              padrao: z.boolean(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      try {
        const { ativo, estado } = request.query

        // condições dinâmicas
        const conditions = []
        if (ativo !== undefined) {
          conditions.push(eq(cidades.cid_ativo, ativo === 'true'))
        }
        if (estado) {
          conditions.push(eq(cidades.cid_estado, estado))
        }

        const result = await db
          .select({
            id: cidades.cid_id,
            nome: cidades.cid_nome,
            estado: cidades.cid_estado,
            ativo: cidades.cid_ativo,
            padrao: cidades.cid_padrao,
          })
          .from(cidades)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(cidades.cid_nome)

        return reply.send(result)
      } catch (error) {
        console.error('Erro ao buscar cidades:', error)
        return reply.status(500).send({
          message: 'Erro ao buscar cidades',
          error: error instanceof Error ? error.message : String(error),
          code: 'CITIES_FETCH_ERROR',
        })
      }
    }
  )

  // Lista somente cidades ativas (permitidas)
  app.get(
    '/cidades/permitidas',
    {
      schema: {
        response: {
          200: z.array(
            z.object({
              id: z.string().uuid(),
              nome: z.string(),
              estado: z.string().length(2),
            })
          ),
        },
      },
    },
    async (_, reply) => {
      try {
        const result = await db
          .select({
            id: cidades.cid_id,
            nome: cidades.cid_nome,
            estado: cidades.cid_estado,
          })
          .from(cidades)
          .where(eq(cidades.cid_ativo, true))
          .orderBy(cidades.cid_nome)

        return reply.send(result)
      } catch (error) {
        console.error('Erro ao buscar cidades permitidas:', error)
        return reply.status(500).send({
          message: 'Erro ao buscar cidades permitidas',
          error: error instanceof Error ? error.message : String(error),
          code: 'CITIES_FETCH_ERROR',
        })
      }
    }
  )

  // Adicionar cidade
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
        if (padrao) {
          await db.update(cidades).set({ cid_padrao: false }).where(eq(cidades.cid_padrao, true))
        }

        const [novaCidade] = await db
          .insert(cidades)
          .values({
            cid_nome: nome,
            cid_estado: estado,
            cid_padrao: padrao ?? false,
            cid_ativo: ativo,
          })
          .returning()

        return reply.status(201).send(novaCidade)
      } catch (error) {
        console.error('Erro ao adicionar cidade:', error)
        return reply.status(400).send({
          message: 'Erro ao adicionar cidade',
          error: error instanceof Error ? error.message : String(error),
          code: 'CITY_CREATION_ERROR',
        })
      }
    }
  )

  // Atualizar cidade
  app.put(
    '/cidades/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
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
          await db.update(cidades).set({ cid_padrao: false }).where(eq(cidades.cid_padrao, true))
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
          error: error instanceof Error ? error.message : String(error),
          code: 'CITY_UPDATE_ERROR',
        })
      }
    }
  )

  // Remover cidade
  app.delete(
    '/cidades/:id',
    {
      schema: { params: z.object({ id: z.string().uuid() }) },
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
          error: error instanceof Error ? error.message : String(error),
          code: 'CITY_DELETION_ERROR',
        })
      }
    }
  )
}
