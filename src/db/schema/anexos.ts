import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { chamados } from "./chamados.ts";

export const anexos = pgTable("anexo", {
  anx_id: uuid("ane_id").primaryKey().defaultRandom(),
  anx_tipo: text("ane_tipo").notNull(),
  anx_url: text("anx_url").notNull(),
  cha_id: uuid("cha_id").references(() => chamados.cha_id),
});
