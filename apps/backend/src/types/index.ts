// 后端统一类型导出文件
// 为前端提供唯一的事实来源

export * from "@backend/modules/image/images.model";
export * from "../db/common.model";
// 数据库类型
export * from "../db/database.types";
// 模块类型导出
// export * from '../modules/auth/auth.model'; // auth模块暂未实现
export * from "../modules/category/categories.model";
export * from "../modules/order/orders.model";
export * from "../modules/product/products.model";
export * from "../modules/statistics/statistics.model";
export * from "../modules/user/users.model";

export * from "@backend/modules/upload/uploads.model";
export * from "@backend/utils/Res";






// 常用工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
