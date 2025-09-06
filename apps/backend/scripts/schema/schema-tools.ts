#!/usr/bin/env node

import { SchemaGenerator } from "./generate-schema";
import { getConfig } from "./schema-generator.config";
import { SchemaValidator } from "./validate-schema";
import { SchemaWatcher } from "./watch-schema";

/**
 * Schema 工具集成命令行工具
 */
class SchemaTools {
	private args: string[];

	constructor() {
		this.args = process.argv.slice(2);
	}

	/**
	 * 显示帮助信息
	 */
	private showHelp(): void {
		console.log(`
🛠️  Schema Tools - 数据库 Schema 自动化工具集
`);
		console.log("用法:");
		console.log("  bun run schema-tools <command> [选项]\n");

		console.log("命令:");
		console.log("  generate     生成 dbSchema 文件");
		console.log("  validate     验证 schema 同步状态");
		console.log("  watch        监听文件变化并自动生成");
		console.log("  sync         验证并生成 (如果需要)");
		console.log("  clean        清理生成的文件");
		console.log("  info         显示当前配置信息");
		console.log("  help         显示帮助信息\n");

		console.log("全局选项:");
		console.log("  --env <env>        环境配置 (dev|prod|default)");
		console.log("  --verbose, -v      详细输出");
		console.log("  --quiet, -q        静默模式\n");

		console.log("generate 选项:");
		console.log("  --schema-dir <dir> Schema 文件目录");
		console.log("  --output <file>    输出文件路径");
		console.log("  --no-types         不生成类型定义");
		console.log("  --no-table-names   不生成表名列表\n");

		console.log("validate 选项:");
		console.log("  --diff             显示详细差异信息");
		console.log("  --fix              自动修复不同步问题\n");

		console.log("示例:");
		console.log("  bun run schema-tools generate");
		console.log("  bun run schema-tools validate --diff");
		console.log("  bun run schema-tools sync --env dev");
		console.log("  bun run schema-tools watch --env dev");
	}

	/**
	 * 解析环境参数
	 */
	private parseEnv(): "dev" | "prod" | "default" {
		const envIndex = this.args.findIndex((arg) => arg === "--env");
		if (envIndex !== -1 && this.args[envIndex + 1]) {
			const env = this.args[envIndex + 1];
			if (["dev", "prod", "default"].includes(env)) {
				return env as "dev" | "prod" | "default";
			}
		}
		return "default";
	}

	/**
	 * 检查是否为详细模式
	 */
	private isVerbose(): boolean {
		return this.args.includes("--verbose") || this.args.includes("-v");
	}

	/**
	 * 检查是否为静默模式
	 */
	private isQuiet(): boolean {
		return this.args.includes("--quiet") || this.args.includes("-q");
	}

	/**
	 * 生成命令
	 */
	private async runGenerate(): Promise<void> {
		const env = this.parseEnv();
		const config = getConfig(env);

		// 解析生成特定选项
		const customConfig = { ...config };

		const schemaDirIndex = this.args.findIndex((arg) => arg === "--schema-dir");
		if (schemaDirIndex !== -1 && this.args[schemaDirIndex + 1]) {
			customConfig.schemaDir = this.args[schemaDirIndex + 1];
		}

		const outputIndex = this.args.findIndex((arg) => arg === "--output");
		if (outputIndex !== -1 && this.args[outputIndex + 1]) {
			customConfig.outputFile = this.args[outputIndex + 1];
		}

		if (this.args.includes("--no-types")) {
			customConfig.generateTypes = false;
		}

		if (this.args.includes("--no-table-names")) {
			customConfig.generateTableNames = false;
		}

		const generator = new SchemaGenerator(customConfig);
		await generator.generate();
	}

	/**
	 * 验证命令
	 */
	private async runValidate(): Promise<void> {
		const env = this.parseEnv();
		const showDiff = this.args.includes("--diff");
		const autoFix = this.args.includes("--fix");

		const validator = new SchemaValidator(env);
		const result = await validator.validate();

		if (!this.isQuiet()) {
			console.log(result.message);
		}

		if (!result.isValid) {
			if (showDiff && result.details) {
				validator.showDifferences(result.details);
			}

			if (autoFix) {
				console.log("🔧 自动修复中...");
				await this.runGenerate();
				console.log("✅ 修复完成");
				return;
			}

			process.exit(1);
		}
	}

	/**
	 * 监听命令
	 */
	private runWatch(): void {
		const env = this.parseEnv();
		const watcher = new SchemaWatcher(env);
		watcher.start();
	}

	/**
	 * 同步命令 (验证 + 生成)
	 */
	private async runSync(): Promise<void> {
		const env = this.parseEnv();

		console.log("🔄 开始同步 Schema...");

		const validator = new SchemaValidator(env);
		const result = await validator.validate();

		if (result.isValid) {
			console.log("✅ Schema 已同步，无需生成");
		} else {
			console.log("🔧 Schema 不同步，开始生成...");
			await this.runGenerate();
			console.log("✅ 同步完成");
		}
	}

	/**
	 * 清理命令
	 */
	private runClean(): void {
		const env = this.parseEnv();
		const config = getConfig(env);

		try {
			const fs = require("node:fs");
			if (fs.existsSync(config.outputFile)) {
				fs.unlinkSync(config.outputFile);
				console.log(`🗑️  已删除: ${config.outputFile}`);
			} else {
				console.log("📁 没有找到需要清理的文件");
			}
		} catch (error) {
			console.error("❌ 清理失败:", error);
			process.exit(1);
		}
	}

	/**
	 * 信息命令
	 */
	private runInfo(): void {
		const env = this.parseEnv();
		const config = getConfig(env);

		console.log("📋 当前配置信息:");
		console.log(`  环境: ${env}`);
		console.log(`  Schema 目录: ${config.schemaDir}`);
		console.log(`  输出文件: ${config.outputFile}`);
		console.log(`  生成类型: ${config.generateTypes ? "是" : "否"}`);
		console.log(`  生成表名: ${config.generateTableNames ? "是" : "否"}`);
		console.log(`  排除文件模式: ${config.excludePatterns.join(", ")}`);
		console.log(`  排除表名模式: ${config.excludeTablePatterns.join(", ")}`);
	}

	/**
	 * 运行工具
	 */
	public async run(): Promise<void> {
		const command = this.args[0];

		if (
			!command ||
			command === "help" ||
			command === "--help" ||
			command === "-h"
		) {
			this.showHelp();
			return;
		}

		try {
			switch (command) {
				case "generate":
				case "gen":
					await this.runGenerate();
					break;
				case "validate":
				case "val":
					await this.runValidate();
					break;
				case "watch":
					this.runWatch();
					break;
				case "sync":
					await this.runSync();
					break;
				case "clean":
					this.runClean();
					break;
				case "info":
					this.runInfo();
					break;
				default:
					console.error(`❌ 未知命令: ${command}`);
					console.log("使用 --help 查看可用命令");
					process.exit(1);
			}
		} catch (error) {
			console.error("❌ 执行失败:", error);
			process.exit(1);
		}
	}
}

// 运行工具
if (require.main === module) {
	const tools = new SchemaTools();
	tools.run();
}

export { SchemaTools };
