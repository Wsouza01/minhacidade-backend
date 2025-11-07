import { relations } from "drizzle-orm"
import {
	boolean,
	date,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core"
import { cidades } from "./cidades.ts"

export const administradores = pgTable("administradores", {
	adm_id: uuid("adm_id").primaryKey().defaultRandom(),
	adm_nome: text("adm_nome").notNull(),
	adm_email: text("adm_email").notNull().unique(),
	adm_cpf: text("adm_cpf").notNull().unique(),
	adm_data_nascimento: date("adm_data_nascimento").notNull(),
	adm_criado: timestamp("adm_criado").defaultNow().notNull(),
	adm_login: text("adm_login").notNull().unique(),
	adm_senha: text("adm_senha").notNull(),
	adm_ativo: boolean("adm_ativo").notNull().default(true),
	adm_tentativas_login: integer("adm_tentativas_login").default(0),
	adm_bloqueado_ate: timestamp("adm_bloqueado_ate"),
	// Referência à cidade que o administrador gerencia
	// Se for NULL, é o admin global (super admin)
	cid_id: uuid("cid_id").references(() => cidades.cid_id),
})

export const administradoresRelations = relations(
	administradores,
	({ one }) => ({
		cidade: one(cidades, {
			fields: [administradores.cid_id],
			references: [cidades.cid_id],
		}),
	}),
)

export type Administrador = typeof administradores.$inferSelect
export type NovoAdministrador = typeof administradores.$inferInsert
