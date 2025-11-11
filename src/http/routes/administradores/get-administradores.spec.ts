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
import { getAdministradoresRoute } from './get-administradores.ts'

// 🧩 Mock do banco
vi.mock('../../../db/index', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    })),
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

describe('GET /administradores (Supertest)', () => {
  const app = Fastify()
  app.register(getAdministradoresRoute)

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar a lista de administradores com sucesso', async () => {
    const mockData = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        nome: 'Maria Souza',
        email: 'maria@example.com',
        cpf: '111.222.333-44',
        login: 'mariasouza',
        ativo: true,
        criado: new Date('2024-10-20'),
        cidadeId: '321e4567-e89b-12d3-a456-426614174999',
        cidadeNome: 'São Paulo',
        cidadeEstado: 'SP',
      },
    ]

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockResolvedValueOnce(mockData),
      where: vi.fn().mockReturnThis(),
    } as any)

    const response = await request(app.server)
      .get('/administradores')
      .expect(200)
    const body = response.body

    expect(Array.isArray(body)).toBe(true)
    expect(body[0]).toMatchObject({
      nome: 'Maria Souza',
      email: 'maria@example.com',
      cidade: { nome: 'São Paulo', estado: 'SP' },
    })

    expect(db.select).toHaveBeenCalled()
  })

  it('deve aplicar filtros por cidadeId e ativo', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockResolvedValueOnce([]),
      where: vi.fn().mockReturnThis(),
    } as any)

    const response = await request(app.server)
      .get(
        '/administradores?cidadeId=321e4567-e89b-12d3-a456-426614174999&ativo=true',
      )
      .expect(200)

    expect(response.body).toEqual([])
    expect(eq).toHaveBeenCalled()
  })

  it('deve retornar erro 500 se ocorrer exceção', async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error('Falha no banco')
    })

    const response = await request(app.server)
      .get('/administradores')
      .expect(500)
    expect(response.body.message).toBe('Erro ao buscar administradores')
  })
})

describe('GET /administradores/:id (Supertest)', () => {
  const app = Fastify()
  app.register(getAdministradoresRoute)

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar um administrador específico com sucesso', async () => {
    const mockData = [
      {
        id: '999e4567-e89b-12d3-a456-426614174111',
        nome: 'João Silva',
        email: 'joao@example.com',
        cpf: '123.456.789-10',
        dataNascimento: new Date('1990-01-01'),
        login: 'joaosilva',
        ativo: true,
        criado: new Date('2024-10-21'),
        cidadeId: '555e4567-e89b-12d3-a456-426614174222',
        cidadeNome: 'Campinas',
        cidadeEstado: 'SP',
      },
    ]

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValueOnce(mockData),
    } as any)

    const response = await request(app.server)
      .get('/administradores/999e4567-e89b-12d3-a456-426614174111')
      .expect(200)

    expect(response.body).toMatchObject({
      nome: 'João Silva',
      email: 'joao@example.com',
      cidade: { nome: 'Campinas', estado: 'SP' },
    })
  })

  it('deve retornar 404 se o administrador não for encontrado', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValueOnce([]),
    } as any)

    const response = await request(app.server)
      .get('/administradores/00000000-0000-0000-0000-000000000000')
      .expect(404)

    expect(response.body).toMatchObject({
      message: 'Administrador não encontrado',
    })
  })

  it('deve retornar erro 500 em exceção inesperada', async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error('Erro genérico')
    })

    const response = await request(app.server)
      .get('/administradores/999e4567-e89b-12d3-a456-426614174111')
      .expect(500)

    expect(response.body.message).toBe('Erro ao buscar administrador')
  })
})
