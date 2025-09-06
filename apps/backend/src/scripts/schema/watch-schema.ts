import { watch } from "node:fs";
import { join } from "node:path";
import { SchemaGenerator } from "./generate-schema";
import { getConfig } from "./schema-generator.config";

/**
 * Schema 文件监听器
 * 监听 schema 目录下的文件变化，自动重新生成 dbSchema
 */
class SchemaWatcher {
	private generator: SchemaGenerator;
	private config: ReturnType<typeof getConfig>;
	private isGenerating = false;
	private debounceTimer: NodeJS.Timeout | null = null;
	private readonly debounceDelay = 1000; // 1秒防抖

	constructor(env: "dev" | "prod" | "default" = "default") {
		this.config = getConfig(env);
		this.generator = new SchemaGenerator(this.config);
	}

	/**
	 * 防抖生成函数
	 */
	private debounceGenerate(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(async () => {
			if (this.isGenerating) {
				console.log("⏳ 生成中，跳过此次变化...");
				return;
			}

			try {
				this.isGenerating = true;
				console.log("\n🔄 检测到文件变化，重新生成 schema...");
				await this.generator.generate();
				console.log("✅ Schema 重新生成完成\n");
			} catch (error) {
				console.error("❌ Schema 生成失败:", error);
			} finally {
				this.isGenerating = false;
			}
		}, this.debounceDelay);
	}

	/**
	 * 检查文件是否应该触发重新生成
	 */
	private shouldTriggerRegeneration(filename: string): boolean {
		// 忽略生成的文件
		if (filename.includes("generated-schema.ts")) {
			return false;
		}

		// 只监听 .ts 文件
		if (!filename.endsWith(".ts")) {
			return false;
		}

		// 忽略测试文件
		if (filename.includes(".test.") || filename.includes(".spec.")) {
			return false;
		}

		return true;
	}

	/**
	 * 开始监听
	 */
	public start(): void {
		const schemaDir = join(process.cwd(), this.config.schemaDir);

		console.log("👀 开始监听 Schema 文件变化...");
		console.log(`📁 监听目录: ${schemaDir}`);
		console.log(`⚙️  环境配置: ${this.config}`);
		console.log("按 Ctrl+C 停止监听\n");

		// 初始生成
		this.debounceGenerate();

		// 监听目录变化
		watch(schemaDir, { recursive: true }, (eventType, filename) => {
			if (!filename || !this.shouldTriggerRegeneration(filename)) {
				return;
			}

			console.log(`📝 文件 ${eventType}: ${filename}`);
			this.debounceGenerate();
		});

		// 优雅退出处理
		process.on("SIGINT", () => {
			console.log("\n👋 停止监听，再见!");
			if (this.debounceTimer) {
				clearTimeout(this.debounceTimer);
			}
			process.exit(0);
		});
	}

	/**
	 * 停止监听
	 */
	public stop(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		console.log("🛑 Schema 监听器已停止");
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

	const watcher = new SchemaWatcher(env);
	watcher.start();
}

export { SchemaWatcher };
