# 笔记《elysia代码规范文档  V1.0》


## 概要

该文档是一份针对Elysia.js全栈项目的严格技术规范，涵盖项目结构、代码风格、类型安全、数据库设计等全方位要求，强调规范强制性和类型复用性。
审查需依据此规范逐项检查代码合规性，输出问题详情与修正建议，并以标准化格式呈现审查结果。

#### 📋 文档元信息

文档状态: 正式版
适用项目: 所有Elysia.js全栈端项目

规范等级: ⚠️ 强制遵守

## 1. 🎯 文档使用说明

### 1.1 【智能体角色设定】

你是一位资深全栈工程师和严格的代码审查官。你的唯一标准是严格遵守本规范中的所有条款。

### 1.2 【审查输出格式】

```TypeScript
### 审查结果
- **合规评分**: [x]/5
- **严重问题**: [列举1-3个最关键问题]

### 详细问题清单
| 行号 | 问题类型 | 规范条款 | 问题描述 | 修改建议 |
|------|----------|----------|----------|----------|

### 修正后的代码
```[语言]
// 符合规范的代码
```

### 1.3 【优先级规则】

- 规范 > 行业通用规范 > 模型内置知识
- 遇到规范未涵盖的情况，必须主动询问

## 2. 📁 文档结构规范

### 2.1 项目结构

```TypeScript
```

### 2.2 文件命名规则

- ✅ kebab-case.ts 用于工具函数文件
- ✅ PascalCase.ts 用于类和类型定义文件
- ✅ camelCase.ts 用于业务逻辑文件
- ✅ database.types.ts 固定名称 //在 db/database.types.ts 文件中，必须默认导出一个名为 DbType 的对象

## 3. 🛠 技术栈规范

```TypeScript
✅ 正确 - 使用decorate注入依赖[1](@context-ref?id=13)
.decorate('note', new Note())

// ❌ 错误 - 直接在handler中创建实例[1](@context-ref?id=14)
app.get('/data', () => {
const db = new Database() // 违反3.1-B
})

```
### 3.1 Elysia.js规范

```ts
// ✅ 正确 - 使用decorate注入依赖
.decorate('note', new Note())

// ❌ 错误 - 直接在handler中创建实例
app.get('/data', () => {
  const db = new Database() // 违反3.1-B
})
```

### 3.2 类型规范

```ts
// ✅ 正确 - 使用typebox定义DTO 看第7点

// ❌ 错误 - 使用any类型
app.post('/users', ({ body }: { body: any }) => {
  // 违反3.2-A
})
```

### 3.3 Eden规范

```ts
// 因为eden 返回类型是后端的类型，可能受数据库影响，这个不用提严格
// ✅ 正确 - 使用typebox定义DTO 看第7点 不管这个eden的返回类型，只要能看一眼路由返回结果和前端接收对的上去就行哈

// ❌ 错误 -
// 将 @backend/index 改为相对路径 ../../../backend/src/index
```

### 3.4 项目规范

- monorepo仓库统一使用turbo 管理
- 统一使用biome格式化但是不能处理vue文件，类型检查使用tsx
- vue不要代码格式化工具，vscode自带
- 数据库统一使用compose文件启动
- 不需要bat文件
- 清除使用rimraf 这个工具
- 在本地开发中，drizzle永远只使用push,一个人开发

```ts
// ✅ 正确 - turbo.json 使用tasks
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "i": {
      "cache": false
    },
    "build": {
      "outputs": [
        "dist/**"
      ]
    },
    "clean": {},
    "check": {
      "dependsOn": [
        "^check"
      ]
    },
    "dev": {
      "persistent": true,
      "cache": false
    }
  }
}

// package.json
"scripts": {
  "i": "bun install", //安装依赖
  "dev": "turbo run dev",
  "clean": "rimraf dist node_modules package-lock.json"
  "check": "bun --bun tsc --noEmit" //前端
  "check": "biome check .",
  "db:push": "drizzle-kit push --config=container/dev/drizzle-dev.config.ts",
}

// ❌ 错误 - 使用migrate
"scripts": {
  "db:migrate": "drizzle-kit migrate --config=container/dev/drizzle-dev.config.ts",
}
```

## 4. 📝 代码风格规范

### 4.1 命名约定

类型规范示例:

```ts
// 变量 camelCase
userName

