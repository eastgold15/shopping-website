import { Elysia } from "elysia";

export const authPlugin = new Elysia({ name: "authPlugin" })
  // .use(
  //   elysiaAuthDrizzlePlugin<typeof userTable.$inferSelect>({
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
  //       usersSchema: userTable,
  //       tokensSchema: tokenTable,
  //     },
  //   }),
  // )
  .onError(({ error, set }) => {
    console.log(error);
    throw new Error("auth插件错误");
  });
