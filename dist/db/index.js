import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../env.js";
import * as schema from "./schema/index.js";
// Detecta produção automaticamente (ECS, Docker, seed, etc)
const isProduction = process.env.IS_DOCKER === "true" || process.env.NODE_ENV === "production";
// Configuração SSL para produção (AWS RDS exige SSL)
const sslConfig = isProduction
    ? { ssl: { rejectUnauthorized: false } }
    : { ssl: false };
// Cria o client postgres-js
const client = postgres(env.DATABASE_URL, sslConfig);
// Conecta com drizzle
export const db = drizzle(client, {
    schema,
    casing: "snake_case",
});
