import { date, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { chamados } from './chamados.ts'

export const etapas = pgTable('etapa', {
  eta_id: uuid('eta_id').primaryKey().defaultRandom(),
  eta_descricao: text('eta_descricao').notNull(),
  eta_data_inicio: date('eta_data_inicio'),
  eta_data_fim: date('eta_data_fim'),
  eta_nome: text('eta_nome').notNull(),
  cha_id: uuid('cha_id').references(() => chamados.cha_id),
})
