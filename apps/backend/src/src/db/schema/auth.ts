// ---------------------------登录相关--------------------------------------

import { relations } from "drizzle-orm";

import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// 用户表
export const userSchema = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		password: varchar("password", { length: 255 }).notNull(), // 存储加密后的密码
		email: varchar("email", { length: 100 }).unique(), // @typebox { format: 'email' }
		nickname: varchar("nickname", { length: 50 }),
		avatar: varchar("avatar", { length: 255 }),
		status: integer("status").notNull().default(1), // 1: 正常, 0: 禁用
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(users) => [index("user_id_idx").on(users.id)],
);
export const userRelations = relations(userSchema, ({ many }) => ({
	tokens: many(tokenSchema),
}));

export const tokenSchema = pgTable(
	"tokens",
	{
		id: uuid("id").primaryKey().notNull().defaultRandom(),
		ownerId: uuid("owner_id")
			.notNull()
			.references(() => userSchema.id),
		accessToken: text("access_token").notNull(),
		refreshToken: text("refresh_token").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	},
	(token) => [index("token_id_idx").on(token.id)],
);
export const tokenRelations = relations(tokenSchema, ({ one }) => ({
	owner: one(userSchema, {
		fields: [tokenSchema.ownerId],
		references: [userSchema.id],
	}),
}));

// -----------------------------------------------------------------
