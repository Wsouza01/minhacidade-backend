import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	casing: "snake_case",
	schema: "./src/db/schema/**.ts",
	out: "./src/db/migrations",
	dbCredentials: {
		url:
			process.env.DATABASE_URL ||
			"postgresql://localhost:5432/minhacidade_backend",
	},
});
