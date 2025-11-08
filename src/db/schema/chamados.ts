import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { categorias } from "./categorias.ts"
import { departamentos } from "./departamentos.ts"
import { funcionarios } from "./funcionarios.ts"
import { usuarios } from "./usuarios.ts"

export const chamados = pgTable("chamado", {
	cha_id: uuid("cha_id").primaryKey().defaultRandom(),
	cha_descricao: text("cha_descricao").notNull(),
	cha_data_fechamento: timestamp("cha_data_fechamento"),
	cha_departamento: uuid("cha_departamento").references(
		() => departamentos.dep_id,
	),
	cha_responsavel: uuid("cha_responsavel").references(
		() => funcionarios.fun_id,
	),
	cha_nome: text("cha_nome").notNull(),
	cha_cep: text("cha_cep"),
	cha_numero_endereco: text("cha_numero_endereco"),
	cha_data_abertura: timestamp("cha_data_abertura").defaultNow().notNull(),
	cha_titulo: text("cha_titulo"),
	cha_prioridade: text("cha_prioridade"),
	cha_status: text("cha_status").default("Pendente"),
	usu_id: uuid("usu_id").references(() => usuarios.usu_id),
	cat_id: uuid("cat_id").references(() => categorias.cat_id),
})
