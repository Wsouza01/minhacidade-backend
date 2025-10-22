import bcrypt from "bcryptjs"
import { eq, or } from "drizzle-orm"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { administradores } from "../../../db/schema/administradores.ts"
import { funcionarios } from "../../../db/schema/funcionarios.ts"
import { usuarios } from "../../../db/schema/usuarios.ts"

export const authLoginRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/auth/login",
    {
      schema: {
        body: z.object({
          login: z.string().min(1, "Login é obrigatório"),
          senha: z.string().min(1, "Senha é obrigatória"),
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
                "admin",
                "municipe",
                "atendente",
                "servidor",
                "admin-global",
              ]),
              departamento: z.string().optional(),
              cidadeId: z.string().uuid().optional(),
            }),
          }),
          401: z.object({
            message: z.string(),
            code: z.string(),
          }),
          403: z.object({
            message: z.string(),
            code: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { login, senha } = request.body

        // Primeiro tenta encontrar como administrador (admin global ou admin de cidade)
        const administrador = await db
          .select()
          .from(administradores)
          .where(
            or(
              eq(administradores.adm_login, login),
              eq(administradores.adm_cpf, login),
              eq(administradores.adm_email, login)
            )
          )
          .then((res) => res[0])

        if (administrador) {
          // Verificar se está ativo
          if (!administrador.adm_ativo) {
            return reply.status(403).send({
              message: "Conta desativada",
              code: "ACCOUNT_DISABLED",
            })
          }

          // Verificar bloqueio
          if (
            administrador.adm_bloqueado_ate &&
            administrador.adm_bloqueado_ate > new Date()
          ) {
            return reply.status(403).send({
              message: "Conta temporariamente bloqueada",
              code: "ACCOUNT_LOCKED",
            })
          }

          // Verificar senha
          const senhaCorreta = await bcrypt.compare(
            senha,
            administrador.adm_senha
          )

          if (!senhaCorreta) {
            const tentativas = (administrador.adm_tentativas_login || 0) + 1
            const bloquearAte =
              tentativas >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null

            await db
              .update(administradores)
              .set({
                adm_tentativas_login: tentativas,
                adm_bloqueado_ate: bloquearAte,
              })
              .where(eq(administradores.adm_id, administrador.adm_id))

            return reply.status(401).send({
              message: `Senha incorreta. ${Math.max(0, 5 - tentativas)} tentativa(s) restante(s)`,
              code: "INVALID_CREDENTIALS",
            })
          }

          // Login bem-sucedido - resetar tentativas
          await db
            .update(administradores)
            .set({
              adm_tentativas_login: 0,
              adm_bloqueado_ate: null,
            })
            .where(eq(administradores.adm_id, administrador.adm_id))

          // Determinar tipo: admin-global (sem cidade) ou admin (com cidade)
          const tipo = administrador.cid_id ? "admin" : "admin-global"

          return reply.send({
            success: true,
            message: "Login realizado com sucesso",
            data: {
              id: administrador.adm_id,
              nome: administrador.adm_nome,
              email: administrador.adm_email,
              tipo,
              departamento: undefined,
              cidadeId: administrador.cid_id || undefined,
            },
          })
        }

        // Segundo tenta encontrar como usuário (munícipe)
        const usuario = await db
          .select()
          .from(usuarios)
          .where(
            or(
              eq(usuarios.usu_login, login),
              eq(usuarios.usu_cpf, login),
              eq(usuarios.usu_email, login)
            )
          )
          .then((res) => res[0])

        if (usuario) {
          // Verificar se está ativo
          if (!usuario.usu_ativo) {
            return reply.status(403).send({
              message: "Conta desativada",
              code: "ACCOUNT_DISABLED",
            })
          }

          // Verificar bloqueio
          if (
            usuario.usu_bloqueado_ate &&
            usuario.usu_bloqueado_ate > new Date()
          ) {
            return reply.status(403).send({
              message: "Conta temporariamente bloqueada",
              code: "ACCOUNT_LOCKED",
            })
          }

          // Verificar senha
          const senhaCorreta = await bcrypt.compare(senha, usuario.usu_senha)

          if (!senhaCorreta) {
            const tentativas = (usuario.usu_tentativas_login || 0) + 1
            const bloquearAte =
              tentativas >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null

            await db
              .update(usuarios)
              .set({
                usu_tentativas_login: tentativas,
                usu_bloqueado_ate: bloquearAte,
              })
              .where(eq(usuarios.usu_id, usuario.usu_id))

            return reply.status(401).send({
              message: `Senha incorreta. ${Math.max(0, 5 - tentativas)} tentativa(s) restante(s)`,
              code: "INVALID_CREDENTIALS",
            })
          }

          // Login bem-sucedido - resetar tentativas
          await db
            .update(usuarios)
            .set({
              usu_tentativas_login: 0,
              usu_bloqueado_ate: null,
            })
            .where(eq(usuarios.usu_id, usuario.usu_id))

          return reply.send({
            success: true,
            message: "Login realizado com sucesso",
            data: {
              id: usuario.usu_id,
              nome: usuario.usu_nome,
              email: usuario.usu_email,
              tipo: usuario.usu_tipo,
              departamento: undefined,
              cidadeId: usuario.cid_id || undefined,
            },
          })
        }

        // Se não encontrou como usuário, tenta como funcionário (atendente ou servidor)
        const funcionario = await db
          .select()
          .from(funcionarios)
          .where(
            or(
              eq(funcionarios.fun_login, login),
              eq(funcionarios.fun_cpf, login),
              eq(funcionarios.fun_email, login)
            )
          )
          .then((res) => res[0])

        if (!funcionario) {
          return reply.status(401).send({
            message: "Credenciais inválidas",
            code: "INVALID_CREDENTIALS",
          })
        }

        // Verificar se está ativo
        if (!funcionario.fun_ativo) {
          return reply.status(403).send({
            message: "Conta desativada",
            code: "ACCOUNT_DISABLED",
          })
        }

        // Verificar senha do funcionário
        const senhaCorreta = await bcrypt.compare(senha, funcionario.fun_senha)

        if (!senhaCorreta) {
          return reply.status(401).send({
            message: "Senha incorreta",
            code: "INVALID_CREDENTIALS",
          })
        }

        return reply.send({
          success: true,
          message: "Login realizado com sucesso",
          data: {
            id: funcionario.fun_id,
            nome: funcionario.fun_nome,
            email: funcionario.fun_email,
            tipo: funcionario.fun_tipo,
            departamento: funcionario.dep_id,
            cidadeId: funcionario.cid_id || undefined,
          },
        })
      } catch (error) {
        console.error("Erro no login:", error)
        return reply.status(500).send({
          message: "Erro interno no servidor",
          code: "INTERNAL_SERVER_ERROR",
        })
      }
    }
  )
}
