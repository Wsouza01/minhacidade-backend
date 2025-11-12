import { eq } from 'drizzle-orm'
import type { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { administradores } from '../../../db/schema/administradores.ts'
import { cidades } from '../../../db/schema/cidades.ts'

export const getAdministradoresRoute: FastifyPluginCallback = (app) => {
  app.get(
    '/administradores',
    {
      schema: {
        querystring: z.object({
          cidadeId: z.string().uuid().optional(),
          ativo: z.string().optional(), // "true" | "false"
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string().uuid(),
              nome: z.string(),
              email: z.string(),
              cpf: z.string(),
              login: z.string(),
              ativo: z.boolean(),
              criado: z.date(),
              cidade: z
                .object({
                  id: z.string().uuid(),
                  nome: z.string(),
                  estado: z.string(),
                })
                .nullable(),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      try {
        const { cidadeId, ativo } = request.query

        let query = db
          .select({
            id: administradores.adm_id,
            nome: administradores.adm_nome,
            email: administradores.adm_email,
            cpf: administradores.adm_cpf,
            login: administradores.adm_login,
            ativo: administradores.adm_ativo,
            criado: administradores.adm_criado,
            cidadeId: administradores.cid_id,
            cidadeNome: cidades.cid_nome,
            cidadeEstado: cidades.cid_estado,
          })
          .from(administradores)
          .leftJoin(cidades, eq(administradores.cid_id, cidades.cid_id))

        // Aplicar filtros
        const conditions = []
        if (cidadeId) {
          conditions.push(eq(administradores.cid_id, cidadeId))
        }
        if (ativo !== undefined) {
          conditions.push(eq(administradores.adm_ativo, ativo === 'true'))
        }

        if (conditions.length > 0) {
          query = query.where(
            conditions.reduce((acc, cond) => (acc ? eq(acc, cond) : cond)),
          ) as any
        }

        const result = await query

        const formatted = result.map((row) => ({
          id: row.id,
          nome: row.nome,
          email: row.email,
          cpf: row.cpf,
          login: row.login,
          ativo: row.ativo,
          criado: row.criado,
          cidade: row.cidadeId
            ? {
                id: row.cidadeId,
                nome: row.cidadeNome!,
                estado: row.cidadeEstado!,
              }
            : null,
        }))

        return reply.send(formatted)
      } catch (error) {
        console.error('Erro ao buscar administradores:', error)
        return reply.status(500).send({
          message: 'Erro ao buscar administradores',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )

  // Buscar administrador por ID
  app.get(
    '/administradores/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({
            id: z.string().uuid(),
            nome: z.string(),
            email: z.string(),
            cpf: z.string(),
            dataNascimento: z.string(),
            login: z.string(),
            ativo: z.boolean(),
            criado: z.date(),
            cidade: z
              .object({
                id: z.string().uuid(),
                nome: z.string(),
                estado: z.string(),
              })
              .nullable(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        const result = await db
          .select({
            id: administradores.adm_id,
            nome: administradores.adm_nome,
            email: administradores.adm_email,
            cpf: administradores.adm_cpf,
            dataNascimento: administradores.adm_data_nascimento,
            login: administradores.adm_login,
            ativo: administradores.adm_ativo,
            criado: administradores.adm_criado,
            cidadeId: administradores.cid_id,
            cidadeNome: cidades.cid_nome,
            cidadeEstado: cidades.cid_estado,
          })
          .from(administradores)
          .leftJoin(cidades, eq(administradores.cid_id, cidades.cid_id))
          .where(eq(administradores.adm_id, id))

        if (result.length === 0) {
          return reply.status(404).send({
            message: 'Administrador não encontrado',
          })
        }

        const row = result[0]

        return reply.send({
          id: row.id,
          nome: row.nome,
          email: row.email,
          cpf: row.cpf,
          dataNascimento: row.dataNascimento.toISOString().split('T')[0],
          login: row.login,
          ativo: row.ativo,
          criado: row.criado,
          cidade: row.cidadeId
            ? {
                id: row.cidadeId,
                nome: row.cidadeNome!,
                estado: row.cidadeEstado!,
              }
            : null,
        })
      } catch (error) {
        console.error('Erro ao buscar administrador:', error)
        return reply.status(500).send({
          message: 'Erro ao buscar administrador',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )
}
