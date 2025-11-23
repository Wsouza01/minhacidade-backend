import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../env.js";
import * as schema from "./schema/index.js";

// Detecta se está rodando na AWS (RDS exige SSL)
const isAWS = env.DATABASE_URL.includes("rds.amazonaws.com");

// Configuração SSL
// - AWS RDS: SSL obrigatório com rejectUnauthorized: false
// - Local (Docker/localhost): sem SSL
const sslConfig = isAWS ? { ssl: { rejectUnauthorized: false } } : {};

console.log(
	`🔌 Conectando ao banco: ${isAWS ? "AWS RDS (SSL)" : "Local (sem SSL)"}`,
);

// Cria o client postgres-js
const client = postgres(env.DATABASE_URL, sslConfig);

// Conecta com drizzle
export const db = drizzle(client, {
	schema,
	casing: "snake_case",
});
