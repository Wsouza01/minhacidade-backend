import bcrypt from 'bcryptjs';
import { eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/index.js';
import { administradores } from '../../../db/schema/administradores.js';
import { cidades } from '../../../db/schema/cidades.js';
import { funcionarios } from '../../../db/schema/funcionarios.js';
import { usuarios } from '../../../db/schema/usuarios.js';
export const authLoginRoute = async (app) => {
    app.post('/auth/login', {
        schema: {
            body: z.object({
                login: z.string().min(1, 'Login é obrigatório'),
                senha: z.string().min(1, 'Senha é obrigatória'),
            }),
            response: {
                200: z.object({
                    success: z.boolean(),
                    message: z.string(),
                    data: z.object({
                        id: z.string(),
                        nome: z.string(),
                        email: z.string(),
                        tipo: z.enum([
                            'admin',
                            'municipe',
                            'atendente',
                            'servidor',
                            'admin-global',
                        ]),
                        departamento: z.string().nullish(),
                        cidadeId: z.string().uuid().nullish(),
                        cidade: z.string().nullish(),
                        endereco: z
                            .object({
                            cep: z.string().nullish(),
                            logradouro: z.string().nullish(),
                            numero: z.string().nullish(),
                            bairro: z.string().nullish(),
                            cidade: z.string().nullish(),
                            cidadeId: z.string().uuid().nullish(),
                            estado: z.string().nullish(),
                        })
                            .passthrough()
                            .nullish(),
                    }),
                }),
                400: z.object({
                    message: z.string(),
                    code: z.string(),
                }),
                401: z.object({
                    message: z.string(),
                    code: z.string(),
                }),
                403: z.object({
                    message: z.string(),
                    code: z.string(),
                }),
                500: z.object({
                    message: z.string(),
                    code: z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        try {
            const { login, senha } = request.body;
            // Primeiro tenta encontrar como administrador (admin global ou admin de cidade)
            const administrador = await db
                .select()
                .from(administradores)
                .where(or(eq(administradores.adm_login, login), eq(administradores.adm_cpf, login), eq(administradores.adm_email, login)))
                .then((res) => res[0]);
            if (administrador) {
                // Verificar se está ativo
                if (!administrador.adm_ativo) {
                    return reply.status(403).send({
                        message: 'Conta desativada',
                        code: 'ACCOUNT_DISABLED',
                    });
                }
                // Verificar bloqueio
                if (administrador.adm_bloqueado_ate &&
                    administrador.adm_bloqueado_ate > new Date()) {
                    return reply.status(403).send({
                        message: 'Conta temporariamente bloqueada',
                        code: 'ACCOUNT_LOCKED',
                    });
                }
                // Verificar senha
                const senhaCorreta = await bcrypt.compare(senha, administrador.adm_senha);
                if (!senhaCorreta) {
                    const tentativas = (administrador.adm_tentativas_login || 0) + 1;
                    const bloquearAte = tentativas >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
                    await db
                        .update(administradores)
                        .set({
                        adm_tentativas_login: tentativas,
                        adm_bloqueado_ate: bloquearAte,
                    })
                        .where(eq(administradores.adm_id, administrador.adm_id));
                    return reply.status(401).send({
                        message: `Senha incorreta. ${Math.max(0, 5 - tentativas)} tentativa(s) restante(s)`,
                        code: 'INVALID_CREDENTIALS',
                    });
                }
                // Login bem-sucedido - resetar tentativas
                await db
                    .update(administradores)
                    .set({
                    adm_tentativas_login: 0,
                    adm_bloqueado_ate: null,
                })
                    .where(eq(administradores.adm_id, administrador.adm_id));
                // Determinar tipo: admin-global (sem cidade) ou admin (com cidade)
                const tipo = administrador.cid_id ? 'admin' : 'admin-global';
                return reply.send({
                    success: true,
                    message: 'Login realizado com sucesso',
                    data: {
                        id: administrador.adm_id,
                        nome: administrador.adm_nome,
                        email: administrador.adm_email,
                        tipo,
                        departamento: null,
                        cidadeId: administrador.cid_id,
                    },
                });
            }
            // Segundo tenta encontrar como usuário (munícipe)
            const usuario = await db
                .select()
                .from(usuarios)
                .where(or(eq(usuarios.usu_login, login), eq(usuarios.usu_cpf, login), eq(usuarios.usu_email, login)))
                .then((res) => res[0]);
            if (usuario) {
                // Verificar se está ativo
                if (!usuario.usu_ativo) {
                    return reply.status(403).send({
                        message: 'Conta desativada',
                        code: 'ACCOUNT_DISABLED',
                    });
                }
                // Verificar bloqueio
                if (usuario.usu_bloqueado_ate &&
                    usuario.usu_bloqueado_ate > new Date()) {
                    return reply.status(403).send({
                        message: 'Conta temporariamente bloqueada',
                        code: 'ACCOUNT_LOCKED',
                    });
                }
                // Verificar senha
                const senhaCorreta = await bcrypt.compare(senha, usuario.usu_senha);
                if (!senhaCorreta) {
                    const tentativas = (usuario.usu_tentativas_login || 0) + 1;
                    const bloquearAte = tentativas >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
                    await db
                        .update(usuarios)
                        .set({
                        usu_tentativas_login: tentativas,
                        usu_bloqueado_ate: bloquearAte,
                    })
                        .where(eq(usuarios.usu_id, usuario.usu_id));
                    return reply.status(401).send({
                        message: `Senha incorreta. ${Math.max(0, 5 - tentativas)} tentativa(s) restante(s)`,
                        code: 'INVALID_CREDENTIALS',
                    });
                }
                // Login bem-sucedido - resetar tentativas
                await db
                    .update(usuarios)
                    .set({
                    usu_tentativas_login: 0,
                    usu_bloqueado_ate: null,
                })
                    .where(eq(usuarios.usu_id, usuario.usu_id));
                const endereco = (usuario.usu_endereco ?? null);
                let resolvedCidadeId = usuario.cid_id ?? endereco?.cidadeId ?? null;
                let resolvedCidadeNome = endereco?.cidade ?? null;
                if (!resolvedCidadeId && endereco?.cidade) {
                    const cidadeMatch = await db
                        .select({
                        id: cidades.cid_id,
                        nome: cidades.cid_nome,
                    })
                        .from(cidades)
                        .where(ilike(cidades.cid_nome, endereco.cidade))
                        .limit(1)
                        .then((res) => res[0] || null);
                    if (cidadeMatch) {
                        resolvedCidadeId = cidadeMatch.id;
                        resolvedCidadeNome = cidadeMatch.nome;
                        await db
                            .update(usuarios)
                            .set({ cid_id: cidadeMatch.id })
                            .where(eq(usuarios.usu_id, usuario.usu_id));
                    }
                    else {
                        resolvedCidadeNome = endereco.cidade;
                    }
                }
                if (resolvedCidadeId && !resolvedCidadeNome) {
                    const cidadeAtual = await db
                        .select({ nome: cidades.cid_nome })
                        .from(cidades)
                        .where(eq(cidades.cid_id, resolvedCidadeId))
                        .limit(1)
                        .then((res) => res[0] || null);
                    resolvedCidadeNome = cidadeAtual?.nome ?? resolvedCidadeNome;
                }
                return reply.send({
                    success: true,
                    message: 'Login realizado com sucesso',
                    data: {
                        id: usuario.usu_id,
                        nome: usuario.usu_nome,
                        email: usuario.usu_email,
                        tipo: usuario.usu_tipo,
                        departamento: null,
                        cidadeId: resolvedCidadeId,
                        cidade: resolvedCidadeNome,
                        endereco,
                    },
                });
            }
            // Se não encontrou como usuário, tenta como funcionário (atendente ou servidor)
            const funcionario = await db
                .select({
                fun_id: funcionarios.fun_id,
                fun_nome: funcionarios.fun_nome,
                fun_email: funcionarios.fun_email,
                fun_cpf: funcionarios.fun_cpf,
                fun_data_nascimento: funcionarios.fun_data_nascimento,
                fun_criado: funcionarios.fun_criado,
                fun_login: funcionarios.fun_login,
                fun_senha: funcionarios.fun_senha,
                fun_matricula: funcionarios.fun_matricula,
                fun_tipo: funcionarios.fun_tipo,
                fun_ativo: funcionarios.fun_ativo,
                dep_id: funcionarios.dep_id,
                cid_id: funcionarios.cid_id,
            })
                .from(funcionarios)
                .where(or(eq(funcionarios.fun_login, login), eq(funcionarios.fun_cpf, login), eq(funcionarios.fun_email, login)))
                .then((res) => res[0]);
            if (!funcionario) {
                return reply.status(401).send({
                    message: 'Credenciais inválidas',
                    code: 'INVALID_CREDENTIALS',
                });
            }
            // Verificar se está ativo
            if (!funcionario.fun_ativo) {
                return reply.status(403).send({
                    message: 'Conta desativada',
                    code: 'ACCOUNT_DISABLED',
                });
            }
            // Verificar senha do funcionário
            const senhaCorreta = await bcrypt.compare(senha, funcionario.fun_senha);
            if (!senhaCorreta) {
                return reply.status(401).send({
                    message: 'Senha incorreta',
                    code: 'INVALID_CREDENTIALS',
                });
            }
            return reply.send({
                success: true,
                message: 'Login realizado com sucesso',
                data: {
                    id: funcionario.fun_id,
                    nome: funcionario.fun_nome,
                    email: funcionario.fun_email,
                    tipo: funcionario.fun_tipo,
                    departamento: funcionario.dep_id || null,
                    cidadeId: funcionario.cid_id,
                },
            });
        }
        catch (error) {
            console.error('Erro no login:', error);
            return reply.status(500).send({
                message: 'Erro interno no servidor',
                code: 'INTERNAL_SERVER_ERROR',
            });
        }
    });
};
