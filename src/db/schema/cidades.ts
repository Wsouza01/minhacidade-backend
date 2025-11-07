import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core"

export const cidades = pgTable("cidades", {
	cid_id: uuid("cid_id").primaryKey().defaultRandom(),
	cid_nome: text("cid_nome").notNull(),
	cid_estado: text("cid_estado").notNull(),
	cid_ativo: boolean("cid_ativo").notNull().default(true),
	cid_padrao: boolean("cid_padrao").notNull().default(false),
})

export type Cidade = typeof cidades.$inferSelect
export type NovaCidade = typeof cidades.$inferInsert
