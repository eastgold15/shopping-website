/**
 * Schema 生成器配置文件
 */
export interface SchemaGeneratorConfig {
	/** schema 文件所在目录 */
	schemaDir: string;
	/** 输出文件路径 */
	outputFile: string;
	/** 要排除的文件模式 */
	excludePatterns: string[];
	/** 要包含的表名模式（正则表达式字符串） */
	includeTablePatterns: string[];
	/** 要排除的表名模式（正则表达式字符串） */
	excludeTablePatterns: string[];
	/** 是否生成类型定义 */
	generateTypes: boolean;
	/** 是否生成表名列表 */
	generateTableNames: boolean;
	/** 自定义导入路径映射 */
	importPathMapping?: Record<string, string>;
}

/**
 * 默认配置
 */
export const defaultConfig: SchemaGeneratorConfig = {
	schemaDir: "src/server/src/db/schema",
	// outputFile: "src/server/src/db/schema/generated-schema.ts",
	outputFile: "src/server/src/db/schema/index.ts",
	excludePatterns: [
		"**/generated-*.ts",
		"**/index.ts",
		"**/*.test.ts",
		"**/*.spec.ts",
	],
	includeTablePatterns: [".*"], // 包含所有表
	excludeTablePatterns: [
		".*Relations$", // 排除关系定义
		// '.*Schema$',    // 排除 schema 对象
		".*Enum$",
		// 排除pgEnum枚举类型
	],
	generateTypes: true,
	generateTableNames: true,
	importPathMapping: {
		// 可以在这里定义自定义的导入路径映射
		// 例如: 'src/db/schema/auth.ts': './auth'
	},
};

/**
 * 开发环境配置
 */
export const devConfig: SchemaGeneratorConfig = {
	...defaultConfig,
	// 开发环境可能需要更详细的日志
};

/**
 * 生产环境配置
 */
export const prodConfig: SchemaGeneratorConfig = {
	...defaultConfig,
	// 生产环境可能需要更严格的验证
};

/**
 * 获取配置
 */
export function getConfig(
	env: "dev" | "prod" | "default" = "default",
): SchemaGeneratorConfig {
	switch (env) {
		case "dev":
			return devConfig;
		case "prod":
			return prodConfig;
		default:
			return defaultConfig;
	}
}
