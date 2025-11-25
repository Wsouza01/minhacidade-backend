import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { schema } from '../../../db/schema/index.js';
import { getCPFDuplicateMessage } from '../../../utils/check-duplicate-cpf.js';
import { hashCPF } from '../../../utils/cpfHash.js';
export const putFuncionariosRoute = (app) => {
    app.put('/funcionarios/:id', {
        schema: {
            params: z.object({
                id: z.string().uuid('ID inválido'),
            }),
            body: z.object({
                nome: z.string().optional(),
                email: z.string().email().optional(),
                cpf: z.string().min(11).optional(),
                dataNascimento: z.string().optional(),
                matricula: z.string().optional(),
                tipo: z.enum(['atendente', 'servidor']).optional(),
                senha: z.string().min(6).optional(),
                departamentoId: z.string().uuid().nullable().optional(),
                cidadeId: z.string().uuid().nullable().optional(),
            }),
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const { nome, email, cpf, dataNascimento, matricula, tipo, senha, departamentoId, cidadeId, } = request.body;
        // Verifica se funcionário existe
        const funcionario = await db
            .select()
            .from(schema.funcionarios)
            .where(eq(schema.funcionarios.fun_id, id))
            .limit(1);
        if (funcionario.length === 0) {
            return reply.status(404).send({
                message: 'Funcionário não encontrado',
            });
        }
        // Validar CPF duplicado se estiver sendo alterado
        if (cpf !== undefined) {
            const cpfSemFormatacao = cpf.replace(/\D/g, '');
            const cpfDuplicadoMsg = await getCPFDuplicateMessage(cpfSemFormatacao, id);
            if (cpfDuplicadoMsg) {
                return reply.status(400).send({
                    message: cpfDuplicadoMsg,
                });
            }
        }
        // Prepara dados para atualizar
        const updateData = {};
        if (nome !== undefined)
            updateData.fun_nome = nome;
        if (email !== undefined)
            updateData.fun_email = email;
        if (cpf !== undefined)
            updateData.fun_cpf = await hashCPF(cpf.replace(/\D/g, ''));
        // Atualiza funcionário
        await db
            .update(schema.funcionarios)
            .set(updateData)
            .where(eq(schema.funcionarios.fun_id, id));
        return reply.status(200).send({
            message: 'Funcionário atualizado com sucesso',
        });
    });
};
