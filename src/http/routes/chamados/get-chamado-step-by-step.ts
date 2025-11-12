import { eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../../db/index.ts'
import { categorias } from '../../../db/schema/categorias.ts'
import { chamados } from '../../../db/schema/chamados.ts'
import { departamentos } from '../../../db/schema/departamentos.ts'
import { funcionarios } from '../../../db/schema/funcionarios.ts'
import { usuarios } from '../../../db/schema/usuarios.ts'

const getChamadoByIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export const getChamadoStepByStepRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/chamados-step/:id',
    {
      schema: {
        params: getChamadoByIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        console.log('🔍 STEP: Buscando chamado ID:', id)

        // Step 1: Query básica com joins um por vez
        console.log('📝 STEP 1: Query base')
        const chamadoResult = await db
          .select({
            cha_id: chamados.cha_id,
            cha_nome: chamados.cha_nome,
            cha_titulo: chamados.cha_titulo,
            cha_descricao: chamados.cha_descricao,
            cha_departamento: chamados.cha_departamento,
            cha_responsavel: chamados.cha_responsavel,
            cha_data_abertura: chamados.cha_data_abertura,
            cha_data_fechamento: chamados.cha_data_fechamento,
            cha_prioridade: chamados.cha_prioridade,
            cha_cep: chamados.cha_cep,
            cha_numero_endereco: chamados.cha_numero_endereco,
            cat_id: chamados.cat_id,
            usu_id: chamados.usu_id,
            // JOIN departamento
            departamento_nome: departamentos.dep_nome,
            departamento_telefone: departamentos.dep_telefone,
          })
          .from(chamados)
          .leftJoin(
            departamentos,
            eq(chamados.cha_departamento, departamentos.dep_id),
          )
          .where(eq(chamados.cha_id, id))
          .limit(1)

        console.log('✅ STEP 1 OK, resultados:', chamadoResult.length)

        if (chamadoResult.length === 0) {
          return reply.status(404).send({ message: 'Chamado não encontrado' })
        }

        // Step 2: Adicionar categoria
        console.log('📝 STEP 2: Adicionando categoria')
        const _chamadoComCategoria = await db
          .select({
            cha_id: chamados.cha_id,
            cha_nome: chamados.cha_nome,
            cha_titulo: chamados.cha_titulo,
            cha_descricao: chamados.cha_descricao,
            departamento_nome: departamentos.dep_nome,
            categoria_nome: categorias.cat_nome,
          })
          .from(chamados)
          .leftJoin(
            departamentos,
            eq(chamados.cha_departamento, departamentos.dep_id),
          )
          .leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .where(eq(chamados.cha_id, id))
          .limit(1)

        console.log('✅ STEP 2 OK')

        // Step 3: Adicionar usuário
        console.log('📝 STEP 3: Adicionando usuário')
        const _chamadoComUsuario = await db
          .select({
            cha_id: chamados.cha_id,
            cha_nome: chamados.cha_nome,
            cha_titulo: chamados.cha_titulo,
            cha_descricao: chamados.cha_descricao,
            departamento_nome: departamentos.dep_nome,
            categoria_nome: categorias.cat_nome,
            usuario_nome: usuarios.usu_nome,
            usuario_email: usuarios.usu_email,
          })
          .from(chamados)
          .leftJoin(
            departamentos,
            eq(chamados.cha_departamento, departamentos.dep_id),
          )
          .leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .leftJoin(usuarios, eq(chamados.usu_id, usuarios.usu_id))
          .where(eq(chamados.cha_id, id))
          .limit(1)

        console.log('✅ STEP 3 OK')

        // Step 4: Adicionar funcionário/responsável
        console.log('📝 STEP 4: Adicionando responsável')
        const chamadoCompleto = await db
          .select({
            cha_id: chamados.cha_id,
            cha_nome: chamados.cha_nome,
            cha_titulo: chamados.cha_titulo,
            cha_descricao: chamados.cha_descricao,
            departamento_nome: departamentos.dep_nome,
            categoria_nome: categorias.cat_nome,
            usuario_nome: usuarios.usu_nome,
            responsavel_nome: funcionarios.fun_nome,
          })
          .from(chamados)
          .leftJoin(
            departamentos,
            eq(chamados.cha_departamento, departamentos.dep_id),
          )
          .leftJoin(categorias, eq(chamados.cat_id, categorias.cat_id))
          .leftJoin(usuarios, eq(chamados.usu_id, usuarios.usu_id))
          .leftJoin(
            funcionarios,
            eq(chamados.cha_responsavel, funcionarios.fun_id),
          )
          .where(eq(chamados.cha_id, id))
          .limit(1)

        console.log('✅ STEP 4 OK')

        const chamado = chamadoCompleto[0]

        reply.send({
          success: true,
          data: chamado,
          message: 'Query complexa funcionou!',
        })
      } catch (err) {
        console.error('❌ STEP ERROR:', err)
        console.error(
          '❌ STEP Stack:',
          err instanceof Error ? err.stack : 'No stack',
        )
        reply.status(500).send({
          message: 'Erro no teste step by step',
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        })
      }
    },
  )
}
