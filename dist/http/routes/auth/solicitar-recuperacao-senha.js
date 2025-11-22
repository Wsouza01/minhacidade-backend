import { randomBytes } from 'node:crypto';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { funcionarios } from '../../../db/schema/funcionarios.js';
import { tokensRecuperacao } from '../../../db/schema/tokens-recuperacao.js';
import { usuarios } from '../../../db/schema/usuarios.js';
import { gerarEmailRecuperacaoSenha, sendEmail, } from '../../../services/email.js';
export async function solicitarRecuperacaoSenhaRoute(app) {
    app.withTypeProvider().post('/auth/solicitar-recuperacao-senha', {
        schema: {
            tags: ['auth'],
            summary: 'Solicitar recuperação de senha',
            body: z.object({
                identificador: z.string().min(1, 'Identificador é obrigatório'),
            }),
            response: {
                200: z.object({
                    message: z.string(),
                    emailEnviado: z.boolean(),
                }),
                404: z.object({
                    message: z.string(),
                }),
                500: z.object({
                    message: z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { identificador } = request.body;
        try {
            // Remove caracteres especiais do CPF (se for CPF)
            const identificadorLimpo = identificador.replace(/[.\-/]/g, '');
            // Buscar em usuários (por CPF, email ou login)
            const usuarioEncontrado = await db
                .select()
                .from(usuarios)
                .where(or(eq(usuarios.usu_cpf, identificadorLimpo), eq(usuarios.usu_email, identificador), eq(usuarios.usu_login, identificador)))
                .limit(1);
            // Buscar em funcionários (por CPF, email ou matrícula)
            const funcionarioEncontrado = await db
                .select()
                .from(funcionarios)
                .where(or(eq(funcionarios.fun_cpf, identificadorLimpo), eq(funcionarios.fun_email, identificador), eq(funcionarios.fun_login, identificador)))
                .limit(1);
            // Se não encontrou em nenhuma tabela
            if (usuarioEncontrado.length === 0 &&
                funcionarioEncontrado.length === 0) {
                return reply.status(404).send({
                    message: 'Usuário não encontrado com o identificador fornecido',
                });
            }
            // Determinar qual foi encontrado
            const usuario = usuarioEncontrado[0];
            const funcionario = funcionarioEncontrado[0];
            const email = usuario ? usuario.usu_email : funcionario.fun_email;
            const nome = usuario ? usuario.usu_nome : funcionario.fun_nome;
            const tipoUsuario = usuario ? 'usuario' : 'funcionario';
            // Gerar token único
            const token = randomBytes(32).toString('hex');
            // Definir expiração (1 hora)
            const expiraEm = new Date();
            expiraEm.setHours(expiraEm.getHours() + 1);
            // Salvar token no banco
            await db.insert(tokensRecuperacao).values({
                tok_token: token,
                tok_email: email,
                tok_tipo_usuario: tipoUsuario,
                tok_expira_em: expiraEm,
            });
            // Gerar conteúdo do email
            const emailContent = gerarEmailRecuperacaoSenha(nome, token);
            // Enviar email
            const resultado = await sendEmail({
                to: email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
            });
            if (!resultado.success) {
                return reply.status(500).send({
                    message: 'Erro ao enviar email de recuperação',
                });
            }
            return reply.status(200).send({
                message: `Email de recuperação enviado para ${email}`,
                emailEnviado: true,
            });
        }
        catch (error) {
            console.error('[RECUPERACAO] Erro:', error);
            return reply.status(500).send({
                message: 'Erro ao processar solicitação de recuperação',
            });
        }
    });
}
