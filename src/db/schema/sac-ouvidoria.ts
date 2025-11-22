import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { usuarios } from './usuarios.js'

export const sacOuvidoria = pgTable('sac_ouvidoria', {
  sac_id: text('sac_id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  sac_tipo: text('sac_tipo').notNull(),
  sac_descricao: text('sac_descricao').notNull(),
  sac_anexo_url: text('sac_anexo_url'),
  usu_id: text('usu_id')
    .references(() => usuarios.usu_id)
    .$defaultFn(() => uuidv7()),
  sac_data_criacao: timestamp('sac_data_criacao').defaultNow(),
})
