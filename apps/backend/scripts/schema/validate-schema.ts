import { existsSync, readFileSync } from "node:fs";
import { SchemaGenerator } from "./generate-schema";
import { getConfig } from "./schema-generator.config";

/**
 * Schema 验证器
 * 验证生成的 schema 文件是否与当前的 schema 定义同步
 */
class SchemaValidator {
	private config: ReturnType<typeof getConfig>;

	constructor(env: "dev" | "prod" | "default" = "default") {
		this.config = getConfig(env);
	}

	/**
	 * 生成临时 schema 内容
	 */
	private async generateTempSchema(): Promise<string> {
		const generator = new SchemaGenerator({
			...this.config,
			outputFile: "/tmp/temp-schema.ts", // 临时文件路径
		});

		// 重写生成方法以返回内容而不是写入文件
		const originalGenerate = generator.generate.bind(generator);

		// 创建一个临时的生成器来获取内容
		const tempGenerator = new (class extends SchemaGenerator {
			public async getGeneratedContent(): Promise<string> {
				console.log("🔍 分析当前 schema 文件...");

				// 扫描所有 schema 文件
				const sourceFiles = (this as any).scanSchemaFiles();
				console.log(`找到 ${sourceFiles.length} 个 schema 文件`);

				// 提取所有表定义
				const allTables: Array<{
					name: string;
					filePath: string;
					relativePath: string;
				}> = [];

				for (const sourceFile of sourceFiles) {
					// 跳过生成的文件
					if (sourceFile.getFilePath().includes("generated-schema.ts")) {
						continue;
					}

					const tables = (this as any).extractPgTableVariables(sourceFile);
					allTables.push(...tables);
				}

				if (allTables.length === 0) {
					throw new Error("未找到任何 pgTable 定义");
				}

				// 生成文件内容
				return (this as any).generateSchemaContent(allTables);
			}
		})(this.config);

		return await tempGenerator.getGeneratedContent();
	}

	/**
	 * 读取现有的 schema 文件
	 */
	private readExistingSchema(): string | null {
		if (!existsSync(this.config.outputFile)) {
			return null;
		}

		return readFileSync(this.config.outputFile, "utf-8");
	}

	/**
	 * 标准化内容以便比较
	 */
	private normalizeContent(content: string): string {
		return (
			content
				// 移除时间戳行
				.replace(/\* 生成时间: .*\n/, "")
				// 标准化换行符
				.replace(/\r\n/g, "\n")
				// 移除多余的空白
				.trim()
		);
	}

	/**
	 * 验证 schema 是否同步
	 */
	public async validate(): Promise<{
		isValid: boolean;
		message: string;
		details?: {
			hasFile: boolean;
			contentMatch: boolean;
			expectedContent?: string;
			actualContent?: string;
		};
	}> {
		try {
			console.log("🔍 开始验证 Schema 同步状态...");

			// 生成期望的内容
			const expectedContent = await this.generateTempSchema();

			// 读取现有文件
			const actualContent = this.readExistingSchema();

			if (!actualContent) {
				return {
					isValid: false,
					message:
						"❌ 生成的 schema 文件不存在，请运行 `bun run generate:schema`",
					details: {
						hasFile: false,
						contentMatch: false,
						expectedContent,
					},
				};
			}

			// 标准化内容进行比较
			const normalizedExpected = this.normalizeContent(expectedContent);
			const normalizedActual = this.normalizeContent(actualContent);

			const contentMatch = normalizedExpected === normalizedActual;

			if (contentMatch) {
				return {
					isValid: true,
					message: "✅ Schema 文件与当前定义同步",
					details: {
						hasFile: true,
						contentMatch: true,
					},
				};
			}
			return {
				isValid: false,
				message:
					"❌ Schema 文件与当前定义不同步，请运行 `bun run generate:schema` 更新",
				details: {
					hasFile: true,
					contentMatch: false,
					expectedContent: normalizedExpected,
					actualContent: normalizedActual,
				},
			};
		} catch (error) {
			return {
				isValid: false,
				message: `❌ 验证过程中出错: ${error}`,
			};
		}
	}

	/**
	 * 显示详细的差异信息
	 */
	public showDifferences(
		details: NonNullable<
			Awaited<ReturnType<SchemaValidator["validate"]>>["details"]
		>,
	): void {
		if (!details.expectedContent || !details.actualContent) {
			return;
		}

		console.log("\n📋 内容差异:");
		console.log("\n期望内容 (前100字符):");
		console.log(`${details.expectedContent.substring(0, 100)}...`);
		console.log("\n实际内容 (前100字符):");
		console.log(`${details.actualContent.substring(0, 100)}...`);

		// 简单的行差异检查
		const expectedLines = details.expectedContent.split("\n");
		const actualLines = details.actualContent.split("\n");

		console.log("\n📊 统计信息:");
		console.log(`期望行数: ${expectedLines.length}`);
		console.log(`实际行数: ${actualLines.length}`);

		if (expectedLines.length !== actualLines.length) {
			console.log("⚠️  行数不匹配");
		}
	}
}

/**
 * 命令行入口
 */
if (require.main === module) {
	const args = process.argv.slice(2);
	const envArg = args.find((arg) => arg.startsWith("--env="));
	const env = envArg
		? (envArg.split("=")[1] as "dev" | "prod" | "default")
		: "default";
	const showDiff = args.includes("--diff");

	const validator = new SchemaValidator(env);

	validator
		.validate()
		.then((result) => {
			console.log(result.message);

			if (!result.isValid && showDiff && result.details) {
				validator.showDifferences(result.details);
			}

			// 设置退出码
			process.exit(result.isValid ? 0 : 1);
		})
		.catch((error) => {
			console.error("❌ 验证失败:", error);
			process.exit(1);
		});
}

export { SchemaValidator };
