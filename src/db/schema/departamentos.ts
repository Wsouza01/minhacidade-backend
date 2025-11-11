import { relations } from 'drizzle-orm'
import { pgTable, text } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { cidades } from './cidades.ts'

export const departamentos = pgTable('departamentos', {
  dep_id: text('dep_id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  dep_nome: text('dep_nome').notNull(),
  dep_descricao: text('dep_descricao'),
  // Referência à cidade do departamento
  cid_id: text('cid_id')
    .references(() => cidades.cid_id)
    .$defaultFn(() => uuidv7()),
})

export const departamentosRelations = relations(departamentos, ({ one }) => ({
  cidade: one(cidades, {
    fields: [departamentos.cid_id],
    references: [cidades.cid_id],
  }),
}))
