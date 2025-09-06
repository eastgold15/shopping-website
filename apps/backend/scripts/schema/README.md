# Schema Generator 自动化工具

这是一个使用 TypeScript + ts-morph 的自动化工具，用于扫描项目中的 `pgTable` 定义并自动生成 `dbSchema` 文件。

## 功能特性

- 🔍 **自动扫描**: 扫描指定目录下的所有 TypeScript 文件
- 🎯 **智能识别**: 识别通过 `pgTable()` 创建的表对象
- 📝 **自动生成**: 生成包含所有表定义的 `dbSchema.ts` 文件
- ⚙️ **高度可配置**: 支持自定义配置文件和命令行参数
- 🚀 **构建时集成**: 可集成到构建流程中
- 📋 **类型安全**: 自动生成 TypeScript 类型定义

## 文件结构

```
scripts/
├── generate-schema.ts          # 核心生成器类
├── schema-generator.config.ts  # 配置文件
├── cli.ts                      # 命令行工具
└── README.md                   # 说明文档
```

## 快速开始

### 1. 基本使用

```bash
# 使用默认配置生成 schema
bun run generate:schema

# 使用开发环境配置
bun run generate:schema:dev

# 使用生产环境配置
bun run generate:schema:prod
```

### 2. 命令行选项

```bash
# 显示帮助信息
bun run generate:schema --help

# 自定义 schema 目录和输出文件
bun run generate:schema --schema-dir src/db/tables --output src/db/generated.ts

# 不生成类型定义
bun run generate:schema --no-types

# 不生成表名列表
bun run generate:schema --no-table-names
```

## 配置说明

### 默认配置

```typescript
export const defaultConfig: SchemaGeneratorConfig = {
  schemaDir: 'src/db/schema',                    // schema 文件目录
  outputFile: 'src/db/schema/generated-schema.ts', // 输出文件路径
  excludePatterns: [                             // 排除的文件模式
    '**/generated-*.ts',
    '**/index.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  includeTablePatterns: ['.*'],                  // 包含的表名模式
  excludeTablePatterns: [                        // 排除的表名模式
    '.*Relations$',  // 排除关系定义
    '.*Schema$'      // 排除 schema 对象
  ],
  generateTypes: true,                           // 生成类型定义
  generateTableNames: true,                      // 生成表名列表
};
```

### 自定义配置

你可以修改 `schema-generator.config.ts` 文件来自定义配置：

```typescript
// 自定义开发环境配置
export const devConfig: SchemaGeneratorConfig = {
  ...defaultConfig,
  outputFile: 'src/db/schema/dev-schema.ts',
  generateTypes: true,
  generateTableNames: true,
};
```

## 生成的文件示例

运行生成器后，会创建类似以下内容的文件：

```typescript
/**
 * 自动生成的数据库 Schema 文件
 * 请勿手动修改此文件，运行 `bun run generate:schema` 重新生成
 * 生成时间: 2024-01-01T00:00:00.000Z
 */

import { users, tokens } from './auth';
import { shopTiers, shopPools, shopInfo } from './shop';
import { enemyer, item, stage, wave } from './schema';

export const dbSchema = {
  users,
  tokens,
  shopTiers,
  shopPools,
  shopInfo,
  enemyer,
  item,
  stage,
  wave,
};

/**
 * 数据库 Schema 类型
 */
export type DbSchema = typeof dbSchema;

/**
 * 所有表的名称列表
 */
export const tableNames = ['users', 'tokens', 'shopTiers', 'shopPools', 'shopInfo', 'enemyer', 'item', 'stage', 'wave'] as const;

/**
 * 表名称类型
 */
export type TableName = typeof tableNames[number];
```

## 集成到构建流程

### 1. 在构建前自动生成

在 `package.json` 中添加 pre-build 脚本：

```json
{
  "scripts": {
    "prebuild": "bun run generate:schema",
    "build": "sh ./script/index.sh"
  }
}
```

### 2. 在开发时监听文件变化

可以使用文件监听工具在 schema 文件变化时自动重新生成：

```bash
# 使用 nodemon 监听文件变化
npx nodemon --watch "src/db/schema/**/*.ts" --exec "bun run generate:schema"
```

### 3. Git Hooks 集成

在 `.husky/pre-commit` 中添加：

```bash
#!/bin/sh
bun run generate:schema
git add src/db/schema/generated-schema.ts
```

## 工作原理

1. **AST 分析**: 使用 ts-morph 解析 TypeScript 文件的抽象语法树
2. **模式匹配**: 识别包含 `pgTable()` 调用的变量声明
3. **过滤筛选**: 根据配置的包含/排除模式过滤表名
4. **路径解析**: 计算相对导入路径
5. **代码生成**: 生成包含所有表定义的 TypeScript 文件

## 最佳实践

### 1. 命名约定

- 表定义使用 camelCase: `userProfiles`, `orderItems`
- 关系定义使用 `Relations` 后缀: `userProfilesRelations`
- Schema 对象使用 `Schema` 后缀: `authSchema`

### 2. 文件组织

```
src/db/schema/
├── auth.ts           # 认证相关表
├── shop.ts           # 商店相关表
├── game.ts           # 游戏相关表
├── index.ts          # 手动导出文件
└── generated-schema.ts # 自动生成文件
```

### 3. 版本控制

- 将生成的文件添加到版本控制中
- 在 CI/CD 中验证生成的文件是否为最新版本

## 故障排除

### 常见问题

1. **找不到表定义**
   - 检查 `schemaDir` 配置是否正确
   - 确认表定义使用了 `pgTable()` 函数
   - 检查文件是否被排除模式过滤

2. **导入路径错误**
   - 检查 `importPathMapping` 配置
   - 确认相对路径计算是否正确

3. **类型错误**
   - 确保所有依赖的类型都已正确导入
   - 检查 TypeScript 配置

### 调试模式

在生成器中添加更多日志输出来调试问题：

```typescript
// 在 SchemaGenerator 类中添加调试选项
const generator = new SchemaGenerator({
  ...config,
  debug: true  // 启用调试模式
});
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License