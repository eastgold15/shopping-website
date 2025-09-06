import { elysiaAuthDrizzlePlugin } from "@pori15/elysia-auth-drizzle";
import { Elysia } from "elysia";
import { db } from "../db/connection.ts";

export const authPlugin = new Elysia({ name: "authPlugin" })
	// .use(
	//   elysiaAuthDrizzlePlugin<typeof userSchema.$inferSelect>({
	//     config: [
	//       {
	//         url: "/api/auth/*",
	//         method: "*",
	//       },
	//       {
	//         url: "/",
	//         method: "GET",
	//       },
	//       {
	//         url: "/api/*",
	//         method: "*",
	//       },
	//       {
	//         url: "/swagger",
	//         method: "GET",
	//       },
	//     ],
	//     jwtSecret: process.env.JWT_SECRET || "tzd",
	//     drizzle: {
	//       db: db,
	//       usersSchema: userSchema,
	//       tokensSchema: tokenSchema,
	//     },
	//   }),
	// )
	.onError(({ error, set }) => {
		console.log(error);
		throw new Error("auth插件错误");
	});
