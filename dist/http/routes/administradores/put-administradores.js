import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { administradores } from '../../../db/schema/administradores.js';
import { getCPFDuplicateMessage } from '../../../utils/check-duplicate-cpf.js';
import { hashCPF } from '../../../utils/cpfHash.js';
export const putAdministradoresRoute = (app) => {
    app.put('/administradores/:id', {
        schema: {
            params: z.object({
                id: z.string().uuid(),
            }),
            body: z.object({
                nome: z.string().min(3).optional(),
                email: z.string().email().optional(),
                cpf: z.string().length(14).optional(),
                dataNascimento: z.string().optional(),
                login: z.string().min(3).optional(),
                senha: z.string().min(6).optional(),
                cidadeId: z.string().uuid().nullable().optional(),
                ativo: z.boolean().optional(),
            }),
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { nome, email, cpf, dataNascimento, login, senha, cidadeId, ativo, } = request.body;
            // Validar CPF duplicado se estiver sendo alterado
            if (cpf) {
                const cpfSemFormatacao = cpf.replace(/\D/g, '');
                const cpfDuplicadoMsg = await getCPFDuplicateMessage(cpfSemFormatacao, id);
                if (cpfDuplicadoMsg) {
                    return reply.status(400).send({
                        message: cpfDuplicadoMsg,
                    });
                }
            }
            // Preparar dados para atualização
            const updateData = {};
            if (nome)
                updateData.adm_nome = nome;
            if (email)
                updateData.adm_email = email;
            if (cpf)
                updateData.adm_cpf = await hashCPF(cpf.replace(/\D/g, ''));
            if (dataNascimento)
                updateData.adm_data_nascimento = dataNascimento;
            if (login)
                updateData.adm_login = login;
            if (cidadeId !== undefined)
                updateData.cid_id = cidadeId;
            if (ativo !== undefined)
                updateData.adm_ativo = ativo;
            // Hash da nova senha se fornecida
            if (senha) {
                updateData.adm_senha = await bcrypt.hash(senha, 10);
            }
            // Atualizar administrador
            const [adminAtualizado] = await db
                .update(administradores)
                .set(updateData)
                .where(eq(administradores.adm_id, id))
                .returning({
                id: administradores.adm_id,
                nome: administradores.adm_nome,
                email: administradores.adm_email,
                cpf: administradores.adm_cpf,
                login: administradores.adm_login,
                ativo: administradores.adm_ativo,
                cidadeId: administradores.cid_id,
            });
            if (!adminAtualizado) {
                return reply.status(404).send({
                    message: 'Administrador não encontrado',
                });
            }
            return reply.send(adminAtualizado);
        }
        catch (error) {
            console.error('Erro ao atualizar administrador:', error);
            // Verificar erro de unicidade
            if (error instanceof Error && error.message.includes('unique')) {
                return reply.status(400).send({
                    message: 'Email, CPF ou login já cadastrado. Verifique os dados e tente novamente.',
                    code: 'DUPLICATE_ENTRY',
                });
            }
            return reply.status(500).send({
                message: 'Erro ao atualizar administrador',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
};
