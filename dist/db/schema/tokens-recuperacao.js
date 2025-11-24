import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
export const tokensRecuperacao = pgTable('tokens_recuperacao', {
  tok_id: text('tok_id')
    .primaryKey()
    .$defaultFn(() => createId()),
  tok_token: text('tok_token').notNull().unique(),
  tok_email: text('tok_email').notNull(),
  tok_tipo_usuario: text('tok_tipo_usuario').notNull(), // 'usuario' ou 'funcionario'
  tok_usado: timestamp('tok_usado', { withTimezone: true }),
  tok_expira_em: timestamp('tok_expira_em', { withTimezone: true }).notNull(),
  tok_criado_em: timestamp('tok_criado_em', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
