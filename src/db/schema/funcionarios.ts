import {
  pgTable,
  uuid,
  text,
  timestamp,
  date
} from "drizzle-orm/pg-core";

export const funcionarios = pgTable("funcionario", {
  fun_id: uuid("fun_id").primaryKey().defaultRandom(),
  fun_nome: text("fun_nome").notNull(),
  fun_email: text("fun_email").notNull(),
  fun_cpf: text("fun_cpf").notNull(),
  fun_data_nascimento: date("fun_data_nascimento").notNull(),
  fun_criado: timestamp("fun_criado").defaultNow().notNull(),
  fun_login: text("fun_login").notNull(),
  fun_senha: text("fun_senha").notNull(),
  dep_id: uuid("dep_id").references(() => departamentos.dep_id)
});