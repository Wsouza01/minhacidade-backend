import { sql } from "drizzle-orm"
import { db } from "./connection.ts"

async function dropAll() {
	try {
		console.log("Dropping all tables...")

		await db.execute(sql`DROP SCHEMA public CASCADE`)
		await db.execute(sql`CREATE SCHEMA public`)
		await db.execute(sql`GRANT ALL ON SCHEMA public TO public`)

		console.log("✅ All tables dropped successfully!")
	} catch (error) {
		console.error("❌ Error dropping tables:", error)
	} finally {
		process.exit(0)
	}
}

dropAll()
