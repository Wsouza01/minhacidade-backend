const { defineConfig } = require('drizzle-kit')

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://docker:docker@localhost:5432/tg_backend'
const isAWS = databaseUrl.includes('rds.amazonaws.com')

module.exports = defineConfig({
  dialect: 'postgresql',
  casing: 'snake_case',
  schema: './src/db/schema/**.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: databaseUrl,
    ssl: isAWS ? { rejectUnauthorized: false } : false,
  },
})
