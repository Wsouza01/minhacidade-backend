import { pgTable, text, uuid, integer, jsonb } from "drizzle-orm/pg-core";

export const departamentos = pgTable("departamentos", {
  dep_id: uuid("dep_id").primaryKey().defaultRandom(),
  dep_nome: text("dep_nome").notNull(),
  dep_descricao: text("dep_descricao"),
  dep_qtdChamados: integer("dep_qtdChamados").default(0),
  dep_motivo: jsonb("dep_motivo").notNull(), // Armazenando motivo e prioridades como JSONB
});
