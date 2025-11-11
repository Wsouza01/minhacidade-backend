import { pgTable, text } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'

export const categorias = pgTable('categoria', {
  cat_id: text('cat_id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  cat_nome: text('cat_nome').notNull(),
  cat_descricao: text('cat_descricao'),
})
