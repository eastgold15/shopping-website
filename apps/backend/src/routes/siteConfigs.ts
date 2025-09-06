import { Elysia } from 'elysia';
import { db } from '../db/connection';
import { siteConfigSchema } from '../db/schema';
import { eq } from 'drizzle-orm';
import { commonRes } from '../plugins/Res';
import { siteConfigsModel } from './siteConfigs.model';

export const siteConfigsRoute = new Elysia({ prefix: 'site-configs' })
    .model(siteConfigsModel)
    // 获取所有配置
    .get('/', async () => {
        try {
            const dbConfigs = await db.select().from(siteConfigSchema);
            return commonRes(dbConfigs, 200);
        } catch (error) {
            console.error('获取网站配置失败:', error);
            return commonRes(null, 500, '获取网站配置失败');
        }
    }, {
        detail: {
            tags: ['SiteConfigs'],
            summary: '获取所有配置',
            description: '获取所有网站配置信息'
        }
    })

    // 根据分类获取配置
    .get('/category/:category', async ({ params: { category } }) => {
        try {
            const dbConfigs = await db.select()
                .from(siteConfigSchema)
                .where(eq(siteConfigSchema.category, category));
            return commonRes(dbConfigs, 200);
        } catch (error) {
            console.error('根据分类获取配置失败:', error);
            return commonRes(null, 500, '根据分类获取配置失败');
        }
    }, {
        params: 'CategoryParams',
        detail: {
            tags: ['SiteConfigs'],
            summary: '根据分类获取配置',
            description: '根据分类获取网站配置信息'
        }
    })

    // 根据键获取配置
    .get('/:key', async ({ params: { key } }) => {
        try {
            const [dbConfig] = await db.select()
                .from(siteConfigSchema)
                .where(eq(siteConfigSchema.key, key))
                .limit(1);

            if (!dbConfig) {
                return commonRes(null, 404, '配置不存在');
            }

            return commonRes(dbConfig, 200);
        } catch (error) {
            console.error('根据键获取配置失败:', error);
            return commonRes(null, 500, '根据键获取配置失败');
        }
    }, {
        params: 'KeyParams',
        detail: {
            tags: ['SiteConfigs'],
            summary: '根据键获取配置',
            description: '根据配置键获取特定配置信息'
        }
    })

    // 创建配置
    .post('/', async ({ body }) => {
        try {
            const data = body as any;
            const [newConfig] = await db.insert(siteConfigSchema)
                .values({
                    key: data.key,
                    value: data.value,
                    description: data.description,
                    category: data.category || 'general'
                })
                .returning();

            return commonRes(newConfig, 201);
        } catch (error) {
            console.error('创建配置失败:', error);
            return commonRes(null, 500, '创建配置失败');
        }
    }, {
        body: 'CreateSiteConfigDto',
        detail: {
            tags: ['SiteConfigs'],
            summary: '创建配置',
            description: '创建新的网站配置项'
        }
    })

    // 更新配置
    .put('/:key', async ({ params: { key }, body }) => {
        try {
            const data = body as any;
            const [updatedConfig] = await db.update(siteConfigSchema)
                .set({
                    value: data.value,
                    description: data.description,
                    category: data.category,
                    updatedAt: new Date()
                })
                .where(eq(siteConfigSchema.key, key))
                .returning();

            if (!updatedConfig) {
                return commonRes(null, 404, '配置不存在');
            }

            return commonRes(updatedConfig, 200);
        } catch (error) {
            console.error('更新配置失败:', error);
            return commonRes(null, 500, '更新配置失败');
        }
    }, {
        params: 'KeyParams',
        body: 'UpdateSiteConfigDto',
        detail: {
            tags: ['SiteConfigs'],
            summary: '更新配置',
            description: '根据键更新特定配置项'
        }
    })

    // 删除配置
    .delete('/:key', async ({ params: { key } }) => {
        try {
            const result = await db.delete(siteConfigSchema)
                .where(eq(siteConfigSchema.key, key));

            if (result.rowCount === 0) {
                return commonRes(null, 404, '配置不存在');
            }

            return commonRes({ success: true }, 200);
        } catch (error) {
            console.error('删除配置失败:', error);
            return commonRes(null, 500, '删除配置失败');
        }
    }, {
        detail: {
            tags: ['SiteConfigs'],
            summary: '删除配置',
            description: '根据键删除特定配置项'
        }
    })

    // 批量更新配置
    .patch('/batch', async ({ body }) => {
        try {
            const configs = body as { key: string; value: string }[];

            // 使用事务批量更新
            await db.transaction(async (tx) => {
                for (const config of configs) {
                    await tx.update(siteConfigSchema)
                        .set({
                            value: config.value,
                            updatedAt: new Date()
                        })
                        .where(eq(siteConfigSchema.key, config.key));
                }
            });

            return commonRes({ success: true }, 200);
        } catch (error) {
            console.error('批量更新配置失败:', error);
            return commonRes(null, 500, '批量更新配置失败');
        }
    }, {
        body: 'BatchUpdateConfigDto',
        detail: {
            tags: ['SiteConfigs'],
            summary: '批量更新配置',
            description: '批量更新多个配置项'
        }
    })

    // 初始化默认配置
    .post('/initialize', async () => {
        try {
            const defaultConfigs = [
                // 基本设置
                { key: 'site_name', value: '外贸服装商城', description: '网站名称', category: 'general' },
                { key: 'site_logo', value: '', description: '网站Logo URL', category: 'general' },
                { key: 'site_keywords', value: '外贸,服装,时尚,购物', description: '网站关键词', category: 'seo' },
                { key: 'site_description', value: '专业的外贸服装购物平台', description: '网站描述', category: 'seo' },
                { key: 'contact_email', value: '', description: '联系邮箱', category: 'contact' },
                { key: 'contact_phone', value: '', description: '联系电话', category: 'contact' },
                { key: 'contact_address', value: '', description: '联系地址', category: 'contact' },
                { key: 'icp_number', value: '', description: 'ICP备案号', category: 'legal' },
                { key: 'copyright', value: '© 2024 外贸服装商城 All Rights Reserved', description: '版权信息', category: 'legal' },
                { key: 'header_notice', value: 'FREE SHIPPING on orders over $59* details', description: '顶部通知', category: 'general' },
                { key: 'free_shipping_threshold', value: '59', description: '免费配送门槛', category: 'general' },
                { key: 'currency', value: 'USD', description: '货币单位', category: 'general' },
                
                // 导航页配置
                { key: 'nav_home_enabled', value: 'true', description: '是否显示首页导航', category: 'navigation' },
                { key: 'nav_products_enabled', value: 'true', description: '是否显示产品导航', category: 'navigation' },
                { key: 'nav_categories_enabled', value: 'true', description: '是否显示分类导航', category: 'navigation' },
                { key: 'nav_about_enabled', value: 'true', description: '是否显示关于我们导航', category: 'navigation' },
                { key: 'nav_contact_enabled', value: 'true', description: '是否显示联系我们导航', category: 'navigation' },
                
                // 网站顶部配置
                { key: 'header_banner_text', value: 'FREE SHIPPING on orders over $59* details', description: '顶部横幅文本', category: 'header' },
                { key: 'header_banner_link', value: '/shipping-info', description: '顶部横幅链接', category: 'header' },
                { key: 'header_track_order_text', value: 'Track Order', description: '追踪订单文本', category: 'header' },
                { key: 'header_track_order_link', value: '/track-order', description: '追踪订单链接', category: 'header' },
                { key: 'header_help_links', value: '[{"text":"Help","url":"/help"},{"text":"Contact","url":"/contact"}]', description: '帮助链接JSON', category: 'header' },
                { key: 'header_search_enabled', value: 'true', description: '是否显示搜索框', category: 'header' },
                { key: 'header_cart_enabled', value: 'true', description: '是否显示购物车图标', category: 'header' },
                { key: 'header_user_menu_enabled', value: 'true', description: '是否显示用户菜单', category: 'header' },
                
                // 底部配置
                { key: 'footer_copyright', value: '© 2024 WWW.APPARELCITY.COM.CN All Rights Reserved 赣ICP备2024041550号-5', description: '版权信息', category: 'footer' },
                { key: 'footer_back_to_top_text', value: 'Back to top', description: '返回顶部文本', category: 'footer' },
                { key: 'footer_sections', value: '[{"title":"For You","links":[{"text":"Favorites","url":"/favorites"},{"text":"Gift Cards","url":"/gift-cards"}]},{"title":"Connect with Us","links":[{"text":"Customer Service","url":"/customer-service"},{"text":"Social Media","url":"/social"}]},{"title":"Legal","links":[{"text":"Terms of Use","url":"/terms"},{"text":"Privacy Policy","url":"/privacy"}]}]', description: '底部栏目JSON', category: 'footer' },
                { key: 'footer_company_name', value: '外贸服装商城有限公司', description: '公司名称', category: 'footer' },
                { key: 'footer_company_address', value: '', description: '公司地址', category: 'footer' },
                { key: 'footer_company_phone', value: '', description: '公司电话', category: 'footer' },
                { key: 'footer_company_email', value: '', description: '公司邮箱', category: 'footer' },
                { key: 'footer_social_facebook', value: '', description: 'Facebook链接', category: 'footer' },
                { key: 'footer_social_twitter', value: '', description: 'Twitter链接', category: 'footer' },
                { key: 'footer_social_instagram', value: '', description: 'Instagram链接', category: 'footer' },
                { key: 'footer_social_youtube', value: '', description: 'YouTube链接', category: 'footer' }
            ];

            for (const config of defaultConfigs) {
                // 检查配置是否已存在
                const [existing] = await db.select()
                    .from(siteConfigSchema)
                    .where(eq(siteConfigSchema.key, config.key))
                    .limit(1);

                if (!existing) {
                    await db.insert(siteConfigSchema).values(config);
                }
            }

            return commonRes({ success: true, message: '默认配置初始化完成' }, 200);
        } catch (error) {
            console.error('初始化默认配置失败:', error);
            return commonRes(null, 500, '初始化默认配置失败');
        }
    }, {
        detail: {
            tags: ['SiteConfigs'],
            summary: '初始化默认配置',
            description: '初始化网站的默认配置项'
        }
    })
