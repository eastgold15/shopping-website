import { fileURLToPath } from "node:url";
import {
	tokenSchema,
	userSchema,
	// 新增的电商相关表
	categoriesSchema,
	productsSchema,
	reviewsSchema,
	siteConfigSchema,
	advertisementsSchema,
	headerConfigSchema,
	footerConfigSchema,
} from "../schema/index.ts";
import { pgComments, runPgComments } from "./comment.plugin.ts";

// 为用户表添加注释
pgComments(userSchema, {
	id: "用户ID，主键",
	username: "用户名，唯一",
	password: "密码，加密存储",
	email: "电子邮件，唯一",
	nickname: "昵称",
	avatar: "头像URL",
	status: "状态，1:正常，0:禁用",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});

// 为令牌表添加注释
pgComments(tokenSchema, {
	id: "令牌ID，主键",
	ownerId: "所有者ID，关联用户表",
	accessToken: "访问令牌",
	refreshToken: "刷新令牌",
	createdAt: "创建时间",
});

// 为商品分类表添加注释
pgComments(categoriesSchema, {
	id: "分类ID，主键",
	name: "分类名称",
	slug: "URL友好的标识符，唯一",
	description: "分类描述",
	parentId: "父分类ID，支持树形结构",
	sortOrder: "排序顺序，默认0",
	isVisible: "是否显示，默认true",
	icon: "分类图标URL",
	image: "分类图片URL",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});

// 为商品表添加注释
pgComments(productsSchema, {
	id: "商品ID，主键",
	name: "商品名称",
	slug: "URL友好的标识符，唯一",
	description: "商品详细描述",
	shortDescription: "商品简短描述",
	price: "商品价格，精度10位小数2位",
	comparePrice: "对比价格（原价）",
	cost: "成本价",
	sku: "商品编码，唯一",
	barcode: "条形码",
	weight: "重量，精度8位小数2位",
	dimensions: "尺寸信息JSON格式 {length, width, height}",
	images: "商品图片数组JSON格式",
	videos: "商品视频数组JSON格式",
	colors: "颜色选项JSON格式",
	sizes: "尺寸选项JSON格式",
	materials: "材质信息JSON格式",
	careInstructions: "护理说明",
	features: "商品特性JSON格式",
	specifications: "规格参数JSON格式",
	categoryId: "分类ID，关联分类表",
	stock: "库存数量，默认0",
	minStock: "最小库存，默认0",
	isActive: "是否激活，默认true",
	isFeatured: "是否推荐，默认false",
	metaTitle: "SEO标题",
	metaDescription: "SEO描述",
	metaKeywords: "SEO关键词",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});

// 为商品评价表添加注释
pgComments(reviewsSchema, {
	id: "评价ID，主键",
	productId: "商品ID，关联商品表",
	userName: "用户名",
	userEmail: "用户邮箱",
	rating: "评分，1-5星",
	title: "评价标题",
	content: "评价内容",
	isVerified: "是否验证购买，默认false",
	isApproved: "是否审核通过，默认false",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});

// 为网站配置表添加注释
pgComments(siteConfigSchema, {
	id: "配置ID，主键",
	key: "配置键，唯一",
	value: "配置值",
	description: "配置描述",
	category: "配置分类，默认general",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});

// 为广告管理表添加注释
pgComments(advertisementsSchema, {
	id: "广告ID，主键",
	title: "广告标题",
	type: "广告类型：banner, carousel",
	image: "广告图片URL",
	link: "广告链接",
	position: "广告位置",
	sortOrder: "排序，默认0",
	isActive: "是否激活，默认true",
	startDate: "开始时间",
	endDate: "结束时间",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});

// 为顶部配置表添加注释
pgComments(headerConfigSchema, {
	id: "配置ID，主键",
	shippingText: "免运费信息文本",
	trackOrderText: "订单跟踪文本",
	helpText: "帮助文本",
	trackOrderUrl: "订单跟踪链接",
	helpUrl: "帮助链接",
	isActive: "是否启用，默认true",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});

// 为底部配置表添加注释
pgComments(footerConfigSchema, {
	id: "配置ID，主键",
	sectionTitle: "分区标题（如 For You, Connect with Us）",
	linkText: "链接文本",
	linkUrl: "链接地址",
	sortOrder: "排序，默认0",
	isActive: "是否启用，默认true",
	createdAt: "创建时间",
	updatedAt: "更新时间",
});



// 检查是否作为入口点运行
function isEntryPoint(importMetaUrl: string) {
	try {
		const __filename = fileURLToPath(importMetaUrl);
		const __entryFile = process.argv?.[1];
		return __entryFile === __filename;
	} catch (error) {
		return false;
	}
}

// 如果直接运行此文件，则执行注释添加
if (isEntryPoint(import.meta.url)) {
	runPgComments().catch(console.error);
}
