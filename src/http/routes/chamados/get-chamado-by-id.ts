import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { categorias } from '../../../db/schema/categorias.ts'
import { chamados } from '../../../db/schema/chamados.ts'
import { cidades } from '../../../db/schema/cidades.ts'
import { departamentos } from '../../../db/schema/departamentos.ts'
import { usuarios } from '../../../db/schema/usuarios.ts'

export const getChamadoByIdRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/chamados/:chamadoId',
    {
      schema: {
        params: z.object({
          chamadoId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { chamadoId } = request.params

        const [chamado] = await db
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
          .where(eq(chamados.cha_id, chamadoId))

        if (!chamado) {
          return reply.status(404).send({ message: 'Chamado não encontrado' })
        }

        return reply.send(chamado)
      } catch (err) {
        console.error('Erro ao buscar chamado:', err)
        reply.status(500).send({ message: 'Erro ao buscar chamado' })
      }
    },
  )
}
