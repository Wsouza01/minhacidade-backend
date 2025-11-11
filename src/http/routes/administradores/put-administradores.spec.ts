import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import Fastify from 'fastify'
import request from 'supertest'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { db } from '../../../db/index.ts'
import { administradores } from '../../../db/schema/administradores.ts'
import { putAdministradoresRoute } from './put-administradores.ts'

// 🧩 Mock do banco
vi.mock('../../../db/index', () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([
        {
          id: 'c6d5a3d6-9c6a-4a40-b8a7-8153f0e9f7a1',
          nome: 'João Atualizado',
          email: 'joao@novo.com',
          cpf: '123.456.789-10',
          login: 'joaoupdate',
          ativo: true,
          cidadeId: null,
        },
      ]),
    })),
  },
}))

// 🧩 Mock do bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashedNewPassword'),
  },
}))

// 🧩 Mock do drizzle
vi.mock('drizzle-orm', async () => {
  const actual =
    await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm')
  return {
    ...actual,
    eq: vi.fn((a, b) => ({ field: a, value: b })),
  }
})

describe('PUT /administradores/:id (Supertest)', () => {
  const app = Fastify()
  app.register(putAdministradoresRoute)

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve atualizar um administrador com sucesso', async () => {
    const response = await request(app.server)
      .put('/administradores/c6d5a3d6-9c6a-4a40-b8a7-8153f0e9f7a1')
      .send({
        nome: 'João Atualizado',
        email: 'joao@novo.com',
        login: 'joaoupdate',
        senha: 'novaSenha',
      })
      .expect(200)

    expect(response.body).toMatchObject({
      nome: 'João Atualizado',
      email: 'joao@novo.com',
      login: 'joaoupdate',
      ativo: true,
    })

    expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha', 10)
    expect(db.update).toHaveBeenCalledWith(administradores)
    expect(eq).toHaveBeenCalled()
  })

  it('deve retornar 404 se o administrador não for encontrado', async () => {
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    } as any)

    const response = await request(app.server)
      .put('/administradores/11111111-1111-1111-1111-111111111111')
      .send({ nome: 'Desconhecido' })
      .expect(404)

    expect(response.body).toMatchObject({
      message: 'Administrador não encontrado',
    })
  })

  it('deve retornar 400 em caso de duplicidade (email, cpf, login)', async () => {
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi
        .fn()
        .mockRejectedValueOnce(
          new Error('duplicate key value violates unique constraint'),
        ),
    } as any)

    const response = await request(app.server)
      .put('/administradores/c6d5a3d6-9c6a-4a40-b8a7-8153f0e9f7a1')
      .send({ email: 'duplicado@teste.com' })
      .expect(400)

    expect(response.body).toMatchObject({
      code: 'DUPLICATE_ENTRY',
    })
  })

  it('deve retornar 500 em erro inesperado', async () => {
    vi.mocked(db.update).mockReturnValueOnce({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockRejectedValueOnce(new Error('Erro genérico')),
    } as any)

    const response = await request(app.server)
      .put('/administradores/c6d5a3d6-9c6a-4a40-b8a7-8153f0e9f7a1')
      .send({ nome: 'Erro Teste' })
      .expect(500)

    expect(response.body.message).toBe('Erro ao atualizar administrador')
  })
})
