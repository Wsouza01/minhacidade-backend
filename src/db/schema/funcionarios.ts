import { relations } from "drizzle-orm"
import {
	boolean,
	date,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"
import { cidades } from "./cidades.ts"
import { departamentos } from "./departamentos.ts"

export const funcionarios = pgTable("funcionarios", {
	fun_id: uuid("fun_id").primaryKey().defaultRandom(),
	fun_nome: text("fun_nome").notNull(),
	fun_email: text("fun_email").notNull().unique(),
	fun_cpf: text("fun_cpf").notNull().unique(),
	fun_data_nascimento: date("fun_data_nascimento").notNull(),
	fun_criado: timestamp("fun_criado").defaultNow().notNull(),
	fun_login: text("fun_login").notNull().unique(),
	fun_senha: text("fun_senha").notNull(),

	// Campos adicionais
	fun_matricula: varchar("fun_matricula", { length: 50 }).unique(),
	fun_requer_troca_senha: boolean("fun_requer_troca_senha")
		.notNull()
		.default(false),

	fun_tipo: text("fun_tipo")
		.notNull()
		.default("servidor")
		.$type<"servidor" | "atendente">(),
	fun_ativo: boolean("fun_ativo").notNull().default(true),
	dep_id: uuid("dep_id").references(() => departamentos.dep_id),
	// Referência à cidade do funcionário
	cid_id: uuid("cid_id").references(() => cidades.cid_id),
})

export const funcionariosRelations = relations(funcionarios, ({ one }) => ({
	departamento: one(departamentos, {
		fields: [funcionarios.dep_id],
		references: [departamentos.dep_id],
	}),
	cidade: one(cidades, {
		fields: [funcionarios.cid_id],
		references: [cidades.cid_id],
	}),
}))

export type Funcionario = typeof funcionarios.$inferSelect
export type NovoFuncionario = typeof funcionarios.$inferInsert
