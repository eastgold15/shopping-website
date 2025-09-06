import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "../../drizzle/prod",
	schema: "src/db/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: "postgres://MechanicEndWorld:J3XxDRXHSrMkdGCT@1.92.108.56:5432/MechanicEndWorld",
	},
});
