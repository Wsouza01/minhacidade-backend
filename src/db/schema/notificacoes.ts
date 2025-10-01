import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'
import { chamados } from './chamados.ts'
import { usuarios } from './usuarios.ts'

export const notificacoes = pgTable('notificacao', {
  ntf_id: uuid('ntf_id').primaryKey().defaultRandom(),
  ntf_canal: text('ntf_canal'),
  ntf_mensagem: text('ntf_mensagem'),
  ntf_data_envio: timestamp('ntf_data_envio').defaultNow(),
  ntf_lida: text('ntf_lida'),
  cha_id: uuid('cha_id').references(() => chamados.cha_id),
  usu_id: uuid('usu_id').references(() => usuarios.usu_id),
})
