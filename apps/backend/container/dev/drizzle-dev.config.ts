import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.development" });

export default defineConfig({
	out: process.env.DRIZZLE_OUT || "./drizzle",
	schema: process.env.DRIZZLE_SCHEMA || "src/db/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
