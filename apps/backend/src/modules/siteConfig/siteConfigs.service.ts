import { db } from "@backend/db/connection";
import type { QueryOptions } from "@backend/types";
import { NotFoundError } from "@backend/utils/error/customError";
import type { PageData } from "@backend/utils/Res";
import { BaseService } from "@backend/utils/services/BaseService";
import {
  eq,
  getTableColumns,
  inArray
} from "drizzle-orm";
import { BatchUpdateSiteConfigDto, InsertSiteConfigDto, SelectSiteConfigType, SiteConfigListQueryDto, siteConfigTable, UpdateSiteConfigDto } from "../../db/models/siteConfig.model";

/**
 * 网站配置服务类
 * 处理网站配置相关的业务逻辑
 */
export class SiteConfigsService extends BaseService<
  SelectSiteConfigType,
  InsertSiteConfigDto,
  UpdateSiteConfigDto
> {
  protected readonly table = siteConfigTable;
  protected readonly tableName = 'siteConfig';
  private readonly columns = getTableColumns(siteConfigTable);

  constructor() {
    super();
  }

  /**
   * 获取配置列表 - 使用 BaseService 的 findPaginated 方法
   * @param params 查询参数
   * @returns 分页的配置列表
   */
  async getList(params: SiteConfigListQueryDto): Promise<PageData<SelectSiteConfigType>> {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      sortOrder = "desc",
      search,
      category,
      key,
    } = params;

    // 构建查询选项
    const queryOptions: QueryOptions = {
      filters: [],
      sort: []
    };

    // 处理搜索条件
    if (search) {
      queryOptions.filters?.push({
        field: 'key',
        operator: 'like',
        value: `%${search}%`
      });
      queryOptions.filters?.push({
        field: 'description',
        operator: 'like',
        value: `%${search}%`
      });
    }

    // 处理分类过滤
    if (category) {
      queryOptions.filters?.push({
        field: 'category',
        operator: 'eq',
        value: category
      });
    }

    // 处理键名过滤
    if (key) {
      queryOptions.filters?.push({
        field: 'key',
        operator: 'like',
        value: `%${key}%`
      });
    }

    // 处理排序
    queryOptions.sort?.push({
      field: sort,
      direction: sortOrder
    });

    // 使用 BaseService 的分页方法
    return await this.findPaginated(
      { page, limit },
      queryOptions
    );
  }

  /**
   * 获取所有配置（不分页）- 使用 BaseService 的 findMany 方法
   * @param category 可选的分类过滤
   * @returns 配置列表
   */
  async getAll(category?: string): Promise<SelectSiteConfigType[]> {
    const queryOptions: QueryOptions = {
      filters: [],
      sort: [
        { field: 'category', direction: 'asc' },
        { field: 'key', direction: 'asc' }
      ]
    };

    // 处理分类过滤
    if (category) {
      queryOptions.filters?.push({
        field: 'category',
        operator: 'eq',
        value: category
      });
    }

    // 使用 BaseService 的 findMany 方法
    return await this.findMany(queryOptions);
  }

  /**
   * 根据分类获取配置
   */
  async getByCategory(category: string) {
    const result = await db
      .select(this.columns)
      .from(siteConfigTable)
      .where(eq(siteConfigTable.category, category));

    return result;
  }

  /**
   * 根据键获取配置
   */
  async getByKeys(keys: string[]) {
    const config = await db
      .select(this.columns)
      .from(siteConfigTable)
      .where(inArray(siteConfigTable.key, keys));

    if (!config || config.length === 0) {
      throw new NotFoundError(`配置项不存在`);
    }

    return config;
  }

  /**
   * 根据ID获取配置
   * @param id 配置ID
   * @returns 配置信息
   */
  async getById(id: number) {
    const [config] = await db
      .select(this.columns)
      .from(siteConfigTable)
      .where(eq(siteConfigTable.id, id))
      .limit(1);

    if (!config) {
      throw new NotFoundError("配置不存在");
    }

    return config;
  }

  /**
   * 创建配置
   */
  async create(data: InsertSiteConfigDto) {
    const [newConfig] = await db
      .insert(siteConfigTable)
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
    const res = await this.getByKeys([key]);

    if ((res.length = 0)) {
      throw new NotFoundError(`Record with key ${key} not found`);
    }

    const [updatedConfig] = await db
      .update(siteConfigTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(siteConfigTable.key, key))
      .returning(this.columns);

    return updatedConfig;
  }

  /**
   * 根据ID更新配置
   */
  async updateById(id: number, data: UpdateSiteConfigDto) {
    const [updatedConfig] = await db
      .update(siteConfigTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(siteConfigTable.id, id))
      .returning(this.columns);

    if (!updatedConfig) {
      throw new NotFoundError("配置不存在");
    }

    return updatedConfig;
  }

  /**
   * 删除配置
   */
  async deleteByKey(key: string) {
    // 先检查配置是否存在
    const res = await this.getByKeys([key]);

    if (!res) {
      throw new NotFoundError("配置不存在");
    }

    const [deletedConfig] = await db
      .delete(siteConfigTable)
      .where(eq(siteConfigTable.key, key))
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
          .from(siteConfigTable)
          .where(eq(siteConfigTable.key, config.key))
          .limit(1);

        if (existing.length > 0) {
          // 更新现有配置
          const [updated] = await db
            .update(siteConfigTable)
            .set({
              ...config,
              updatedAt: new Date(),
            })
            .where(eq(siteConfigTable.key, config.key))
            .returning(this.columns);
          results.push(updated);
        } else {
          // 创建新配置
          const [created] = await db
            .insert(siteConfigTable)
            .values(config)
            .returning(this.columns);
          results.push(created);
        }
      } catch (_error) { }
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
          .from(siteConfigTable)
          .where(eq(siteConfigTable.key, config.key))
          .limit(1);

        if (existing.length === 0) {
          const [newConfig] = await db
            .insert(siteConfigTable)
            .values(config)
            .returning(this.columns);

          results.push(newConfig);
        }
      } catch (_error) { }
    }

    return results;
  }
}
