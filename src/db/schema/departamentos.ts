import { pgTable, text, uuid } from "drizzle-orm/pg-core"

export const departamentos = pgTable("departamentos", {
  dep_id: uuid("dep_id").primaryKey().defaultRandom(),
  dep_nome: text("dep_nome").notNull(),
  dep_descricao: text("dep_descricao"),
})
