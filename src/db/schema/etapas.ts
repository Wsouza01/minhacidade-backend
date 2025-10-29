// src/db/schema/etapas.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chamados } from "./chamados.ts";

export const etapas = pgTable("etapa", {
  eta_id: uuid("eta_id").primaryKey().defaultRandom(),
  eta_descricao: text("eta_descricao"), // O campo é opcional, sem .notNull()
  eta_data_inicio: timestamp("eta_data_inicio").defaultNow().notNull(), // Esse campo é obrigatório
  eta_data_fim: timestamp("eta_data_fim"), // O campo é opcional, sem .notNull()
  eta_nome: text("eta_nome").notNull(), // Esse campo é obrigatório
  cha_id: uuid("cha_id").references(() => chamados.cha_id),
});
