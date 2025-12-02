import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { cidades } from "./cidades.js";

export const categorias = pgTable("categoria", {
	cat_id: text("cat_id")
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	cat_nome: text("cat_nome").notNull(),
	cat_descricao: text("cat_descricao"),
	// Referência à cidade da categoria
	cid_id: text("cid_id")
		.references(() => cidades.cid_id)
		.notNull(),
});

export const categoriasRelations = relations(categorias, ({ one }) => ({
	cidade: one(cidades, {
		fields: [categorias.cid_id],
		references: [cidades.cid_id],
	}),
}));
