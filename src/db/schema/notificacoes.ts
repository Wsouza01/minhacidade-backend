import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { chamados } from "./chamados.ts"
import { funcionarios } from "./funcionarios.ts"
import { usuarios } from "./usuarios.ts"

export const notificacoes = pgTable("notificacao", {
	not_id: uuid("not_id").primaryKey().defaultRandom(),
	not_titulo: text("not_titulo"),
	not_mensagem: text("not_mensagem"),
	not_tipo: text("not_tipo"), // 'info', 'success', 'warning', 'error'
	not_lida: boolean("not_lida").default(false),
	not_data: timestamp("not_data").defaultNow(),
	not_link: text("not_link"), // URL para acessar o recurso (ex: /chamado/:id)
	cha_id: uuid("cha_id").references(() => chamados.cha_id),
	usu_id: uuid("usu_id").references(() => usuarios.usu_id),
	fun_id: uuid("fun_id").references(() => funcionarios.fun_id),
})
