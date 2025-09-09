import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { departamentos } from "./departamentos.ts";
import { funcionarios } from "./funcionarios.ts";
import { usuarios } from "./usuarios.ts";
import { categorias } from "./categorias.ts";

export const chamados = pgTable("chamado", {
  cha_id: uuid("cha_id").primaryKey().defaultRandom(),
  cha_protocolo: text("cha_protocolo").notNull(), // NOVO campo
  cha_descricao: text("cha_descricao").notNull(),
  cha_data_fechamento: timestamp("cha_data_fechamento"),
  cha_departamento: uuid("cha_departamento").references(
    () => departamentos.dep_id
  ),
  cha_responsavel: uuid("cha_responsavel").references(
    () => funcionarios.fun_id
  ),
  cha_nome: text("cha_nome").notNull(),
  cha_cep: text("cha_cep"),
  cha_numero_endereco: text("cha_numero_endereco"),
  cha_data_abertura: timestamp("cha_data_abertura").defaultNow().notNull(),
  cha_motivo: text("cha_motivo"),
  cha_prioridade: text("cha_prioridade"),
  usu_id: uuid("usu_id").references(() => usuarios.usu_id),
  cat_id: uuid("cat_id").references(() => categorias.cat_id),
});
