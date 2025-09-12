import { db } from "@backend/db/connection";
import { siteConfigSchema } from "@backend/db/schema/schema";
import { eq, getTableColumns, like, or } from "drizzle-orm";
import { NotFoundError } from "@backend/utils/errors";
import type {
	BatchUpdateSiteConfigDto,
	CreateSiteConfigDto,
	UpdateSiteConfigDto,
	SiteConfigQuery,
} from "./siteConfigs.model";

/**
 * 网站配置服务类
 * 处理网站配置相关的业务逻辑
 */
export class SiteConfigsService {
	private readonly columns = getTableColumns(siteConfigSchema);

	/**
	 * 获取配置列表
	 */
	async getList(query?: SiteConfigQuery) {
		let dbQuery = db.select(this.columns).from(siteConfigSchema);

		// 添加筛选条件
		if (query?.category) {
			dbQuery = dbQuery.where(eq(siteConfigSchema.category, query.category));
		}

		if (query?.key) {
			dbQuery = dbQuery.where(
				or(
					like(siteConfigSchema.key, `%${query.key}%`),
					like(siteConfigSchema.description, `%${query.key}%`)
				)
			);
		}

		// 分页处理
		if (query?.limit) {
			dbQuery = dbQuery.limit(query.limit);
		}

		if (query?.offset) {
			dbQuery = dbQuery.offset(query.offset);
		}

		return await dbQuery;
	}

	/**
	 * 根据分类获取配置
	 */
	async getByCategory(category: string) {
		return await db
			.select(this.columns)
			.from(siteConfigSchema)
			.where(eq(siteConfigSchema.category, category));
	}

	/**
	 * 根据键获取配置
	 */
	async getByKey(key: string) {
		const [config] = await db
			.select(this.columns)
			.from(siteConfigSchema)
			.where(eq(siteConfigSchema.key, key))
			.limit(1);

		if (!config) {
			throw new NotFoundError(`配置项 ${key} 不存在`);
		}

		return config;
	}

	/**
	 * 创建配置
	 */
	async create(data: CreateSiteConfigDto) {
		const [newConfig] = await db
			.insert(siteConfigSchema)
			.values({
				key: data.key,
				value: data.value,
				description: data.description,
				category: data.category || "general",
			})
			.returning(this.columns);

		return newConfig;
	}

	/**
	 * 更新配置
	 */
	async updateByKey(key: string, data: UpdateSiteConfigDto) {
		// 先检查配置是否存在
		await this.getByKey(key);

		const [updatedConfig] = await db
			.update(siteConfigSchema)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(siteConfigSchema.key, key))
			.returning(this.columns);

		return updatedConfig;
	}

	/**
	 * 删除配置
	 */
	async deleteByKey(key: string) {
		// 先检查配置是否存在
		await this.getByKey(key);

		const [deletedConfig] = await db
			.delete(siteConfigSchema)
			.where(eq(siteConfigSchema.key, key))
			.returning(this.columns);

		return deletedConfig;
	}

	/**
	 * 批量更新配置
	 */
	async batchUpdate(configs: BatchUpdateSiteConfigDto) {
		const results = [];

		for (const config of configs) {
			try {
				// 检查配置是否存在
				const existing = await db
					.select(this.columns)
					.from(siteConfigSchema)
					.where(eq(siteConfigSchema.key, config.key))
					.limit(1);

				if (existing.length > 0) {
					// 更新现有配置
					const [updated] = await db
						.update(siteConfigSchema)
						.set({
							...config,
							updatedAt: new Date(),
						})
						.where(eq(siteConfigSchema.key, config.key))
						.returning(this.columns);
					results.push(updated);
				} else {
					// 创建新配置
					const [created] = await db
						.insert(siteConfigSchema)
						.values(config)
						.returning(this.columns);
					results.push(created);
				}
			} catch (error) {
				// 跳过错误的配置项，继续处理其他项
				continue;
			}
		}

		return results;
	}

	/**
	 * 初始化默认配置
	 */
	async initialize() {
		const defaultConfigs = [
			{
				key: "site_name",
				value: "购物网站",
				description: "网站名称",
				category: "basic",
			},
			{
				key: "site_description",
				value: "一个现代化的购物网站",
				description: "网站描述",
				category: "basic",
			},
			{
				key: "site_keywords",
				value: "购物,电商,商城",
				description: "网站关键词",
				category: "seo",
			},
			{
				key: "contact_email",
				value: "contact@example.com",
				description: "联系邮箱",
				category: "contact",
			},
			{
				key: "contact_phone",
				value: "400-000-0000",
				description: "联系电话",
				category: "contact",
			},
			{
				key: "company_address",
				value: "北京市朝阳区",
				description: "公司地址",
				category: "contact",
			},
			{
				key: "icp_number",
				value: "京ICP备xxxxxxxx号",
				description: "ICP备案号",
				category: "legal",
			},
			{
				key: "copyright",
				value: "© 2024 购物网站. All rights reserved.",
				description: "版权信息",
				category: "legal",
			},
			{
				key: "maintenance_mode",
				value: "false",
				description: "维护模式开关",
				category: "system",
			},
			{
				key: "user_registration",
				value: "true",
				description: "用户注册开关",
				category: "system",
			},
		];

		const results = [];

		for (const config of defaultConfigs) {
			try {
				// 检查配置是否已存在
				const existing = await db
					.select(this.columns)
					.from(siteConfigSchema)
					.where(eq(siteConfigSchema.key, config.key))
					.limit(1);

				if (existing.length === 0) {
					const [newConfig] = await db
						.insert(siteConfigSchema)
						.values(config)
						.returning(this.columns);

					results.push(newConfig);
				}
			} catch (error) {
				// 跳过错误的配置项，继续处理其他项
				continue;
			}
		}

		return results;
	}
}
