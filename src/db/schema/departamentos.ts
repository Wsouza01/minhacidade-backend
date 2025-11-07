import { relations } from "drizzle-orm"
import { pgTable, text, uuid } from "drizzle-orm/pg-core"
import { cidades } from "./cidades.ts"

export const departamentos = pgTable("departamentos", {
	dep_id: uuid("dep_id").primaryKey().defaultRandom(),
	dep_nome: text("dep_nome").notNull(),
	dep_descricao: text("dep_descricao"),
	// Referência à cidade do departamento
	cid_id: uuid("cid_id").references(() => cidades.cid_id),
})

export const departamentosRelations = relations(departamentos, ({ one }) => ({
	cidade: one(cidades, {
		fields: [departamentos.cid_id],
		references: [cidades.cid_id],
	}),
}))
