import bcrypt from 'bcrypt'
import { and, eq } from 'drizzle-orm'
import type { FastifyPluginCallback } from 'fastify'
import { z } from 'zod'
import { db } from '../../../db/index.js'
import { cidades } from '../../../db/schema/cidades.js'
import { usuarios } from '../../../db/schema/usuarios.js'
import { getCPFDuplicateMessage } from '../../../utils/check-duplicate-cpf.js'

function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += Number.parseInt(cpf.charAt(i), 10) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== Number.parseInt(cpf.charAt(9), 10)) return false

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += Number.parseInt(cpf.charAt(i), 10) * (11 - i)
  }
  resto = (soma * 10) % 11
  return (
    (resto === 10 || resto === 11 ? 0 : resto) ===
    Number.parseInt(cpf.charAt(10), 10)
  )
}

export const postUsersRoute: FastifyPluginCallback = (app) => {
  app.post(
    '/users',
    {
      schema: {
        body: z.object({
          nome: z
            .string()
            .min(1, 'Nome é obrigatório')
            .transform((s) => s.trim()),
          cpf: z
            .string()
            .min(11, 'CPF deve ter 11 dígitos')
            .max(14)
            .refine((cpf) => validarCPF(cpf), { message: 'CPF inválido' }),
          email: z
            .string()
            .email('Email inválido')
            .transform((s) => s.toLowerCase().trim()),
          senha: z
            .string()
            .min(6, 'Senha deve ter no mínimo 6 caracteres')
            .refine((s) => /[A-Z]/.test(s), {
              message: 'Senha deve conter pelo menos uma letra maiúscula',
            })
            .refine((s) => /[0-9]/.test(s), {
              message: 'Senha deve conter pelo menos um número',
            }),
          login: z
            .string()
            .min(3, 'Login deve ter no mínimo 3 caracteres')
            .transform((s) => s.trim()),
          data_nascimento: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser YYYY-MM-DD')
            .refine(
              (date) => {
                const birthDate = new Date(date)
                const today = new Date()
                const age = today.getFullYear() - birthDate.getFullYear()
                return age >= 18
              },
              { message: 'Você deve ter pelo menos 18 anos' },
            ),
          endereco: z.object({
            cep: z
              .string()
              .min(8, 'CEP inválido')
              .transform((s) => s.replace(/\D/g, '')),
            logradouro: z.string().min(1, 'Logradouro é obrigatório'),
            numero: z.string().min(1, 'Número é obrigatório'),
            complemento: z.string().optional().default(''),
            bairro: z.string().min(1, 'Bairro é obrigatório'),
            cidadeId: z.string().uuid('ID da cidade inválido'),
            estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
            cidade: z.string().min(1, 'Cidade é obrigatória'),
          }),
        }),
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          nome: string
          cpf: string
          email: string
          senha: string
          login: string
          data_nascimento: string
          endereco: {
            cep: string
            logradouro: string
            numero: string
            complemento?: string
            bairro: string
            cidadeId: string
            estado: string
            cidade: string
          }
        }
        const { nome, cpf, email, senha, login, data_nascimento, endereco } =
          body

        const cidadeExistente = await db
          .select()
          .from(cidades)
          .where(
            and(
              eq(cidades.cid_id, endereco.cidadeId),
              eq(cidades.cid_ativo, true),
            ),
          )
          .then((res) => res[0] || null)

        if (!cidadeExistente) {
          const cidadesAtivas = await db
            .select({
              id: cidades.cid_id,
              nome: cidades.cid_nome,
              estado: cidades.cid_estado,
            })
            .from(cidades)
            .where(eq(cidades.cid_ativo, true))
            .orderBy(cidades.cid_nome)

          return reply.status(400).send({
            message: 'Cidade não encontrada ou inativa',
            cidadesDisponiveis: cidadesAtivas,
            code: 'INVALID_CITY',
          })
        }

        const cpfFormatado = cpf.replace(/\D/g, '')

        // Validar CPF duplicado em todas as tabelas
        const cpfDuplicadoMsg = await getCPFDuplicateMessage(cpfFormatado)
        if (cpfDuplicadoMsg) {
          return reply.status(400).send({
            message: cpfDuplicadoMsg,
            code: 'CPF_ALREADY_EXISTS',
          })
        }

        const emailExistente = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.usu_email, email))
          .then((res) => res[0] || null)

        if (emailExistente) {
          return reply.status(400).send({
            message: 'Email já cadastrado',
            code: 'EMAIL_ALREADY_EXISTS',
          })
        }

        const loginExistente = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.usu_login, login))
          .then((res) => res[0] || null)

        if (loginExistente) {
          return reply.status(400).send({
            message: 'Login já está em uso',
            code: 'LOGIN_ALREADY_EXISTS',
          })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const [novoUsuario] = await db
          .insert(usuarios)
          .values({
            usu_nome: nome,
            usu_cpf: cpfFormatado,
            usu_email: email,
            usu_senha: senhaCriptografada,
            usu_login: login,
            usu_data_nascimento: data_nascimento,
            usu_endereco: {
              ...endereco,
              cidade: cidadeExistente.cid_nome,
            },
            cid_id: endereco.cidadeId,
            usu_tipo: 'municipe',
          })
          .returning()

        return reply.status(201).send({
          ...novoUsuario,
          usu_senha: undefined,
        })
      } catch (error) {
        console.error('Erro no cadastro:', error)
        return reply.status(500).send({
          message: 'Erro interno no servidor',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          code: 'INTERNAL_SERVER_ERROR',
        })
      }
    },
  )
}
