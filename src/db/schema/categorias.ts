import { pgTable, text, uuid } from "drizzle-orm/pg-core"

export const categorias = pgTable("categoria", {
	cat_id: uuid("cat_id").primaryKey().defaultRandom(),
	cat_nome: text("cat_nome").notNull(),
	cat_descricao: text("cat_descricao"),
})
