const fs = require('fs')

// Gera drizzle.config.js para produção
// Detecta automaticamente AWS RDS pela URL e adiciona sslmode=require
const config = `const { defineConfig } = require("drizzle-kit");

let databaseUrl = process.env.DATABASE_URL || "postgresql://docker:docker@localhost:5432/tg_backend";
const isAWS = databaseUrl.includes("rds.amazonaws.com");

// Para AWS RDS, adiciona sslmode=require na URL
if (isAWS && !databaseUrl.includes("sslmode")) {
	databaseUrl += "?sslmode=require";
}

module.exports = defineConfig({
	dialect: "postgresql",
	casing: "snake_case",
	schema: "./src/db/schema/**.ts",
	out: "./src/db/migrations",
	dbCredentials: {
		url: databaseUrl,
	},
});
`

fs.writeFileSync('./drizzle.config.js', config)

console.log(
  '✔ drizzle.config.js gerado (auto-detecta AWS RDS + sslmode=require)',
)
