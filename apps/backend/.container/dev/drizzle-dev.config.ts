import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "drizzle/dev",
	schema: "src/server/src/db/schema/index.ts",
	dialect: "postgresql",
	dbCredentials: {
		// url: "postgres://app_user:app_pass@localhost:5432/buy_db",	
		url: "postgres://app_user:TzzKkj3scdJjSJz6@47.109.24.194:5432/buy_db",
	},
});
