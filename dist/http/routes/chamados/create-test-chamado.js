import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { categorias } from '../../../db/schema/categorias.js';
import { chamados } from '../../../db/schema/chamados.js';
import { departamentos } from '../../../db/schema/departamentos.js';
import { usuarios } from '../../../db/schema/usuarios.js';
const createTestChamadoRequestSchema = z.object({
    cpf: z.string().min(11).max(11),
});
export const createTestChamadoRoute = (app) => {
    app.post('/chamados/test/:cpf', {
        schema: {
            params: createTestChamadoRequestSchema,
        },
    }, async (request, reply) => {
        try {
            const { cpf } = request.params;
            // Buscar usuário por CPF
            const user = await db
                .select()
                .from(usuarios)
                .where(eq(usuarios.usu_cpf, cpf))
                .limit(1);
            if (user.length === 0) {
                return reply.status(404).send({ error: 'Usuário não encontrado' });
            }
            // Buscar primeiro departamento disponível
            const departamento = await db.select().from(departamentos).limit(1);
            if (departamento.length === 0) {
                return reply
                    .status(404)
                    .send({ error: 'Nenhum departamento encontrado' });
            }
            // Buscar primeira categoria disponível
            const categoria = await db.select().from(categorias).limit(1);
            // Criar chamado de teste
            const novoChamado = await db
                .insert(chamados)
                .values({
                cha_nome: 'Chamado de Teste - Iluminação Pública',
                cha_titulo: 'Poste queimado na Rua Principal',
                cha_descricao: 'Poste de iluminação pública queimado na Rua Principal, altura do número 123. A rua está muito escura à noite, causando insegurança para os moradores.',
                cha_prioridade: 'Média',
                cha_cep: '12345-678',
                cha_numero_endereco: '123',
                cha_departamento: departamento[0].dep_id,
                usu_id: user[0].usu_id,
                cat_id: categoria.length > 0 ? categoria[0].cat_id : null,
            })
                .returning();
            console.log('✅ Chamado de teste criado:', novoChamado[0]);
            reply.send({
                message: 'Chamado de teste criado com sucesso',
                chamado: novoChamado[0],
                usuario: {
                    id: user[0].usu_id,
                    nome: user[0].usu_nome,
                    cpf: user[0].usu_cpf,
                },
            });
        }
        catch (error) {
            console.error('Erro ao criar chamado de teste:', error);
            reply.status(500).send({ message: 'Erro ao criar chamado de teste' });
        }
    });
};
