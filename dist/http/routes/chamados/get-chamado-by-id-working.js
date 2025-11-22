import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { anexos } from '../../../db/schema/anexos.js';
import { categorias } from '../../../db/schema/categorias.js';
import { chamados } from '../../../db/schema/chamados.js';
import { departamentos } from '../../../db/schema/departamentos.js';
import { funcionarios } from '../../../db/schema/funcionarios.js';
import { usuarios } from '../../../db/schema/usuarios.js';
import { env } from '../../../env.js';
const getChamadoByIdParamsSchema = z.object({
    id: z.string().uuid(),
});
export const getChamadoByIdWorkingRoute = (app) => {
    app.get('/chamados/:id', {
        schema: {
            params: getChamadoByIdParamsSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            console.log('🔍 Buscando chamado ID:', id);
            // Busca básica do chamado
            const chamadoBase = await db
                .select()
                .from(chamados)
                .where(eq(chamados.cha_id, id))
                .limit(1);
            if (chamadoBase.length === 0) {
                return reply.status(404).send({ message: 'Chamado não encontrado' });
            }
            const chamado = chamadoBase[0];
            // Buscar departamento separadamente
            let departamento = null;
            if (chamado.cha_departamento) {
                const depResult = await db
                    .select({
                    dep_nome: departamentos.dep_nome,
                })
                    .from(departamentos)
                    .where(eq(departamentos.dep_id, chamado.cha_departamento))
                    .limit(1);
                departamento = depResult.length > 0 ? depResult[0] : null;
            }
            // Buscar categoria separadamente
            let categoria = null;
            if (chamado.cat_id) {
                const catResult = await db
                    .select({
                    cat_nome: categorias.cat_nome,
                })
                    .from(categorias)
                    .where(eq(categorias.cat_id, chamado.cat_id))
                    .limit(1);
                categoria = catResult.length > 0 ? catResult[0] : null;
            }
            // Buscar usuário separadamente
            let usuario = null;
            if (chamado.usu_id) {
                const usuResult = await db
                    .select({
                    usu_nome: usuarios.usu_nome,
                    usu_email: usuarios.usu_email,
                    usu_cpf: usuarios.usu_cpf,
                })
                    .from(usuarios)
                    .where(eq(usuarios.usu_id, chamado.usu_id))
                    .limit(1);
                usuario = usuResult.length > 0 ? usuResult[0] : null;
            }
            // Buscar funcionário/responsável separadamente
            let responsavel = null;
            if (chamado.cha_responsavel) {
                const respResult = await db
                    .select({
                    fun_nome: funcionarios.fun_nome,
                    fun_email: funcionarios.fun_email,
                })
                    .from(funcionarios)
                    .where(eq(funcionarios.fun_id, chamado.cha_responsavel))
                    .limit(1);
                responsavel = respResult.length > 0 ? respResult[0] : null;
            }
            // Buscar anexos
            const chamadoAnexos = await db
                .select({
                anx_id: anexos.anx_id,
                anx_tipo: anexos.anx_tipo,
                anx_url: anexos.anx_url,
            })
                .from(anexos)
                .where(eq(anexos.cha_id, id));
            // Montar resposta final
            const response = {
                ...chamado,
                // Dados do departamento
                departamento_nome: departamento?.dep_nome || null,
                // Dados da categoria
                categoria_nome: categoria?.cat_nome || null,
                // Dados do usuário solicitante
                usuario_nome: usuario?.usu_nome || null,
                usuario_email: usuario?.usu_email || null,
                usuario_cpf: usuario?.usu_cpf || null,
                // Dados do responsável
                responsavel_nome: responsavel?.fun_nome || null,
                responsavel_email: responsavel?.fun_email || null,
                // Anexos
                anexos: chamadoAnexos,
                // Etapas (vazio por enquanto)
                etapas: [],
                // Determinar status baseado nos dados
                status: chamado.cha_data_fechamento
                    ? 'resolvido'
                    : chamado.cha_responsavel
                        ? 'em_andamento'
                        : 'pendente',
                // Formatação de endereço
                endereco_completo: chamado.cha_cep && chamado.cha_numero_endereco
                    ? `${chamado.cha_numero_endereco}, CEP: ${chamado.cha_cep}`
                    : chamado.cha_cep || 'Não informado',
            };
            console.log('✅ Resposta montada com sucesso');
            reply.send(response);
        }
        catch (err) {
            console.error('❌ Erro detalhado ao buscar chamado:', err);
            console.error('Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
            reply.status(500).send({
                message: 'Erro ao buscar chamado',
                error: env.NODE_ENV === 'development' ? err.message : undefined,
            });
        }
    });
};
