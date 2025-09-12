import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * 商品分类表 - 存储商品的分类信息
 * 包含分类的基本信息、层级关系和显示属性
 */
export const categoriesSchema = pgTable("categories", {
  id: serial("id").primaryKey(), // 分类唯一标识
  name: varchar("name", { length: 100 }).notNull(), // 分类名称
  slug: varchar("slug", { length: 100 }).notNull().unique(), // 分类别名，用于URL优化
  description: text("description").default(""), // 分类描述
  parentId: integer("parent_id").default(-1), //-1 表示顶级分类
  sortOrder: integer("sort_order").default(0), // 排序权重，值越小越靠前
  isVisible: boolean("is_visible").default(true), // 是否在前端显示
  icon: varchar("icon", { length: 255 }).default(""), // 分类图标

  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const categoriesRelations = relations(
  categoriesSchema,
  ({ one, many }) => ({
    parent: one(categoriesSchema, {
      fields: [categoriesSchema.parentId],
      references: [categoriesSchema.id],
      relationName: "categoryParent",
    }),
    children: many(categoriesSchema, {
      relationName: "categoryParent",
    }),
    products: many(productsSchema),
  }),
);

/**
 * 商品表 - 存储商品的基本信息、价格、库存等
 * 包含商品的完整属性，支持SEO优化和商品展示
 */
export const productsSchema = pgTable("products", {
  id: serial("id").primaryKey(), // 商品唯一标识
  name: varchar("name", { length: 255 }).notNull(), // 商品名称
  slug: varchar("slug", { length: 255 }).notNull().unique(), // 商品别名，用于URL优化
  description: text("description").default(""), // 商品详细描述
  shortDescription: text("short_description").default(""), // 商品简短描述
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // 商品售价
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }).default(
    "0.00",
  ), // 商品原价/对比价格
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0.00"), // 商品成本价
  sku: varchar("sku", { length: 100 }).unique().default(""), // 商品库存单位
  barcode: varchar("barcode", { length: 100 }).default(""), // 商品条形码
  weight: decimal("weight", { precision: 8, scale: 2 }).default("0.00"), // 商品重量(kg)
  dimensions: json("dimensions").default({}), // 商品尺寸(长宽高)
  // 商品图片通过 productImagesSchema 中间表关联
  videos: json("videos").default([]), // 商品视频列表
  colors: json("colors").default([]), // 商品可选颜色
  sizes: json("sizes").default([]), // 商品可选尺寸
  materials: json("materials").default([]), // 商品材料信息
  careInstructions: text("care_instructions").default(""), // 商品保养说明
  features: json("features").default([]), // 商品特性列表
  specifications: json("specifications").default({}), // 商品规格参数
  categoryId: integer("category_id")
    .references(() => categoriesSchema.id)
    .default(-1), // 所属分类ID
  stock: integer("stock").default(0), // 商品库存数量
  minStock: integer("min_stock").default(0), // 最低库存预警值
  isActive: boolean("is_active").default(true), // 是否上架销售
  isFeatured: boolean("is_featured").default(false), // 是否为推荐商品
  metaTitle: varchar("meta_title", { length: 255 }).default(""), // SEO标题
  metaDescription: text("meta_description").default(""), // SEO描述
  metaKeywords: varchar("meta_keywords", { length: 500 }).default(""), // SEO关键词
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const productsRelations = relations(productsSchema, ({ one, many }) => ({
  category: one(categoriesSchema, {
    fields: [productsSchema.categoryId],
    references: [categoriesSchema.id],
  }),
  reviews: many(reviewsSchema),
  orderItems: many(orderItemsSchema),
  // 商品图片关联(通过中间表)
  productImages: many(productImagesSchema),
}));

/**
 * 商品评价表 - 存储用户对商品的评价信息
 * 包含评分、评价内容和审核状态
 */
export const reviewsSchema = pgTable("reviews", {
  id: serial("id").primaryKey(), // 评价唯一标识
  productId: integer("product_id")
    .references(() => productsSchema.id)
    .notNull(), // 关联商品ID
  userName: varchar("user_name", { length: 100 }).notNull(), // 用户姓名
  userEmail: varchar("user_email", { length: 255 }).default(""), // 用户邮箱
  rating: integer("rating").notNull(), // 评分(1-5星)
  title: varchar("title", { length: 255 }).default(""), // 评价标题
  content: text("content").notNull(), // 评价内容
  isVerified: boolean("is_verified").default(false), // 是否为认证购买用户
  isApproved: boolean("is_approved").default(false), // 评价是否已审核通过
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const reviewsRelations = relations(reviewsSchema, ({ one }) => ({
  product: one(productsSchema, {
    fields: [reviewsSchema.productId],
    references: [productsSchema.id],
  }),
}));

/**
 * 网站配置表 - 存储网站的各种配置项
 * 支持按分类管理不同模块的配置
 */
export const siteConfigSchema = pgTable("site_config", {
  id: serial("id").primaryKey(), // 配置项唯一标识
  key: varchar("key", { length: 100 }).notNull().unique(), // 配置键名
  value: text("value").default(""), // 配置值
  description: text("description").default(""), // 配置项描述
  category: varchar("category", { length: 50 }).default("general"), // 配置分类(general, seo, payment等)
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

/**
 * 广告管理表 - 存储网站广告信息
 * 支持多种广告类型和位置管理
 */
export const advertisementsSchema = pgTable("advertisements", {
  id: serial("id").primaryKey(), // 广告唯一标识
  title: varchar("title", { length: 255 }).notNull(), // 广告标题
  type: varchar("type", { length: 50 }).notNull(), // 广告类型(banner, popup, sidebar等)
  image_id: text("image_id")
    .notNull()
    .references(() => imagesSchema.id), // 广告图片URL - 引用imagesSchema.url
  link: varchar("link", { length: 500 }).default(""), // 广告链接地址
  position: varchar("position", { length: 100 }).default(""), // 广告显示位置
  sortOrder: integer("sort_order").default(0), // 排序权重
  isActive: boolean("is_active").default(true), // 是否启用
  startDate: timestamp("start_date").defaultNow(), // 广告开始时间
  endDate: timestamp("end_date"), // 广告结束时间
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const advertisementsRelations = relations(
  advertisementsSchema,
  ({ one }) => ({
    // 广告图片关联到图片管理表 - 外键在advertisements表中
    imageRef: one(imagesSchema, {
      fields: [advertisementsSchema.image_id],
      references: [imagesSchema.url],
    }),
  }),
);

/**
 * 商品图片关联表 - 处理商品与图片的多对多关系
 */
export const productImagesSchema = pgTable("product_images", {
  productId: integer("product_id")
    .references(() => productsSchema.id)
    .notNull(),
  imageId: integer("image_id")
    .references(() => imagesSchema.id)
    .notNull(),
  isMain: boolean("is_main").default(false),
});

export const productImagesRelations = relations(
  productImagesSchema,
  ({ one }) => ({
    product: one(productsSchema, {
      fields: [productImagesSchema.productId],
      references: [productsSchema.id],
    }),
    image: one(imagesSchema, {
      fields: [productImagesSchema.imageId],
      references: [imagesSchema.id],
    }),
  }),
);

/**
 * 图片管理表 - 存储网站上传的图片信息
 * 统一管理所有上传的图片资源
 */
export const imagesSchema = pgTable("images", {
  id: serial("id").primaryKey(), // 图片唯一标识
  fileName: varchar("file_name", { length: 255 }).notNull(), // 存储文件名
  url: text("url").notNull().unique(), // 图片访问URL - 添加唯一约束用于外键引用
  category: varchar("category", { length: 50 }).notNull().default("general"), // 图片分类
  fileSize: integer("file_size").notNull(), // 文件大小(字节)
  mimeType: varchar("mime_type", { length: 100 }).notNull(), // 文件MIME类型
  altText: text("alt_text").default(""), // 图片ALT文本
  createdAt: timestamp("created_at").defaultNow().notNull(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const imagesRelations = relations(imagesSchema, ({ many }) => ({
  // 图片可以被多个广告使用 - 外键在advertisements表中
  advertisements: many(advertisementsSchema),
  // 图片可以被多个合作伙伴使用 - 外键在partners表中
  partners: many(partnersSchema),
  // 图片可以被多个订单项使用(作为商品图片快照) - 外键在order_items表中
  orderItems: many(orderItemsSchema),
  // 图片可以被多个商品使用(通过中间表)
  productImages: many(productImagesSchema),
}));

/**
 * 订单表 - 存储用户订单信息
 * 包含订单状态、支付信息和物流信息
 */
export const ordersSchema = pgTable("orders", {
  id: serial("id").primaryKey(), // 订单唯一标识
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(), // 订单编号
  customerName: varchar("customer_name", { length: 100 }).notNull(), // 客户姓名
  customerEmail: varchar("customer_email", { length: 255 }).notNull(), // 客户邮箱
  customerPhone: varchar("customer_phone", { length: 20 }).default(""), // 客户电话
  shippingAddress: json("shipping_address").notNull(), // 收货地址信息
  billingAddress: json("billing_address").default({}), // 账单地址信息
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // 商品小计金额
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default(
    "0.00",
  ), // 运费
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"), // 税费
  discountAmount: decimal("discount_amount", {
    precision: 10,
    scale: 2,
  }).default("0.00"), // 折扣金额
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(), // 订单总金额
  currency: varchar("currency", { length: 3 }).default("USD"), // 货币类型
  status: varchar("status", { length: 20 }).default("pending"), // 订单状态: pending, confirmed, processing, shipped, delivered, cancelled
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"), // 支付状态: pending, paid, failed, refunded
  paymentMethod: varchar("payment_method", { length: 50 }).default(""), // 支付方式
  paymentId: varchar("payment_id", { length: 255 }).default(""), // 支付平台交易ID
  trackingNumber: varchar("tracking_number", { length: 100 }).default(""), // 物流追踪号
  shippingMethod: varchar("shipping_method", { length: 50 }).default(""), // 配送方式
  notes: text("notes").default(""), // 订单备注
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const ordersRelations = relations(ordersSchema, ({ many }) => ({
  orderItems: many(orderItemsSchema),
  refunds: many(refundsSchema),
}));

/**
 * 订单项表 - 存储订单中的商品详情
 * 记录每个订单中包含的商品及其规格信息
 */
export const orderItemsSchema = pgTable("order_items", {
  id: serial("id").primaryKey(), // 订单项唯一标识
  orderId: integer("order_id")
    .references(() => ordersSchema.id)
    .notNull(), // 关联订单ID
  productId: integer("product_id")
    .references(() => productsSchema.id)
    .notNull(), // 关联商品ID
  productName: varchar("product_name", { length: 255 }).notNull(), // 商品名称(快照)
  productSku: varchar("product_sku", { length: 100 }).default(""), // 商品SKU(快照)
  productImage: text("product_image")
    .default("")
    .references(() => imagesSchema.url), // 商品图片URL(快照) - 引用imagesSchema.url
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(), // 商品单价(快照)
  quantity: integer("quantity").notNull(), // 商品数量
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(), // 总价(单价*数量)
  selectedColor: varchar("selected_color", { length: 50 }).default(""), // 用户选择的颜色
  selectedSize: varchar("selected_size", { length: 50 }).default(""), // 用户选择的尺寸
  productOptions: json("product_options").default({}), // 其他商品选项快照
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const orderItemsRelations = relations(orderItemsSchema, ({ one }) => ({
  order: one(ordersSchema, {
    fields: [orderItemsSchema.orderId],
    references: [ordersSchema.id],
  }),
  product: one(productsSchema, {
    fields: [orderItemsSchema.productId],
    references: [productsSchema.id],
  }),
  // 订单项商品图片快照关联到图片管理表 - 外键在order_items表中
  productImageRef: one(imagesSchema, {
    fields: [orderItemsSchema.productImage],
    references: [imagesSchema.url],
  }),
}));

/**
 * 退款表 - 存储订单退款申请信息
 * 包含退款原因、状态和处理记录
 */
export const refundsSchema = pgTable("refunds", {
  id: serial("id").primaryKey(), // 退款申请唯一标识
  orderId: integer("order_id")
    .references(() => ordersSchema.id)
    .notNull(), // 关联订单ID
  refundNumber: varchar("refund_number", { length: 50 }).notNull().unique(), // 退款编号
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 退款金额
  reason: text("reason").notNull(), // 退款原因
  status: varchar("status", { length: 20 }).default("pending"), // 退款状态: pending, approved, rejected, processed
  refundMethod: varchar("refund_method", { length: 50 }).default(""), // 退款方式
  processedAt: timestamp("processed_at"), // 处理时间
  notes: text("notes").default(""), // 处理备注
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const refundsRelations = relations(refundsSchema, ({ one }) => ({
  order: one(ordersSchema, {
    fields: [refundsSchema.orderId],
    references: [ordersSchema.id],
  }),
}));

/**
 * 合作伙伴表 - 存储合作伙伴信息
 * 展示网站的合作伙伴或品牌赞助商
 */
export const partnersSchema = pgTable("partners", {
  id: serial("id").primaryKey(), // 合作伙伴唯一标识
  name: varchar("name", { length: 255 }).notNull(), // 合作伙伴名称
  description: text("description").notNull(), // 合作伙伴描述
  url: varchar("url", { length: 255 }).notNull(), // 合作伙伴官网链接
  image_id: integer("image_id")
    .notNull()
    .references(() => imagesSchema.id), // 合作伙伴Logo图片URL - 引用imagesSchema.url
  sortOrder: integer("sort_order").default(0), // 排序权重
  isActive: boolean("is_active").default(true), // 是否显示
  createdAt: timestamp("created_at").defaultNow(), // 创建时间
  updatedAt: timestamp("updated_at").defaultNow(), // 更新时间
});

export const partnersRelations = relations(partnersSchema, ({ one }) => ({
  // 合作伙伴Logo关联到图片管理表 - 外键在partners表中
  imageRef: one(imagesSchema, {
    fields: [partnersSchema.image_id],
    references: [imagesSchema.id],
  }),
}));
