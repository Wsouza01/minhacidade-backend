import {
  pgTable,
  uuid,
  text,
  timestamp,
  date
} from "drizzle-orm/pg-core";

export const usuarios = pgTable("usuario", {
  usu_id: uuid("usu_id").primaryKey().defaultRandom(),
  usu_nome: text("usu_nome").notNull(),
  usu_email: text("usu_email").notNull(),
  usu_cpf: text("usu_cpf").notNull(),
  usu_data_nascimento: date("usu_data_nascimento").notNull(),
  usu_criado: timestamp("usu_criado").defaultNow().notNull(),
  usu_login: text("usu_login").notNull(),
  usu_senha: text("usu_senha").notNull(),
})
