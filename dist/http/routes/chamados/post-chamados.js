import { randomUUID } from 'node:crypto'
import { and, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { categorias } from '../../../db/schema/categorias.js'
import { chamados } from '../../../db/schema/chamados.js'
import { departamentos } from '../../../db/schema/departamentos.js'
import { etapas } from '../../../db/schema/etapas.js'
import { funcionarios } from '../../../db/schema/funcionarios.js'
import { notificacoes } from '../../../db/schema/notificacoes.js'
export const postChamadosRoute = (app) => {
  app.post(
    '/chamados',
    {
      schema: {
        body: z.object({
          titulo: z.string().min(1),
          descricao: z.string().min(10),
          cep: z.string().optional(),
          numero_endereco: z.string().optional(),
          logradouro: z.string().optional(),
          bairro: z.string().optional(),
          cidade: z.string().optional(),
          prioridade: z.string(),
          usuario_id: z.string().uuid().optional(),
          categoria_nome: z.string().optional(),
          departamento_id: z.string().uuid(),
          motivo: z.string().optional(),
          anonimo: z.boolean().optional(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const body = request.body
        console.log('📥 Recebendo chamado:', body)
        // Buscar categoria pelo nome se fornecida
        let categoria_id = null
        if (body.categoria_nome) {
          const categoria = await db
            .select()
            .from(categorias)
            .where(ilike(categorias.cat_nome, `%${body.categoria_nome}%`))
            .limit(1)
          if (categoria.length > 0) {
            categoria_id = categoria[0].cat_id
          }
        }
        // Verificar se departamento existe
        const departamento = await db
          .select()
          .from(departamentos)
          .where(eq(departamentos.dep_id, body.departamento_id))
          .limit(1)
        if (departamento.length === 0) {
          return reply
            .status(400)
            .send({ error: 'Departamento não encontrado' })
        }
        // Criar nome do chamado baseado no título
        const nome_chamado =
          body.titulo || `Chamado - ${body.motivo || 'Solicitação'}`
        // Encontrar o atendente designado para a cidade do departamento
        const cidadeIdDoDepto = departamento[0].cid_id
        let atendenteDaCidade = null
        if (cidadeIdDoDepto) {
          const [atendenteEncontrado] = await db
            .select()
            .from(funcionarios)
            .where(
              and(
                eq(funcionarios.cid_id, cidadeIdDoDepto),
                eq(funcionarios.fun_tipo, 'atendente'),
                eq(funcionarios.fun_ativo, true),
              ),
            )
            .limit(1)
          if (atendenteEncontrado) {
            atendenteDaCidade = atendenteEncontrado
          }
        }
        const responsavel_id = atendenteDaCidade
          ? atendenteDaCidade.fun_id
          : null
        // Log dos dados antes de inserir
        console.log('📝 Dados do chamado a ser criado:', {
          usuario_id: body.usuario_id || null,
          anonimo: body.anonimo,
          departamento_id: body.departamento_id,
          categoria_id,
          responsavel_id, // Responsável pelo chamado
        })
        const novoChamado = await db
          .insert(chamados)
          .values({
            cha_titulo: body.titulo,
            cha_nome: nome_chamado,
            cha_descricao: body.descricao,
            cha_cep: body.cep,
            cha_numero_endereco: body.numero_endereco,
            cha_prioridade: body.prioridade,
            usu_id: body.usuario_id || null,
            cat_id: categoria_id,
            cha_departamento: body.departamento_id,
            cha_responsavel: responsavel_id, // Atribuindo atendente ao chamado
            cha_data_abertura: new Date(),
          })
          .returning()
        console.log('✅ Chamado criado com sucesso:', {
          cha_id: novoChamado[0].cha_id,
          cha_titulo: novoChamado[0].cha_titulo,
          usu_id: novoChamado[0].usu_id,
          cha_departamento: novoChamado[0].cha_departamento,
        })
        // Criar etapa inicial no histórico
        try {
          await db.insert(etapas).values({
            eta_id: randomUUID(),
            cha_id: novoChamado[0].cha_id,
            eta_nome: 'Chamado criado',
            eta_descricao: body.anonimo
              ? 'Chamado criado de forma anônima'
              : 'Chamado criado e aguardando triagem',
            eta_data_inicio: new Date(),
            eta_data_fim: null,
          })
          console.log('✅ Etapa inicial criada')
        } catch (etapaError) {
          console.error('❌ Erro ao criar etapa:', etapaError)
        }
        // Criar notificação para o usuário (apenas se não for anônimo)
        if (body.usuario_id) {
          try {
            await db.insert(notificacoes).values({
              not_id: randomUUID(),
              not_titulo: 'Chamado criado com sucesso!',
              not_mensagem: `Seu chamado "${body.titulo}" foi registrado e está em análise. Você receberá atualizações sobre o andamento.`,
              not_tipo: 'success',
              not_lida: false,
              not_data: new Date(),
              cha_id: novoChamado[0].cha_id,
              usu_id: body.usuario_id,
              fun_id: null,
            })
            console.log('✅ Notificação criada para o usuário')
          } catch (notifError) {
            console.error('❌ Erro ao criar notificação:', notifError)
          }
        } else {
          console.log('ℹ️ Chamado anônimo - notificação de usuário não criada')
        }
        // Notificar o atendente da cidade, se encontrado
        if (atendenteDaCidade) {
          try {
            await db.insert(notificacoes).values({
              not_id: randomUUID(),
              not_titulo: 'Novo chamado recebido',
              not_mensagem: `Novo chamado "${body.titulo}" na sua cidade. Prioridade: ${body.prioridade}`,
              not_tipo: 'info',
              not_lida: false,
              not_data: new Date(),
              cha_id: novoChamado[0].cha_id,
              usu_id: null,
              fun_id: atendenteDaCidade.fun_id,
            })
            console.log(
              `✅ Notificação criada para o atendente da cidade: ${atendenteDaCidade.fun_id}`,
            )
          } catch (atendenteNotifError) {
            console.error(
              '❌ Erro ao criar notificação para o atendente da cidade:',
              atendenteNotifError,
            )
          }
        }
        reply.status(201).send({
          message: 'Chamado criado com sucesso',
          chamado: novoChamado[0],
        })
      } catch (error) {
        console.error('Erro ao criar chamado:', error)
        reply.status(500).send({ message: 'Erro interno do servidor' })
      }
    },
  )
}
