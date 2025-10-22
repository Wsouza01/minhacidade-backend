import bcrypt from "bcryptjs"
import type { FastifyPluginCallback } from "fastify"
import { z } from "zod"
import { db } from "../../../db/connection.ts"
import { administradores } from "../../../db/schema/administradores.ts"

export const postAdministradoresRoute: FastifyPluginCallback = (app) => {
  app.post(
    "/administradores",
    {
      schema: {
        body: z.object({
          nome: z.string().min(3),
          email: z.string().email(),
          cpf: z.string().length(14), // formato: XXX.XXX.XXX-XX
          dataNascimento: z.string(), // YYYY-MM-DD
          login: z.string().min(3),
          senha: z.string().min(6),
          cidadeId: z.string().uuid().nullable(), // null = admin global
          ativo: z.boolean().optional().default(true),
        }),
        response: {
          201: z.object({
            id: z.string().uuid(),
            nome: z.string(),
            email: z.string(),
            cpf: z.string(),
            login: z.string(),
            ativo: z.boolean(),
            cidadeId: z.string().uuid().nullable(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          nome,
          email,
          cpf,
          dataNascimento,
          login,
          senha,
          cidadeId,
          ativo,
        } = request.body

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10)

        // Criar administrador
        const [novoAdmin] = await db
          .insert(administradores)
          .values({
            adm_nome: nome,
            adm_email: email,
            adm_cpf: cpf,
            adm_data_nascimento: new Date(dataNascimento),
            adm_login: login,
            adm_senha: senhaHash,
            cid_id: cidadeId,
            adm_ativo: ativo,
          })
          .returning({
            id: administradores.adm_id,
            nome: administradores.adm_nome,
            email: administradores.adm_email,
            cpf: administradores.adm_cpf,
            login: administradores.adm_login,
            ativo: administradores.adm_ativo,
            cidadeId: administradores.cid_id,
          })

        return reply.status(201).send(novoAdmin)
      } catch (error) {
        console.error("Erro ao criar administrador:", error)

        // Verificar erro de unicidade
        if (error instanceof Error && error.message.includes("unique")) {
          return reply.status(400).send({
            message:
              "Email, CPF ou login já cadastrado. Verifique os dados e tente novamente.",
            code: "DUPLICATE_ENTRY",
          })
        }

        return reply.status(500).send({
          message: "Erro ao criar administrador",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  )
}
