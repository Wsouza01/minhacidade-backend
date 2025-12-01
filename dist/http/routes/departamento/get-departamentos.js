import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { schema } from '../../../db/schema/index.js';
const getDepartamentosQuerySchema = z.object({
    cidadeId: z.string().optional(),
});
export const getDepartamentosRoute = (app) => {
    app.get('/departamentos', {
        schema: {
            querystring: getDepartamentosQuerySchema,
        },
    }, async (request, reply) => {
        try {
            const { cidadeId } = request.query;
            let query = db
                .select()
                .from(schema.departamentos)
                .leftJoin(schema.cidades, eq(schema.departamentos.cid_id, schema.cidades.cid_id));
            // Filtrar por cidade se cidadeId foi fornecido
            if (cidadeId) {
                query = query.where(eq(schema.departamentos.cid_id, cidadeId));
            }
            const dados = await query;
            // Mapear resultado do JOIN para formato esperado
            const result = dados.map((item) => ({
                dep_id: item.departamentos.dep_id,
                dep_nome: item.departamentos.dep_nome,
                dep_descricao: item.departamentos.dep_descricao,
                cid_id: item.departamentos.cid_id,
                dep_prioridade: item.departamentos.dep_prioridade,
                dep_motivos: item.departamentos.dep_motivos,
                cidade: item.cidades ? {
                    cid_id: item.cidades.cid_id,
                    cid_nome: item.cidades.cid_nome,
                    cid_estado: item.cidades.cid_estado,
                    cid_ativo: item.cidades.cid_ativo,
                    cid_padrao: item.cidades.cid_padrao,
                } : null,
            }));
            reply.send(result);
        }
        catch (err) {
            console.error('Erro ao buscar departamentos:', err);
            reply.status(500).send({ message: 'Erro ao buscar departamentos' });
        }
    });
};
