import { spreads } from "@backend/utils/dizzle.type";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { dbSchema } from "./schema/index";

// ==================== 第一步：分别定义所有 insert schemas ====================
const userInsertSchema = createInsertSchema(dbSchema.userSchema, {
	email: t.Optional(t.String({ format: "email" })),
});
const tokenInsertSchema = createInsertSchema(dbSchema.tokenSchema);
const categoriesInsertSchema = createInsertSchema(dbSchema.categoriesSchema);
const productsInsertSchema = createInsertSchema(dbSchema.productsSchema);
const reviewsInsertSchema = createInsertSchema(dbSchema.reviewsSchema);
const siteConfigInsertSchema = createInsertSchema(dbSchema.siteConfigSchema);
const advertisementsInsertSchema = createInsertSchema(
	dbSchema.advertisementsSchema,
);
const imagesInsertSchema = createInsertSchema(dbSchema.imagesSchema);
const ordersInsertSchema = createInsertSchema(dbSchema.ordersSchema, {
	shippingAddress: t.Any(),
	billingAddress: t.Any(),
});
const orderItemsInsertSchema = createInsertSchema(dbSchema.orderItemsSchema);
const refundsInsertSchema = createInsertSchema(dbSchema.refundsSchema);
const partnersInsertSchema = createInsertSchema(dbSchema.partnersSchema);

// ==================== 第二步：分别定义所有 select schemas ====================
const userSelectSchema = createSelectSchema(dbSchema.userSchema, {
	email: t.Optional(t.String({ format: "email" })),
});
const tokenSelectSchema = createSelectSchema(dbSchema.tokenSchema);
const categoriesSelectSchema = createSelectSchema(dbSchema.categoriesSchema);
const productsSelectSchema = createSelectSchema(dbSchema.productsSchema);
const reviewsSelectSchema = createSelectSchema(dbSchema.reviewsSchema);
const siteConfigSelectSchema = createSelectSchema(dbSchema.siteConfigSchema);
const advertisementsSelectSchema = createSelectSchema(
	dbSchema.advertisementsSchema,
);
const imagesSelectSchema = createSelectSchema(dbSchema.imagesSchema);
const ordersSelectSchema = createSelectSchema(dbSchema.ordersSchema, {
	shippingAddress: t.Any(),
	billingAddress: t.Any(),
});
const orderItemsSelectSchema = createSelectSchema(dbSchema.orderItemsSchema);
const refundsSelectSchema = createSelectSchema(dbSchema.refundsSchema);
const partnersSelectSchema = createSelectSchema(dbSchema.partnersSchema);

// ==================== 第三步：组合 insert 对象 ====================
const insertSchemas = {
	userSchema: userInsertSchema,
	tokenSchema: tokenInsertSchema,
	categoriesSchema: categoriesInsertSchema,
	productsSchema: productsInsertSchema,
	reviewsSchema: reviewsInsertSchema,
	siteConfigSchema: siteConfigInsertSchema,
	advertisementsSchema: advertisementsInsertSchema,
	imagesSchema: imagesInsertSchema,
	ordersSchema: ordersInsertSchema,
	orderItemsSchema: orderItemsInsertSchema,
	refundsSchema: refundsInsertSchema,
	partnersSchema: partnersInsertSchema,
};

// ==================== 第四步：组合 select 对象 ====================
const selectSchemas = {
	userSchema: userSelectSchema,
	tokenSchema: tokenSelectSchema,
	categoriesSchema: categoriesSelectSchema,
	productsSchema: productsSelectSchema,
	reviewsSchema: reviewsSelectSchema,
	siteConfigSchema: siteConfigSelectSchema,
	advertisementsSchema: advertisementsSelectSchema,
	imagesSchema: imagesSelectSchema,
	ordersSchema: ordersSelectSchema,
	orderItemsSchema: orderItemsSelectSchema,
	refundsSchema: refundsSelectSchema,
	partnersSchema: partnersSelectSchema,
};

// ==================== 第五步：创建最终的 DbType 对象 ====================
/**
 * 数据库 TypeBox 配置
 */
export const DbType = {
	typebox: {
		insert: insertSchemas,
		select: selectSchemas,
	},
	spreads: {
		insert: spreads(insertSchemas, "insert"),
		select: spreads(selectSchemas, "select"),
	},
} as const;
