import { defineConfig } from 'drizzle-kit'

let databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://docker:docker@localhost:5432/tg_backend'
const isAWS = databaseUrl.includes('rds.amazonaws.com')

// Para AWS RDS, adiciona sslmode=require na URL
if (isAWS && !databaseUrl.includes('sslmode')) {
  databaseUrl += '?sslmode=require'
}

export default defineConfig({
  dialect: 'postgresql',
  casing: 'snake_case',
  schema: './src/db/schema/**.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: databaseUrl,
  },
})