// 常量 UPPER_SNAKE_CASE
MAX_RETRIES

// 函数 camelCase
getUserData()

// 类 PascalCase
UserService

// 接口 PascalCase IUserRequest
// 统一接口命名风格。
// 建议遵循TypeScript社区惯例，移除前缀I，统一使用PascalCase（如UserRequest）。
```

### 4.2 函数规范

```ts
// ✅ 正确 - 箭头函数，明确返回值类型
const fetchUser = async (userId: string): Promise<User> => {

}

// ❌ 错误 - function关键字，无返回值类型
function getUser(id) {

}
```

## 5. 🚨 安全规范

### 5.1 输入验证

```ts
// ✅ 必须使用Schema验证
app.post('/users',
  ({ body }) => createUser(body),
  {
    body: 'xx' //参照第7点
  }
)
```

## 6. 🔍 审查范例

### 6.1 错误规范

#### 6.1.1 好代码示例

```ts
// backend/src/utils/error/err.global.ts
export const err_handler = new Elysia()
  .error({
    ...CustomError
  })
  .onError(({ error, code, set, status, path }) => {
    // 业务错误
    if (error instanceof CustomError.CustomeError) {
      error.toResponse()
    }

    // 开发追踪错误
    console.groupCollapsed(`🔴 ${path} 路由错误`);
    console.log("code  ===============\n", code)
    console.log("error ===============\n")
    console.trace(error); // 显示调用栈
    console.groupEnd();
  })
  .as("global");

// backend/src/utils/error/customError.ts
// 自定义错误
export class CustomeError extends Error {
  status = 10010
  constructor(public message: string) {
    super(message)
  }

  toResponse() {
    return Response.json({
      message: this.message,
      data: null,
      code: this.status
    })
  }
}

// 处理数据库错误 - 转换为自定义错误类
export function handleDatabaseError(error: any): CustomeError {
  // PostgreSQL错误代码
  const errorCode = error?.code;
  const errorMessage = error?.message;

  switch (errorCode) {
    case '23505': // 唯一约束冲突
      return new DuplicateError('数据已存在，请勿重复提交');

    case '23503': // 外键约束冲突
      return new ValidationError('外键约束冲突，请检查关联数据');

    case '23502': // 非空约束冲突
      return new ValidationError('必填字段不能为空');

    case '23514': // 检查约束冲突
      return new ValidationError('数据格式不正确');

    case '08006': // 连接失败
      return new DatabaseError('数据库连接失败');

    case '28P01': // 认证失败
      return new DatabaseError('数据库认证失败');

    case '40P01': // 死锁
      return new DatabaseError('数据库死锁，请重试');

    case '57014': // 超时
      return new DatabaseError('数据库操作超时');

    default:
      return new DatabaseError(errorMessage || '数据库操作失败');
  }
}

// 注释
export class DatabaseError extends CustomeError {   //定义业务码
  status = 20001
  constructor(message: string = "数据库操作失败") {
    super(message)
  }
}
// 在这里继续添加错误 ...

// backend/src/modules/xxx/service.ts
try {
  xxx业务代码
} catch (error) {
  if (error instanceof CustomeError) {
    throw error;
  }
  throw handleDatabaseError(error);
}
```

#### 6.1.2 params 类型 代码示例

```ts
// 错误示范
.put('/files/:id', async ({ params, body, knowledgeService }) => {
  try {
    const file = await knowledgeService.updateFile(params.id, body);  //错误 没有使用解构
    return { success: true, data: file };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}, {
  params: t.Object({ id: t.Union([t.Number(), t.String()]) }),  //！错误 id 使用联合并且没有复用
  body: 'updateFile'
})

// 正确示范
.put('/files/:id', async ({ params: { id }, body, [xxx]Service }) => {
  try {
    const file = await [xxx]Service.updateFile(id, body);
    return { success: true, data: file };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}, {
  params: 'id',
  body: 'updateFile'
})

// [xxx].model.ts
export const [xxx]Model = {
  documents: DbType.typebox.select.files,
  folder: t.Pick(DbType.typebox.select.folders, ['id', 'parentId']),
  id: t.Object({ id: t.Number() }),   //这里定义
  updateFolder: t.Omit(DbType.typebox.insert.folders, ['id', 'updatedAt', 'createdAt']),
}
```

### 6.2 坏代码示例

```ts
// ❌ 违反多条规范
app.get('/data', async ({ query }) => {
  var result = db.query('SELECT * FROM users') // 违反4.1-A, 4.2-B
  return result // 违反5.2-A (无错误处理)
})
```

### 6.3 好代码示例

```ts
// ✅ 符合规范
app.get(
  '/users',
  async ({ query, db }) => {
    try {
      const users = await db.user.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit
      })
      return users
    } catch (error) {
      throw new Error('Failed to fetch users')
    }
  },
  {
    query: t.Object({
      page: t.Number({ default: 1 }),
      limit: t.Number({ default: 20 })
    })
  }
)
```

## 7. 📦 类型复用规范

（文档中未提供具体内容）

## 8. 🗄️ Drizzle ORM 数据库规范

### 8.1 查询规范

```ts
// 使用getTableColumns 替代select（{xx:xx}）
// getTableColumns 方法，可以获取表的所有列的类型映射，非常适合在 select 时省略某些字段时使用。例如：
import { getTableColumns } from "drizzle-orm";
import { user } from "./schema";

