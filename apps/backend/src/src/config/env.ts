import { join } from "node:path";
import { config } from "dotenv";
import * as dotenvExpand from "dotenv-expand";

/**
 * 环境配置管理器
 * 提供低耦合的环境变量加载方案
 */
export class EnvConfig {
	private static instance: EnvConfig;
	private isLoaded = false;

	private constructor() { }

	/**
	 * 获取单例实例
	 */
	static getInstance(): EnvConfig {
		if (!EnvConfig.instance) {
			EnvConfig.instance = new EnvConfig();
		}
		return EnvConfig.instance;
	}

	/**
	 * 加载环境变量配置
	 * @param options 配置选项
	 */
	loadConfig(options?: {
		environment?: "development" | "production" | "test";
		customPath?: string;
		override?: boolean;
	}) {
		if (this.isLoaded && !options?.override) {
			return;
		}

		const environment = options?.environment || this.detectEnvironment();

		// 在生产环境中，如果关键环境变量已存在，跳过文件加载
		if (environment === "production" && this.hasRequiredEnvVars()) {
			console.log("✅ 检测到容器环境变量，跳过文件加载");
			this.isLoaded = true;
			return;
		}

		const envPaths = this.getEnvPaths(environment, options?.customPath);

		// 按优先级加载环境变量文件
		for (const envPath of envPaths) {
			try {
				const result = dotenvExpand.expand(
					config({
						path: envPath,
						override: options?.override || false,
					}),
				);

				if (!result.error) {
					console.log(`✅ 成功加载环境配置: ${envPath}`);
				} else {
					console.warn(`⚠️ 环境配置文件不存在或无法读取: ${envPath}`);
				}
			} catch (error) {
				console.error(`❌ 加载环境配置失败: ${envPath}`, error);
			}
		}

		this.isLoaded = true;
		this.validateRequiredEnvVars();
	}

	/**
	 * 检测当前环境
	 */
	private detectEnvironment(): "development" | "production" | "test" {
		const nodeEnv = process.env.NODE_ENV;

		if (nodeEnv === "production") return "production";
		if (nodeEnv === "test") return "test";
		return "development";
	}

	/**
	 * 获取环境变量文件路径列表
	 * @param environment 环境类型
	 * @param customPath 自定义路径
	 */
	private getEnvPaths(environment: string, customPath?: string): string[] {
		const projectRoot = process.cwd();
		const paths: string[] = [];

		if (customPath) {
			paths.push(customPath);
			return paths;
		}

		// 优先级顺序：特定环境 > 通用配置
		switch (environment) {
			case "development":
				paths.push(
					join(projectRoot, "src", "server", "src", ".container", "dev", ".env.development"),
					// join(projectRoot,"src", "server","src", ".container", "dev", ".env"),
					// join(projectRoot, ".env.development"),
					join(projectRoot, ".env"),
				);
				break;
			case "production":
				paths.push(
					join(projectRoot, "src", "server", "src", ".container", "prod", ".env.production"),
					// join(projectRoot,"src", "server","src", ".container", "prod", ".env"),
					// join(projectRoot, ".env.production"),
					join(projectRoot, ".env"),
				);
				break;
			case "test":
				paths.push(join(projectRoot, ".env.test"), join(projectRoot, ".env"));
				break;
			default:
				paths.push(join(projectRoot, ".env"));
		}

		return paths;
	}

	/**
	 * 检查必需的环境变量是否已存在
	 */
	private hasRequiredEnvVars(): boolean {
		const requiredVars = ["DATABASE_URL", "APP_PORT", "JWT_SECRET"];

		return requiredVars.every((varName) => process.env[varName]);
	}

	/**
	 * 验证必需的环境变量
	 */
	private validateRequiredEnvVars() {
		const requiredVars = ["DATABASE_URL", "APP_PORT", "JWT_SECRET"];

		const missingVars = requiredVars.filter((varName) => !process.env[varName]);

		if (missingVars.length > 0) {
			console.warn(`⚠️ 缺少必需的环境变量: ${missingVars.join(", ")}`);
		}
	}

	/**
	 * 获取环境变量值
	 * @param key 环境变量键
	 * @param defaultValue 默认值
	 */
	get(key: string, defaultValue?: string): string | undefined {
		return process.env[key] || defaultValue;
	}

	/**
	 * 获取数字类型的环境变量
	 * @param key 环境变量键
	 * @param defaultValue 默认值
	 */
	getNumber(key: string, defaultValue?: number): number {
		const value = process.env[key];
		if (!value) return defaultValue || 0;
		const parsed = Number.parseInt(value, 10);
		return Number.isNaN(parsed) ? defaultValue || 0 : parsed;
	}

	/**
	 * 获取布尔类型的环境变量
	 * @param key 环境变量键
	 * @param defaultValue 默认值
	 */
	getBoolean(key: string, defaultValue?: boolean): boolean {
		const value = process.env[key]?.toLowerCase();
		if (!value) return defaultValue || false;
		return value === "true" || value === "1" || value === "yes";
	}

	/**
	 * 获取当前环境信息
	 */
	getEnvironmentInfo() {
		return {
			environment: this.detectEnvironment(),
			nodeEnv: process.env.NODE_ENV,
			appPort: this.getNumber("APP_PORT", 9003),
			appHost: this.get("APP_HOST", "localhost"),
			databaseUrl: this.get("DATABASE_URL") ? "已配置" : "未配置",
			jwtSecret: this.get("JWT_SECRET") ? "已配置" : "未配置",
		};
	}
}

// 导出单例实例
export const envConfig = EnvConfig.getInstance();

// 自动加载配置（可选）
if (process.env.AUTO_LOAD_ENV !== "false") {
	envConfig.loadConfig();
}
