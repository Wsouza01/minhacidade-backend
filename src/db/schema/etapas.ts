import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { chamados } from './chamados.ts'

export const etapas = pgTable('etapa', {
  eta_id: text('eta_id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  eta_descricao: text('eta_descricao').notNull(),
  eta_data_inicio: timestamp('eta_data_inicio'),
  eta_data_fim: timestamp('eta_data_fim'),
  eta_nome: text('eta_nome').notNull(),
  cha_id: text('cha_id')
    .references(() => chamados.cha_id)
    .$defaultFn(() => uuidv7()),
})