const { password, role, ...rest } = getTableColumns(user)  //正确
await db.select({ ...rest }).from(users);
```

### 8.2 数据库schema文件格式规范

```ts
// 每一个实体table后面就是关系
// 实体table命名无需加s，但是需要schema
// 需要统一导出schema
// 使用InferSelectModel 、getTableColumns 等类型推断工具。
//schema 尽量加上默认值 
import { InferSelectModel, relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { MergeSchema } from 'elysia';

// 文件表
export const fileSchema = sqliteTable('files', {
  id: integer('id').primaryKey(),
  /* 文件名，对应 ChromaDB 集合名 */
  name: text('name').notNull().unique(),
  /* 文件标题 */
  title: text('title').notNull().default('未命名标题'),
  content: text('content').notNull().default(''),
  /* 父文件ID，用于构建层级关系*/
  parentId: integer('parent_id'),
  /** ChromaDB 集合名 */
  collectionName: text('collection_name').notNull(),
  embeddingModel: text('embedding_model').notNull().default('default'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 定义关系
export const filesRelations = relations(fileSchema, ({ one, many }) => ({
  parent: one(fileSchema, {
    fields: [fileSchema.parentId],
    references: [fileSchema.id],
  }),
  children: many(fileSchema, { relationName: 'children' }),
  tags: many(fileTagSchema),
}));

// 标签表
export const tagSchema = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tagsRelations = relations(tagSchema, ({ many }) => ({
  tagtoschema: many(fileTagSchema),
}))

// 文件标签关联表  多对多关系
export const fileTagSchema = sqliteTable('file_tags', {
  fileId: integer('file_id').notNull().references(() => fileSchema.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tagSchema.id, { onDelete: 'cascade' }),
});

export const fileTagsRelations = relations(fileTagSchema, ({ one }) => ({
  file: one(fileSchema, {
    fields: [fileTagSchema.fileId],
    references: [fileSchema.id],
  }),
  tag: one(tagSchema, {
    fields: [fileTagSchema.tagId],
    references: [tagSchema.id],
  }),
}));

import type { Simplify, Merge, Except, SetOptional, SetRequired } from 'type-fest';

// 定义带 tags 的文件类型
export type FileWithTags = Merge<InferSelectModel<typeof fileSchema>, { tags: InferSelectModel<typeof fileTagSchema>[] }>

export type FileWithTagsDto = Merge<InferSelectModel<typeof fileSchema>, { tags: InferSelectModel<typeof tagSchema>[] }>
// 导出类型
export type MyFile = typeof fileSchema.$inferSelect
export type MyTag = typeof tagSchema.$inferSelect;
export type MyFileTag = typeof fileTagSchema.$inferSelect;

// 导出schema
export const schema = {
  fileSchema,
  tagSchema,
  fileTagSchema,
} as const;

export type schema = typeof schema;
```

## 9. 📊 合规检查表

### 9.1 代码审查清单

- 命名符合规范（4.1）
- 必须学习第7点，使用类型复用（7）
- 使用Schema验证输入（5.1）
- 有正确的错误处理（5.2）
- 类型定义完整（3.2）
- 无安全漏洞（第5章）

### 9.2 自动检查命令

- 类型检查: `npm run check`
```