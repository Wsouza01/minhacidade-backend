import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { notificacoes } from '../../../db/schema/notificacoes.js';
const postNotificationBodySchema = z
    .object({
    usu_id: z.string().uuid().optional(),
    fun_id: z.string().uuid().optional(),
    not_titulo: z.string().optional(),
    not_mensagem: z.string(),
    not_tipo: z.string().optional(),
    cha_id: z.string().uuid().optional(),
})
    .refine((data) => data.usu_id || data.fun_id, {
    message: 'usu_id ou fun_id deve ser informado',
    path: ['usu_id'],
});
export const postNotificationRoute = (app) => {
    app.post('/notifications', {
        schema: {
            body: postNotificationBodySchema,
        },
    }, async (request, reply) => {
        try {
            const { usu_id, fun_id, not_titulo, not_mensagem, not_tipo, cha_id } = request.body;
            console.log('📬 Criando notificação:', {
                usu_id,
                fun_id,
            });
            const novaNotificacao = await db
                .insert(notificacoes)
                .values({
                not_id: randomUUID(),
                usu_id: usu_id ?? null,
                fun_id: fun_id ?? null,
                not_titulo: not_titulo ?? null,
                not_mensagem,
                not_tipo: not_tipo ?? 'info',
                not_lida: false,
                not_data: new Date(),
                cha_id: cha_id ?? null,
            })
                .returning();
            console.log('✅ Notificação criada:', novaNotificacao[0].not_id);
            reply.status(201).send({
                message: 'Notificação criada com sucesso',
                notificacao: novaNotificacao[0],
            });
        }
        catch (error) {
            console.error('❌ Erro ao criar notificação:', error);
            reply.status(500).send({
                message: 'Erro ao criar notificação',
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            });
        }
    });
};
