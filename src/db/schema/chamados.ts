import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { categorias } from './categorias.js'
import { departamentos } from './departamentos.js'
import { funcionarios } from './funcionarios.js'
import { usuarios } from './usuarios.js'

export const chamados = pgTable('chamado', {
  cha_id: text('cha_id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  cha_descricao: text('cha_descricao').notNull(),
  cha_data_fechamento: timestamp('cha_data_fechamento'),
  cha_departamento: text('cha_departamento')
    .references(() => departamentos.dep_id)
    .$defaultFn(() => uuidv7()),
  cha_responsavel: text('cha_responsavel')
    .references(() => funcionarios.fun_id)
    .$defaultFn(() => uuidv7()),
  cha_nome: text('cha_nome').notNull(),
  cha_cep: text('cha_cep'),
  cha_numero_endereco: text('cha_numero_endereco'),
  cha_data_abertura: timestamp('cha_data_abertura').defaultNow().notNull(),
  cha_titulo: text('cha_titulo'),
  cha_prioridade: text('cha_prioridade'),
  cha_status: text('cha_status').default('Pendente'),
  usu_id: text('usu_id')
    .references(() => usuarios.usu_id)
    .$defaultFn(() => uuidv7()),
  cat_id: text('cat_id')
    .references(() => categorias.cat_id)
    .$defaultFn(() => uuidv7()),
})
