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
import { getAnexosRoute } from './get-anexos.ts'

// 🧩 Mock do banco
vi.mock('../../../db/index', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockResolvedValue([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tipo: 'imagem',
          url: 'https://cdn.site.com/img1.png',
          chamado_id: '999e4567-e89b-12d3-a456-426614174111',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          tipo: 'documento',
          url: 'https://cdn.site.com/doc1.pdf',
          chamado_id: null,
        },
      ]),
    })),
  },
}))

describe('GET /anexos (Supertest)', () => {
  const app = Fastify()
  app.register(getAnexosRoute)

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar a lista de anexos com sucesso', async () => {
    const response = await request(app.server).get('/anexos').expect(200)

    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body).toHaveLength(2)

    expect(response.body[0]).toMatchObject({
      id: '123e4567-e89b-12d3-a456-426614174000',
      tipo: 'imagem',
      url: 'https://cdn.site.com/img1.png',
      chamado_id: '999e4567-e89b-12d3-a456-426614174111',
    })

    expect(db.select).toHaveBeenCalled()
  })

  it('deve retornar um array vazio quando não houver anexos', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockResolvedValue([]),
    } as any)

    const response = await request(app.server).get('/anexos').expect(200)

    expect(response.body).toEqual([])
  })

  it('deve retornar 500 se ocorrer erro inesperado', async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error('Erro de banco de dados')
    })

    // Fastify retornará 500 automaticamente se lançar erro sem tratamento
    const response = await request(app.server).get('/anexos').expect(500)
    expect(response.statusCode).toBe(500)
  })
})
