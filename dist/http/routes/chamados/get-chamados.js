import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { categorias } from '../../../db/schema/categorias.js'
import { chamados } from '../../../db/schema/chamados.js'
import { cidades } from '../../../db/schema/cidades.js'
import { departamentos } from '../../../db/schema/departamentos.js'
import { usuarios } from '../../../db/schema/usuarios.js'

const getChamadosQuerySchema = z.object({
  limit: z.string().optional(),
  cidadeId: z.string().optional(),
  dep_id: z.string().optional(),
  servidorId: z.string().optional(),
})
export const getChamadosRoute = (app) => {
  // Route to get all tickets with optional limit
  app.get(
    '/chamados',
    {
      schema: {
        querystring: getChamadosQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        const { limit, cidadeId, dep_id, servidorId } = request.query
        const limitNumber = limit ? Number.parseInt(limit, 10) : undefined
        const baseQuery = db
          .select({
            cha_id: chamados.cha_id,
            cha_titulo: chamados.cha_titulo,
            cha_nome: chamados.cha_nome,
            cha_descricao: chamados.cha_descricao,
            cha_data_abertura: chamados.cha_data_abertura,
            cha_data_fechamento: chamados.cha_data_fechamento,
            cha_prioridade: chamados.cha_prioridade,
            cha_status: chamados.cha_status,
            cha_cep: chamados.cha_cep,
            cha_numero_endereco: chamados.cha_numero_endereco,
            cha_responsavel: chamados.cha_responsavel,
            cha_departamento: chamados.cha_departamento,
            cat_id: chamados.cat_id,
            usu_id: chamados.usu_id,
            departamento_nome: departamentos.dep_nome,
            categoria_nome: categorias.cat_nome,
            usuario_nome: usuarios.usu_nome,
            cidade_id: departamentos.cid_id,
            cidade_nome: cidades.cid_nome,
          })
          .from(chamados)
          .leftJoin(
            departamentos,
            eq(chamados.cha_departamento, departamentos.dep_id),
          )
          .leftJoin(cidades, eq(departamentos.cid_id, cidades.cid_id))
          .leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .leftJoin(usuarios, eq(chamados.usu_id, usuarios.usu_id))
        // Aplicar filtros dinamicamente
        const conditions = []
        if (cidadeId) {
          conditions.push(eq(departamentos.cid_id, cidadeId))
        }
        if (dep_id) {
          conditions.push(eq(chamados.cha_departamento, dep_id))
        }
        if (servidorId) {
          conditions.push(eq(chamados.cha_responsavel, servidorId))
        }
        const filteredQuery =
          conditions.length > 0
            ? baseQuery.where(and(...conditions))
            : baseQuery
        const orderedQuery = filteredQuery.orderBy(
          desc(chamados.cha_data_abertura),
        )
        const limitedQuery = limitNumber
          ? orderedQuery.limit(limitNumber)
          : orderedQuery
        const results = await limitedQuery
        reply.send(results)
      } catch (err) {
        console.error('Erro ao buscar chamados:', err)
        reply.status(500).send({ message: 'Erro ao buscar chamados' })
      }
    },
  )
  // Route to get chamados count
  app.get('/chamados/count', async (_, reply) => {
    try {
      const result = await db
        .select({ count: sql`count(${chamados.cha_id})::int` })
        .from(chamados)
      const totalChamados = Number(result[0]?.count) || 0
      reply.send({ total: totalChamados })
    } catch (err) {
      console.error('Erro ao contar chamados:', err)
      reply.status(500).send({ message: 'Erro ao contar chamados' })
    }
  })
}
