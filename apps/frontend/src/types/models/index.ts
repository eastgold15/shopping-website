// 从后端导入的数据库相关类型
// 这些类型是根据数据库表结构自动生成的，确保前后端类型一致

// 基础数据库类型
export type * from '@backend/db/database.types';

// 图片相关类型
export type * from '@backend/routes/images.model';

// 产品相关类型  
export type * from '@backend/routes/products.model';

// 分类相关类型
export type * from '@backend/routes/categories.model';

// 合作伙伴相关类型
export type * from '@backend/routes/partners.model';

// 广告相关类型
export type * from '@backend/routes/advertisements.model';

// 站点配置相关类型
export type * from '@backend/routes/siteConfigs.model';

// 用户相关类型
export type * from '@backend/routes/users.model';