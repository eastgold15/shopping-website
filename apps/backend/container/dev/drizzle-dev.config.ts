import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.development" });

export default defineConfig({
	out: process.env.DRIZZLE_OUT || "./drizzle",
	schema: "./src/db/models/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
