import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usuarios } from "./usuarios.ts";

export const sacOuvidoria = pgTable("sac_ouvidoria", {
  sac_id: uuid("sac_id").primaryKey().defaultRandom(),
  sac_tipo: text("sac_tipo").notNull(),
  sac_descricao: text("sac_descricao").notNull(),
  sac_anexo_url: text("sac_anexo_url"),
  usu_id: uuid("usu_id").references(() => usuarios.usu_id),
  sac_data_criacao: timestamp("sac_data_criacao").defaultNow(),
});
