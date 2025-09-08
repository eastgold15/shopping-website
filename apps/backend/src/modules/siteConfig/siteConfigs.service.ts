
import { eq } from 'drizzle-orm';
import { getTableColumns } from 'drizzle-orm';
import type { CreateSiteConfigDto, UpdateSiteConfigDto, BatchUpdateSiteConfigDto } from './siteConfigs.model';
import { siteConfigSchema } from '@backend/db/schema/schema';
import { db } from '@backend/db/connection';

/**
 * 网站配置服务类
 * 处理网站配置相关的业务逻辑
 */
export class SiteConfigsService {
  private readonly columns = getTableColumns(siteConfigSchema);

  /**
   * 获取所有配置
   */
  async getAllConfigs() {
    return await db.select(this.columns).from(siteConfigSchema);
  }

  /**
   * 根据分类获取配置
   */
  async getConfigsByCategory(category: string) {
    return await db.select(this.columns)
      .from(siteConfigSchema)
      .where(eq(siteConfigSchema.category, category));
  }

  /**
   * 根据键获取配置
   */
  async getConfigByKey(key: string) {
    const [config] = await db.select(this.columns)
      .from(siteConfigSchema)
      .where(eq(siteConfigSchema.key, key))
      .limit(1);

    return config || null;
  }

  /**
   * 创建配置
   */
  async createConfig(data: CreateSiteConfigDto) {
    const [newConfig] = await db.insert(siteConfigSchema)
      .values({
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category || 'general'
      })
      .returning(this.columns);

    return newConfig;
  }

  /**
   * 更新配置
   */
  async updateConfig(key: string, data: UpdateSiteConfigDto) {
    const [updatedConfig] = await db.update(siteConfigSchema)
      .set({
        value: data.value,
        description: data.description,
        category: data.category,
        updatedAt: new Date()
      })
      .where(eq(siteConfigSchema.key, key))
      .returning(this.columns);

    return updatedConfig || null;
  }

  /**
   * 删除配置
   */
  async deleteConfig(key: string) {
    const [deletedConfig] = await db.delete(siteConfigSchema)
      .where(eq(siteConfigSchema.key, key))
      .returning(this.columns);

    return deletedConfig || null;
  }

  /**
   * 批量更新配置
   */
  async batchUpdateConfigs(configs: BatchUpdateSiteConfigDto) {
    const results = [];

    for (const config of configs) {
      try {
        const [updatedConfig] = await db.update(siteConfigSchema)
          .set({
            value: config.value,
            description: config.description,
            category: config.category,
            updatedAt: new Date()
          })
          .where(eq(siteConfigSchema.key, config.key))
          .returning(this.columns);

        if (updatedConfig) {
          results.push(updatedConfig);
        }
      } catch (error) {
        console.error(`批量更新配置 ${config.key} 失败:`, error);
      }
    }

    return results;
  }

  /**
   * 初始化默认配置
   */
  async initializeDefaultConfigs() {
    const defaultConfigs = [
      {
        key: 'site_name',
        value: '购物网站',
        description: '网站名称',
        category: 'basic'
      },
      {
        key: 'site_description',
        value: '一个现代化的购物网站',
        description: '网站描述',
        category: 'basic'
      },
      {
        key: 'site_keywords',
        value: '购物,电商,商城',
        description: '网站关键词',
        category: 'seo'
      },
      {
        key: 'contact_email',
        value: 'contact@example.com',
        description: '联系邮箱',
        category: 'contact'
      },
      {
        key: 'contact_phone',
        value: '400-000-0000',
        description: '联系电话',
        category: 'contact'
      },
      {
        key: 'company_address',
        value: '北京市朝阳区',
        description: '公司地址',
        category: 'contact'
      },
      {
        key: 'icp_number',
        value: '京ICP备xxxxxxxx号',
        description: 'ICP备案号',
        category: 'legal'
      },
      {
        key: 'copyright',
        value: '© 2024 购物网站. All rights reserved.',
        description: '版权信息',
        category: 'legal'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: '维护模式开关',
        category: 'system'
      },
      {
        key: 'user_registration',
        value: 'true',
        description: '用户注册开关',
        category: 'system'
      }
    ];

    const results = [];

    for (const config of defaultConfigs) {
      try {
        // 检查配置是否已存在
        const existing = await this.getConfigByKey(config.key);

        if (!existing) {
          const [newConfig] = await db.insert(siteConfigSchema)
            .values(config)
            .returning(this.columns);

          results.push(newConfig);
        }
      } catch (error) {
        console.error(`初始化配置 ${config.key} 失败:`, error);
      }
    }

    return results;
  }
}