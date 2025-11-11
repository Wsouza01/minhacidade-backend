import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";
import type { FastifyPluginCallback } from "fastify";
import { z } from "zod";
import { db } from "../../../db/index.ts";
import { usuarios } from "../../../db/schema/usuarios.ts";

export const loginRoute: FastifyPluginCallback = (app) => {
  app.post(
    "/login",
    {
      schema: {
        body: z.object({
          login: z.string().min(3, "Login deve ter pelo menos 3 caracteres"),
          senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
          tipo: z.enum(["municipe", "servidor"]),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { login, senha, tipo } = request.body as {
          login: string;
          senha: string;
          tipo: string;
        };
        const agora = new Date();

        const usuario = await db
          .select({
            usu_id: usuarios.usu_id,
            usu_senha: usuarios.usu_senha,
            usu_tipo: usuarios.usu_tipo,
            usu_nome: usuarios.usu_nome,
            usu_ativo: usuarios.usu_ativo,
            usu_tentativas_login: usuarios.usu_tentativas_login,
            usu_bloqueado_ate: usuarios.usu_bloqueado_ate,
          })
          .from(usuarios)
          .where(
            or(
              eq(usuarios.usu_login, login),
              eq(usuarios.usu_cpf, login),
              eq(usuarios.usu_email, login)
            )
          )
          .then((res) => res[0]);

        if (!usuario) {
          return reply.status(401).send({
            message: "Credenciais inválidas",
            code: "INVALID_CREDENTIALS",
          });
        }

        if (usuario.usu_bloqueado_ate && usuario.usu_bloqueado_ate > agora) {
          return reply.status(403).send({
            message:
              "Conta temporariamente bloqueada devido a muitas tentativas falhas",
            code: "ACCOUNT_TEMPORARILY_LOCKED",
          });
        }

        if (!usuario.usu_ativo) {
          return reply.status(403).send({
            message: "Conta desativada",
            code: "ACCOUNT_DISABLED",
          });
        }

        const tipoValido =
          usuario.usu_tipo === tipo ||
          (tipo === "servidor" && usuario.usu_tipo === "admin");

        if (!tipoValido) {
          return reply.status(403).send({
            message: "Acesso não autorizado para este perfil",
            code: "UNAUTHORIZED_PROFILE",
          });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.usu_senha);

        if (!senhaCorreta) {
          const tentativas = (usuario.usu_tentativas_login || 0) + 1;
          const bloquearAte =
            tentativas >= 5 ? new Date(agora.getTime() + 30 * 60 * 1000) : null;

          await db
            .update(usuarios)
            .set({
              usu_tentativas_login: tentativas,
              usu_bloqueado_ate: bloquearAte,
            })
            .where(eq(usuarios.usu_id, usuario.usu_id));

          return reply.status(401).send({
            message: `Credenciais inválidas. ${
              5 - tentativas
            } tentativa(s) restante(s)`,
            code: "INVALID_CREDENTIALS",
          });
        }

        await db
          .update(usuarios)
          .set({
            usu_tentativas_login: 0,
            usu_bloqueado_ate: null,
          })
          .where(eq(usuarios.usu_id, usuario.usu_id));

        return reply.send({
          success: true,
          message: "Login realizado com sucesso",
          data: {
            id: usuario.usu_id,
            tipo: usuario.usu_tipo,
            nome: usuario.usu_nome,
          },
        });
      } catch (error) {
        console.error("Erro no login:", error);
        return reply.status(500).send({
          message: "Erro interno no servidor",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }
  );
};
