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
import { deleteAdministradoresRoute } from './delete-administradores.ts'

// 🧩 Mock do banco
vi.mock('../../../db/index', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi
        .fn()
        .mockResolvedValue([
          { adm_id: '111e4567-e89b-12d3-a456-426614174000' },
        ]),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
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

describe('DELETE /administradores/:id (Supertest + Vitest)', () => {
  const app = Fastify()
  app.register(deleteAdministradoresRoute)

  // Inicializar servidor para Supertest
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve deletar um administrador com sucesso', async () => {
    const response = await request(app.server)
      .delete('/administradores/111e4567-e89b-12d3-a456-426614174000')
      .expect(200)

    expect(response.body).toMatchObject({
      message: 'Administrador deletado com sucesso',
    })

    expect(db.select).toHaveBeenCalled()
    expect(db.delete).toHaveBeenCalledWith(administradores)
    expect(eq).toHaveBeenCalled()
  })

  it('deve retornar 404 se o administrador não for encontrado', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    } as any)

    const response = await request(app.server)
      .delete('/administradores/99999999-9999-9999-9999-999999999999')
      .expect(404)

    expect(response.body).toMatchObject({
      message: 'Administrador não encontrado',
    })

    expect(db.delete).not.toHaveBeenCalled()
  })

  it('deve retornar 500 em erro inesperado', async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error('Falha geral')
    })

    const response = await request(app.server)
      .delete('/administradores/111e4567-e89b-12d3-a456-426614174000')
      .expect(500)

    expect(response.body.message).toBe('Erro ao deletar administrador')
  })
})
