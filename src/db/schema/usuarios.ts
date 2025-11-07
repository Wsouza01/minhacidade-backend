import { relations } from "drizzle-orm"
import {
	boolean,
	date,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { cidades } from "./cidades.ts"

export const usuarios = pgTable("usuarios", {
	usu_id: uuid("usu_id").primaryKey().defaultRandom(),
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
		.$type<"municipe" | "servidor" | "admin">(),
	usu_ativo: boolean("usu_ativo").notNull().default(true),
	usu_tentativas_login: integer("usu_tentativas_login").default(0),
	usu_bloqueado_ate: timestamp("usu_bloqueado_ate"),
	usu_endereco: jsonb("usu_endereco").notNull(),
	cid_id: uuid("cid_id").references(() => cidades.cid_id),
})

export const usuariosRelations = relations(usuarios, ({ one }) => ({
	cidade: one(cidades, {
		fields: [usuarios.cid_id],
		references: [cidades.cid_id],
	}),
}))

export type Usuario = typeof usuarios.$inferSelect
export type NovoUsuario = typeof usuarios.$inferInsert
