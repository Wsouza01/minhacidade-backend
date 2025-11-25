import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { sacOuvidoria } from '../../../db/schema/sac-ouvidoria.js';
import { usuarios } from '../../../db/schema/usuarios.js';
export const getSacOuvidoriaRoute = (app) => {
    app.get('/sac-ouvidoria', {
        schema: {
            description: 'Listar registros de SAC/Ouvidoria com filtros',
            tags: ['SAC/Ouvidoria'],
            querystring: z.object({
                cidadeId: z.string().optional(),
                limite: z.coerce.number().default(50),
                offset: z.coerce.number().default(0),
                tipo: z
                    .enum(['Elogio', 'Reclamação', 'Solicitação', 'Sugestão'])
                    .optional(),
            }),
        },
    }, async (request, reply) => {
        const { cidadeId, limite, offset, tipo } = request.query;
        try {
            console.log('📥 Buscando registros SAC/Ouvidoria:', {
                cidadeId,
                limite,
                offset,
                tipo,
            });
            // Construir filtros dinamicamente
            const filters = [];
            if (cidadeId) {
                filters.push(eq(usuarios.cid_id, cidadeId));
            }
            if (tipo) {
                filters.push(eq(sacOuvidoria.sac_tipo, tipo));
            }
            // Query base com join
            const baseQuery = db
                .select({
                sac_id: sacOuvidoria.sac_id,
                sac_tipo: sacOuvidoria.sac_tipo,
                sac_descricao: sacOuvidoria.sac_descricao,
                sac_anexo_url: sacOuvidoria.sac_anexo_url,
                usu_id: usuarios.usu_id,
                usu_nome: usuarios.usu_nome,
                usu_email: usuarios.usu_email,
                sac_data_criacao: sacOuvidoria.sac_data_criacao,
            })
                .from(sacOuvidoria)
                .innerJoin(usuarios, eq(sacOuvidoria.usu_id, usuarios.usu_id))
                .$dynamic();
            // Aplicar filtros se existirem
            const queryWithFilters = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;
            // Buscar todos os resultados para contar
            const allResults = await queryWithFilters;
            // Aplicar ordenação e paginação
            const results = await queryWithFilters
                .orderBy(desc(sacOuvidoria.sac_data_criacao))
                .limit(limite)
                .offset(offset);
            // Mapear resultados para camelCase
            const dados = results.map((row) => ({
                sacId: row.sac_id,
                sacTipo: row.sac_tipo,
                sacDescricao: row.sac_descricao,
                sacAnexoUrl: row.sac_anexo_url,
                usuId: row.usu_id,
                usuNome: row.usu_nome,
                usuEmail: row.usu_email,
                sacDataCriacao: row.sac_data_criacao?.toISOString() ?? '',
            }));
            console.log(`✅ Encontrados ${dados.length} registros de ${allResults.length} total`);
            return reply.send({
                total: allResults.length,
                limite,
                offset,
                dados,
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar registros de SAC/Ouvidoria:', error);
            return reply.status(500).send({
                error: 'Erro ao buscar registros',
                message: error instanceof Error ? error.message : 'Erro desconhecido',
            });
        }
    });
};
