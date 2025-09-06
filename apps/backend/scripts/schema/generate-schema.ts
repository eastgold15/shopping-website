import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { Project, type SourceFile, VariableDeclaration } from "ts-morph";
import {
	getConfig,
	type SchemaGeneratorConfig,
} from "./schema-generator.config";

/**
 * 自动扫描项目中的 pgTable 定义并生成 dbSchema 文件
 * 使用 ts-morph 进行 AST 分析
 */
class SchemaGenerator {
	private project: Project;
	private config: SchemaGeneratorConfig;

	constructor(config?: Partial<SchemaGeneratorConfig>) {
		this.config = { ...getConfig(), ...config };
		this.project = new Project({
			tsConfigFilePath: "tsconfig.json",
		});
	}

	/**
	 * 扫描指定目录下的所有 TypeScript 文件
	 */
	private scanSchemaFiles(): SourceFile[] {
		const pattern = `${this.config.schemaDir}/**/*.ts`;
		const sourceFiles = this.project.getSourceFiles(pattern);
		// 过滤排除的文件
		return sourceFiles.filter((file) => {
			const filePath = file.getFilePath();
			return !this.config.excludePatterns.some((pattern) => {
				const regex = new RegExp(pattern.replace(/\*/g, ".*"));
				return regex.test(filePath);
			});
		});
	}

	/**
	 * 从源文件中提取 pgTable 定义的变量
	 */
	private extractPgTableVariables(sourceFile: SourceFile): Array<{
		name: string;
		filePath: string;
		relativePath: string;
	}> {
		const tables: Array<{
			name: string;
			filePath: string;
			relativePath: string;
		}> = [];

		// 查找所有变量声明
		const variableDeclarations = sourceFile.getVariableDeclarations();

		for (const declaration of variableDeclarations) {
			const initializer = declaration.getInitializer();

			if (initializer) {
				const initializerText = initializer.getText();

				// 检查是否是 pgTable 调用
				if (initializerText.includes("pgTable(")) {
					const variableName = declaration.getName();

					// 检查表名是否符合包含/排除模式
					if (this.shouldIncludeTable(variableName)) {
						const filePath = sourceFile.getFilePath();
						const relativePath = this.getRelativeImportPath(filePath);
						tables.push({
							name: variableName,
							filePath,
							relativePath,
						});
						console.log(`发现表定义: ${variableName} 在 ${filePath}`);
					} else {
						console.log(`跳过表定义: ${variableName} (不符合过滤条件)`);
					}
				}
			}
		}
		return tables;
	}

	/**
	 * 检查表名是否应该包含
	 */
	private shouldIncludeTable(tableName: string): boolean {
		// 检查排除模式
		for (const pattern of this.config.excludeTablePatterns) {
			if (new RegExp(pattern).test(tableName)) {
				return false;
			}
		}
		// 检查包含模式
		for (const pattern of this.config.includeTablePatterns) {
			if (new RegExp(pattern).test(tableName)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * 获取相对导入路径
	 */
	private getRelativeImportPath(filePath: string): string {
		// 检查是否有自定义映射
		const normalizedPath = filePath.replace(/\\/g, "/");
		for (const [sourcePath, targetPath] of Object.entries(
			this.config.importPathMapping || {},
		)) {
			if (normalizedPath.includes(sourcePath)) {
				return targetPath;
			}
		}
		const outputDir = dirname(this.config.outputFile);
		let relativePath = relative(outputDir, filePath)
			.replace(/\\/g, "/")
			.replace(/\.ts$/, "");
		// 确保相对路径以 ./ 开头
		if (!relativePath.startsWith(".")) {
			relativePath = `./${relativePath}`;
		}
		return relativePath;
	}

	/**
	 * 生成 dbSchema 文件内容
	 */
	private generateSchemaContent(
		tables: Array<{
			name: string;
			filePath: string;
			relativePath: string;
		}>,
	): string {
		// 按文件分组导入
		const importsByFile = new Map<string, string[]>();
		for (const table of tables) {
			const imports = importsByFile.get(table.relativePath) || [];
			imports.push(table.name);
			importsByFile.set(table.relativePath, imports);
		}

		// 生成导入语句
		const imports = Array.from(importsByFile.entries())
			.map(([path, tableNames]) => {
				return `import { ${tableNames.join(", ")} } from '${path}.ts';`;
			})
			.join("\n");

		// 生成 dbSchema 对象
		const tableNames = tables.map((t) => t.name);
		const schemaObject = `export const dbSchema = {\n${tableNames.map((name) => `  ${name},`).join("\n")}\n};`;

		// 动态生成所有扫描到的文件的导出语句
		const uniqueFiles = Array.from(new Set(tables.map(t => t.relativePath)));
		const dynamicExports = uniqueFiles.length > 0 
			? `\n// 导出所有扫描到的数据库模式文件\n${uniqueFiles.map(path => `export * from "${path}.ts";`).join('\n')}`
			: '';

		let content = `/**
 * 自动生成的数据库 Schema 文件
 * 请勿手动修改此文件，运行 \`bun run generate:schema\` 重新生成
 * 生成时间: ${new Date().toISOString()}
 */

${imports}

${schemaObject}${dynamicExports}`;
		// 根据配置添加类型定义
		if (this.config.generateTypes) {
			content += `

/**
 * 数据库 Schema 类型
 */
export type DbSchema = typeof dbSchema;`;
		}
		// 根据配置添加表名列表
		if (this.config.generateTableNames) {
			content += `

/**
 * 所有表的名称列表
 */
export const tableNames = [${tableNames.map((name) => `'${name}'`).join(", ")}] as const;

/**
 * 表名称类型
 */
export type TableName = typeof tableNames[number];`;
		}
		return `${content}\n`;
	}

	/**
	 * 确保输出目录存在
	 */
	private ensureOutputDirectory(): void {
		const outputDir = dirname(this.config.outputFile);
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
		}
	}

	/**
	 * 执行生成过程
	 */
	public async generate(): Promise<void> {
		console.log("开始扫描 pgTable 定义...");

		// 扫描所有 schema 文件
		const sourceFiles = this.scanSchemaFiles();
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

			const tables = this.extractPgTableVariables(sourceFile);
			allTables.push(...tables);
		}

		console.log(`总共找到 ${allTables.length} 个表定义`);

		if (allTables.length === 0) {
			console.warn("未找到任何 pgTable 定义");
			return;
		}

		// 生成文件内容
		const content = this.generateSchemaContent(allTables);

		// 确保输出目录存在
		this.ensureOutputDirectory();

		// 写入文件
		writeFileSync(this.config.outputFile, content, "utf-8");

		console.log(`✅ 成功生成 dbSchema 文件: ${this.config.outputFile}`);
		console.log(`包含以下表: ${allTables.map((t) => t.name).join(", ")}`);

		// 输出配置信息
		console.log("\n📋 生成配置:");
		console.log(`  - Schema 目录: ${this.config.schemaDir}`);
		console.log(`  - 输出文件: ${this.config.outputFile}`);
		console.log(`  - 生成类型: ${this.config.generateTypes ? "是" : "否"}`);
		console.log(
			`  - 生成表名: ${this.config.generateTableNames ? "是" : "否"}`,
		);
	}
}

// 命令行执行
if (require.main === module) {
	const generator = new SchemaGenerator();
	generator.generate().catch(console.error);
}

export { SchemaGenerator };
