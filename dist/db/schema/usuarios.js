import { relations } from "drizzle-orm";
import { boolean, date, integer, jsonb, pgTable, text, timestamp, } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { cidades } from "./cidades.js";
export const usuarios = pgTable("usuarios", {
    usu_id: text("usu_id")
        .primaryKey()
        .$defaultFn(() => uuidv7()),
    usu_nome: text("usu_nome").notNull(),
    usu_email: text("usu_email").notNull().unique(),
    usu_cpf: text("usu_cpf").notNull().unique(),
    usu_data_nascimento: date("usu_data_nascimento").notNull(),
    usu_criado: timestamp("usu_criado").defaultNow().notNull(),
    usu_login: text("usu_login").notNull().unique(),
    usu_senha: text("usu_senha").notNull(),
    usu_tipo: text("usu_tipo")
        .notNull()
        .default("municipe")
        .$type(),
    usu_ativo: boolean("usu_ativo").notNull().default(true),
    usu_tentativas_login: integer("usu_tentativas_login").default(0),
    usu_bloqueado_ate: timestamp("usu_bloqueado_ate"),
    usu_endereco: jsonb("usu_endereco").notNull(),
    cid_id: text("cid_id")
        .references(() => cidades.cid_id)
        .$defaultFn(() => uuidv7()),
});
export const usuariosRelations = relations(usuarios, ({ one }) => ({
    cidade: one(cidades, {
        fields: [usuarios.cid_id],
        references: [cidades.cid_id],
    }),
}));
