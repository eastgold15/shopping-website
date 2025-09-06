#!/usr/bin/env node

import { SchemaGenerator } from "./generate-schema";
import { getConfig } from "./schema-generator.config";

/**
 * 命令行工具入口
 */
class CLI {
	private args: string[];

	constructor() {
		this.args = process.argv.slice(2);
	}

	/**
	 * 显示帮助信息
	 */
	private showHelp(): void {
		console.log(`
🔧 Schema Generator CLI
`);
		console.log("用法:");
		console.log("  bun run generate:schema [选项]\n");
		console.log("选项:");
		console.log("  --env <env>        环境配置 (dev|prod|default)");
		console.log("  --schema-dir <dir> Schema 文件目录");
		console.log("  --output <file>    输出文件路径");
		console.log("  --no-types         不生成类型定义");
		console.log("  --no-table-names   不生成表名列表");
		console.log("  --help, -h         显示帮助信息");
		console.log("  --version, -v      显示版本信息\n");
		console.log("示例:");
		console.log("  bun run generate:schema");
		console.log("  bun run generate:schema --env dev");
		console.log(
			"  bun run generate:schema --schema-dir src/db/tables --output src/db/generated.ts",
		);
	}

	/**
	 * 显示版本信息
	 */
	private showVersion(): void {
		console.log("Schema Generator v1.0.0");
	}

	/**
	 * 解析命令行参数
	 */
	private parseArgs(): {
		env: "dev" | "prod" | "default";
		schemaDir?: string;
		outputFile?: string;
		generateTypes: boolean;
		generateTableNames: boolean;
		showHelp: boolean;
		showVersion: boolean;
	} {
		const result = {
			env: "default" as "dev" | "prod" | "default",
			schemaDir: undefined as string | undefined,
			outputFile: undefined as string | undefined,
			generateTypes: true,
			generateTableNames: true,
			showHelp: false,
			showVersion: false,
		};

		for (let i = 0; i < this.args.length; i++) {
			const arg = this.args[i];
			const nextArg = this.args[i + 1];

			switch (arg) {
				case "--env":
					if (nextArg && ["dev", "prod", "default"].includes(nextArg)) {
						result.env = nextArg as "dev" | "prod" | "default";
						i++;
					}
					break;
				case "--schema-dir":
					if (nextArg) {
						result.schemaDir = nextArg;
						i++;
					}
					break;
				case "--output":
					if (nextArg) {
						result.outputFile = nextArg;
						i++;
					}
					break;
				case "--no-types":
					result.generateTypes = false;
					break;
				case "--no-table-names":
					result.generateTableNames = false;
					break;
				case "--help":
				case "-h":
					result.showHelp = true;
					break;
				case "--version":
				case "-v":
					result.showVersion = true;
					break;
			}
		}

		return result;
	}

	/**
	 * 运行 CLI
	 */
	public async run(): Promise<void> {
		const options = this.parseArgs();

		if (options.showHelp) {
			this.showHelp();
			return;
		}

		if (options.showVersion) {
			this.showVersion();
			return;
		}

		try {
			console.log("🚀 启动 Schema 生成器...");

			// 获取基础配置
			const baseConfig = getConfig(options.env);

			// 应用命令行覆盖
			const config = {
				...baseConfig,
				...(options.schemaDir && { schemaDir: options.schemaDir }),
				...(options.outputFile && { outputFile: options.outputFile }),
				generateTypes: options.generateTypes,
				generateTableNames: options.generateTableNames,
			};

			console.log(`📁 使用环境配置: ${options.env}`);

			const generator = new SchemaGenerator(config);
			await generator.generate();

			console.log("\n🎉 生成完成!");
		} catch (error) {
			console.error("❌ 生成失败:", error);
			process.exit(1);
		}
	}
}

// 运行 CLI
if (require.main === module) {
	const cli = new CLI();
	cli.run();
}

export { CLI };
