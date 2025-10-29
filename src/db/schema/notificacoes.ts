import { pgTable, boolean, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chamados } from "./chamados.ts";
import { funcionarios } from "./funcionarios.ts";
import { usuarios } from "./usuarios.ts";

export const notificacoes = pgTable("notificacao", {
  not_id: uuid("not_id").primaryKey().defaultRandom(),
  not_titulo: text("not_titulo").notNull(), // Obrigatório
  not_mensagem: text("not_mensagem").notNull(), // Obrigatório
  not_tipo: text("not_tipo").default("info"), // Tipo da notificação (info, success, warning, error), default 'info'
  not_lida: boolean("not_lida").default(false), // Indicador se a notificação foi lida
  not_data: timestamp("not_data").defaultNow(), // Data de criação da notificação, com valor padrão (hora atual)
  cha_id: uuid("cha_id").references(() => chamados.cha_id), // Opcional, não usamos .notNull() para tornar esse campo nulo
  usu_id: uuid("usu_id").references(() => usuarios.usu_id), // Opcional, não usamos .notNull() para tornar esse campo nulo
  fun_id: uuid("fun_id").references(() => funcionarios.fun_id), // Opcional, não usamos .notNull() para tornar esse campo nulo
});
