import type { FastifyPluginCallbackZod } from "fastify-type-provider-zod";
import { db } from "../../../db/connection.ts";
import { chamados } from "../../../db/schema/chamados.ts";
import { categorias } from "../../../db/schema/categorias.ts";
import { departamentos } from "../../../db/schema/departamentos.ts";
import { notificacoes } from "../../../db/schema/notificacoes.ts";
import { z } from "zod";
import { eq, ilike } from "drizzle-orm";

export const postChamadosRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    "/chamados",
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
        const body = request.body;
        console.log('📥 Recebendo chamado:', body);

        // Buscar categoria pelo nome se fornecida
        let categoria_id = null;
        if (body.categoria_nome) {
          const categoria = await db
            .select()
            .from(categorias)
            .where(ilike(categorias.cat_nome, `%${body.categoria_nome}%`))
            .limit(1);

          if (categoria.length > 0) {
            categoria_id = categoria[0].cat_id;
          }
        }

        // Verificar se departamento existe
        const departamento = await db
          .select()
          .from(departamentos)
          .where(eq(departamentos.dep_id, body.departamento_id))
          .limit(1);

        if (departamento.length === 0) {
          return reply.status(400).send({ error: "Departamento não encontrado" });
        }

        // Criar nome do chamado baseado no título
        const nome_chamado = body.titulo || `Chamado - ${body.motivo || 'Solicitação'}`;

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
            cha_data_abertura: new Date(),
            // cha_responsavel pode ser null inicialmente
          })
          .returning();

        console.log('✅ Chamado criado com sucesso:', novoChamado[0]);

        // Criar notificação para o usuário (apenas se não for anônimo)
        if (body.usuario_id) {
          try {
            await db.insert(notificacoes).values({
              not_titulo: "Chamado criado com sucesso",
              not_mensagem: `Seu chamado "${body.titulo}" foi registrado e está em análise. Você receberá atualizações sobre o andamento.`,
              not_tipo: "success",
              not_lida: false,
              cha_id: novoChamado[0].cha_id,
              usu_id: body.usuario_id,
            });
            console.log('✅ Notificação criada para o usuário');
          } catch (notifError) {
            console.error('❌ Erro ao criar notificação:', notifError);
            // Não interrompe o fluxo se a notificação falhar
          }
        } else {
          console.log('ℹ️ Chamado anônimo - notificação não criada');
        }

        reply.status(201).send({
          message: "Chamado criado com sucesso",
          chamado: novoChamado[0]
        });
      } catch (error) {
        console.error("Erro ao criar chamado:", error);
        reply.status(500).send({ message: "Erro interno do servidor" });
      }
    }
  );
};
