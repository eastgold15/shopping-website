
import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
	decimal,
	json
} from "drizzle-orm/pg-core";

/**
 * 商品分类表
 */
export const categoriesSchema = pgTable("categories", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull().unique(),
	description: text("description"),
	parentId: integer("parent_id"),
	sortOrder: integer("sort_order").default(0),
	isVisible: boolean("is_visible").default(true),
	icon: varchar("icon", { length: 255 }),
	image: varchar("image", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 商品表
 */
export const productsSchema = pgTable("products", {

	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	slug: varchar("slug", { length: 255 }).notNull().unique(),
	description: text("description"),
	shortDescription: text("short_description"),
	price: decimal("price", { precision: 10, scale: 2 }).notNull(),
	comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
	cost: decimal("cost", { precision: 10, scale: 2 }),
	sku: varchar("sku", { length: 100 }).unique(),
	barcode: varchar("barcode", { length: 100 }),
	weight: decimal("weight", { precision: 8, scale: 2 }),
	dimensions: json("dimensions"),
	images: json("images"),
	videos: json("videos"),
	colors: json("colors"),
	sizes: json("sizes"),
	materials: json("materials"),
	careInstructions: text("care_instructions"),
	features: json("features"),
	specifications: json("specifications"),
	categoryId: integer("category_id").references(() => categoriesSchema.id),
	stock: integer("stock").default(0),
	minStock: integer("min_stock").default(0),
	isActive: boolean("is_active").default(true),
	isFeatured: boolean("is_featured").default(false),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	metaKeywords: varchar("meta_keywords", { length: 500 }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 商品评价表
 */
export const reviewsSchema = pgTable("reviews", {
	id: serial("id").primaryKey(),
	productId: integer("product_id").references(() => productsSchema.id).notNull(),
	userName: varchar("user_name", { length: 100 }).notNull(),
	userEmail: varchar("user_email", { length: 255 }),
	rating: integer("rating").notNull(),
	title: varchar("title", { length: 255 }),
	content: text("content").notNull(),
	isVerified: boolean("is_verified").default(false),
	isApproved: boolean("is_approved").default(false),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 网站配置表
 */
export const siteConfigSchema = pgTable("site_config", {
	id: serial("id").primaryKey(),
	key: varchar("key", { length: 100 }).notNull().unique(),
	value: text("value"),
	description: text("description"),
	category: varchar("category", { length: 50 }).default("general"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 广告管理表
 */
export const advertisementsSchema = pgTable("advertisements", {
	id: serial("id").primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	image: text("image").notNull(),
	link: varchar("link", { length: 500 }),
	position: varchar("position", { length: 100 }),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	startDate: timestamp("start_date"),
	endDate: timestamp("end_date"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});


/**
 * 图片管理表
 */
export const imagesSchema = pgTable("images", {
	id: varchar("id", { length: 21 }).primaryKey(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	originalName: varchar("original_name", { length: 255 }).notNull(),
	url: text("url").notNull(),
	category: varchar("category", { length: 50 }).notNull().default("general"),
	fileSize: integer("file_size").notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	altText: text("alt_text").default(""),
	uploadDate: timestamp("upload_date").defaultNow().notNull(),
	updatedDate: timestamp("updated_date").defaultNow(),
});

/**
 * 订单表
 */
export const ordersSchema = pgTable("orders", {
	id: serial("id").primaryKey(),
	orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	customerEmail: varchar("customer_email", { length: 255 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 20 }),
	shippingAddress: json("shipping_address").notNull(),
	billingAddress: json("billing_address"),
	subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
	shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0.00"),
	taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
	discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
	totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
	currency: varchar("currency", { length: 3 }).default("USD"),
	status: varchar("status", { length: 20 }).default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
	paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // pending, paid, failed, refunded
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentId: varchar("payment_id", { length: 255 }),
	trackingNumber: varchar("tracking_number", { length: 100 }),
	shippingMethod: varchar("shipping_method", { length: 50 }),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 订单项表
 */
export const orderItemsSchema = pgTable("order_items", {
	id: serial("id").primaryKey(),
	orderId: integer("order_id").references(() => ordersSchema.id).notNull(),
	productId: integer("product_id").references(() => productsSchema.id).notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	productSku: varchar("product_sku", { length: 100 }),
	productImage: text("product_image"),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
	quantity: integer("quantity").notNull(),
	totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
	selectedColor: varchar("selected_color", { length: 50 }),
	selectedSize: varchar("selected_size", { length: 50 }),
	productOptions: json("product_options"), // 其他商品选项
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 退款表
 */
export const refundsSchema = pgTable("refunds", {
	id: serial("id").primaryKey(),
	orderId: integer("order_id").references(() => ordersSchema.id).notNull(),
	refundNumber: varchar("refund_number", { length: 50 }).notNull().unique(),
	amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
	reason: text("reason").notNull(),
	status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, processed
	refundMethod: varchar("refund_method", { length: 50 }),
	processedAt: timestamp("processed_at"),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 合作伙伴表
 */
export const partnersSchema = pgTable("partners", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description").notNull(),
	image: text("image").notNull(),
	url: varchar("url", { length: 500 }).notNull(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

