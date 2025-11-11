import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { uuidv7 } from 'uuidv7'
import { chamados } from './chamados.ts'
import { funcionarios } from './funcionarios.ts'
import { usuarios } from './usuarios.ts'

export const notificacoes = pgTable('notificacao', {
  not_id: text('not_id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  not_titulo: text('not_titulo'),
  not_mensagem: text('not_mensagem'),
  not_tipo: text('not_tipo'), // 'info', 'success', 'warning', 'error'
  not_lida: boolean('not_lida').default(false),
  not_data: timestamp('not_data').defaultNow(),
  not_link: text('not_link'), // URL para acessar o recurso (ex: /chamado/:id)
  cha_id: text('cha_id')
    .references(() => chamados.cha_id)
    .$defaultFn(() => uuidv7()),
  usu_id: text('usu_id')
    .references(() => usuarios.usu_id)
    .$defaultFn(() => uuidv7()),
  fun_id: text('fun_id')
    .references(() => funcionarios.fun_id)
    .$defaultFn(() => uuidv7()),
})
