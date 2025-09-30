import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'
import { chamados } from './chamados.ts'
import { usuarios } from './usuarios.ts'

export const notificacoes = pgTable('notificacao', {
  not_id: uuid('not_id').primaryKey().defaultRandom(),
  not_titulo: text('not_titulo').notNull(),
  not_mensagem: text('not_mensagem').notNull(),
  not_data_criacao: timestamp('not_data_criacao').defaultNow().notNull(),
  not_lida: boolean('not_lida').default(false).notNull(),
  not_tipo: text('not_tipo').notNull(), // 'info', 'success', 'warning', 'error'
  cha_id: uuid('cha_id').references(() => chamados.cha_id),
  usu_id: uuid('usu_id').references(() => usuarios.usu_id).notNull(),
})
