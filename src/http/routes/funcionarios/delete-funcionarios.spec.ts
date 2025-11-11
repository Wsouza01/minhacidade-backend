import Fastify from 'fastify'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../../db/index.ts'
import { deleteFuncionariosRoute } from './delete-funcionarios.ts'

// =============================
// 🔧 Mocks do banco e schema
// =============================
vi.mock('../../../db/index', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          fun_id: '111e4567-e89b-12d3-a456-426614174000',
          fun_nome: 'Carlos',
        },
      ]),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  },
}))

vi.mock('../../../db/schema/index', () => ({
  schema: {
    funcionarios: {
      fun_id: 'fun_id',
      fun_nome: 'fun_nome',
    },
  },
}))

vi.mock('drizzle-orm', async () => {
  const actual =
    await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm')
  return {
    ...actual,
    eq: vi.fn((a, b) => ({ field: a, value: b })),
  }
})

describe('DELETE /funcionarios/:id (Supertest)', () => {
  let app: ReturnType<typeof Fastify>

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    app.register(deleteFuncionariosRoute)
    await app.ready()
  })

  // =================================================
  // ✅ Cenário 1 — Exclusão bem-sucedida
  // =================================================
  it('deve deletar o funcionário com sucesso', async () => {
    const response = await request(app.server)
      .delete('/funcionarios/111e4567-e89b-12d3-a456-426614174000')
      .send()

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Funcionário deletado com sucesso')

    expect(db.select).toHaveBeenCalled()
    expect(db.delete).toHaveBeenCalled()
  })

  // =================================================
  // ❌ Cenário 2 — Funcionário não encontrado
  // =================================================
  it('deve retornar 404 se o funcionário não existir', async () => {
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    } as any)

    const response = await request(app.server)
      .delete('/funcionarios/999e4567-e89b-12d3-a456-426614174999')
      .send()

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('Funcionário não encontrado')
    expect(db.delete).not.toHaveBeenCalled()
  })

  // =================================================
  // ❌ Cenário 3 — Erro inesperado
  // =================================================
  it('deve retornar 500 em erro inesperado', async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error('Erro inesperado no banco')
    })

    const response = await request(app.server)
      .delete('/funcionarios/111e4567-e89b-12d3-a456-426614174000')
      .send()

    // Fastify retornará 500 automaticamente, pois não há try/catch
    expect(response.status).toBe(500)
  })

  // =================================================
  // ❌ Cenário 4 — ID inválido
  // =================================================
  it('deve retornar 400 se o ID for inválido', async () => {
    const response = await request(app.server)
      .delete('/funcionarios/id_invalido')
      .send()

    expect(response.status).toBe(400)
  })
})
