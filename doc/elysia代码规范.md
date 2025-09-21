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
src/
├── modules/
│   └── [entity]/
│       ├── [entity].controller.ts  // Controller层
│       ├── [entity].service.ts     // Service层
│       └── [entity].model.ts       // 类型定义
├── db/
│   ├── schema.ts
│   └── database.typebox.ts
└── utils/
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

### 3.2 RESTful接口设计规范

#### 3.2.1 URL路径规范

```ts
// ✅ 正确 - RESTful设计
app.get('/products', handler)           // 获取商品列表
app.get('/products/:id', handler)       // 获取单个商品
app.post('/products', handler)          // 创建商品
app.patch('/products/:id', handler)     // 更新商品
app.delete('/products/:id', handler)    // 删除商品
app.post('/products/batch', handler)    // 批量操作

// ❌ 错误 - 非RESTful设计
app.get('/products/list', handler)      // 应使用 GET /products
app.get('/products/create', handler)    // 应使用 POST /products
app.get('/getProduct/:id', handler)     // 应使用 GET /products/:id
```

#### 3.2.2 方法命名规范

```ts
// ✅ 正确 - 语义化方法命名
const ProductService = {
  createProduct,     // 创建
  listProducts,      // 分页查询
  getProduct,        // 获取单个
  updateProduct,     // 更新
  deleteProduct,     // 删除
  batchCreateProducts, // 批量创建
}

// ❌ 错误 - 不规范的方法命名
const ProductService = {
  addProduct,        // 应使用 createProduct
  fetchProducts,     // 应使用 listProducts
  modifyProduct,     // 应使用 updateProduct
}
```

### 3.3 类型系统规范

#### 3.3.1 Drizzle + Zod 架构

```ts
// ✅ 正确 - 使用Drizzle表定义 + Zod校验
// 1. Drizzle表定义
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  // ...
});

// 2. Zod Schema（运行时校验）
export const insertProductSchema = createInsertSchema(productsTable);
export const selectProductSchema = createSelectSchema(productsTable);

// 3. 业务模型（供Elysia使用）
export const productsModel = {
  insertProductDto: insertProductSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
  }),
  selectProductTable: selectProductSchema,
};

// 4. TypeScript类型定义
export type InsertProductDto = z.infer<typeof productsModel.insertProductDto>;
export type SelectProductVo = z.infer<typeof productsModel.selectProductTable>;

// ❌ 错误 - 使用any类型或重复定义
app.post('/users', ({ body }: { body: any }) => {
  // 违反类型安全原则
})
```

#### 3.3.2 Eden Treaty 前后端类型同步

```ts
// ✅ 正确 - Eden Treaty类型安全调用
// 前端使用
import { treaty } from '@elysiajs/eden';

import type { App } from '@backend/index'; // 应使用绝对路径路径
const client = treaty<App>('http://localhost:3000');

// 类型安全的API调用
const { data, error } = await client.api.products.get({
  query: { page: 1, limit: 10 }
});



// ❌ 错误 - 不使用类型约束
const response = await fetch('/api/products'); // 缺少类型安全
```

### 3.4 项目架构规范

#### 3.4.1 Monorepo管理

- 使用Turbo管理monorepo项目
- 统一使用Biome格式化（Vue文件除外，使用VSCode自带）
- 数据库使用Docker Compose启动
- 本地开发Drizzle只使用push模式

```ts
// ✅ 正确 - turbo.json配置使用tasks字段
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
  
    "build": { "outputs": ["dist/**"] },
    "clean": {},
    "check": { "dependsOn": ["^check"] },
    "dev": { "persistent": true, "cache": false }
  }
}

// ✅ 正确 - package.json脚本
"scripts": {
  
  "dev": "turbo run dev",
  "clean": "rimraf dist node_modules package-lock.json",
  "check": "bun --bun tsc --noEmit", // 前端类型检查
  "check": "biome check .",           // 后端代码检查
  "db:push": "drizzle-kit push --config=container/dev/drizzle-dev.config.ts"
}

// ❌ 错误 - 本地开发使用migrate
"scripts": {
  "db:migrate": "drizzle-kit migrate --config=container/dev/drizzle-dev.config.ts"
}
```

#### 3.4.2 文件结构规范

```
src/
├── model/              # 数据库Schema定义
│   ├── products.model.ts      # 商品表模块
│   ├── users.model.ts         # 用户表模块
│   ├── utils.model.ts         # 公共工具
│   └── index.ts         # 统一导出
├── modules/             # 业务模块
│   └── [entity]/
│       ├── [entity].controller.ts
│       └── [entity].service.ts
├── utils/
└── db/
```

## 4. 📝 代码风格规范

### 4.1 命名约定规范

#### 4.1.1 基础命名规则

```ts
// 变量 - camelCase
const userName = 'john';
const productList = [];

// 常量 - UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// 函数 - camelCase
const getUserData = () => {};
const createProduct = () => {};

// 类 - PascalCase
class UserService {}
class ProductController {}

// Controller导出 - PascalCase
export const UserController = new Elysia({ prefix: '/users' });
```

#### 4.1.2 数据库和类型命名规范

```ts
// ✅ 正确 - Drizzle表定义
export const usersTable = pgTable('users', { ... });     // xxxTable后缀
export const productsTable = pgTable('products', { ... }); // xxxTable后缀

// ✅ 正确 - Zod Schema命名
export const insertUserSchema = createInsertSchema(usersTable);  // xxxSchema后缀
export const selectUserSchema = createSelectSchema(usersTable);   // xxxSchema后缀

// ✅ 正确 - 业务模型命名
export const usersModel = {                              // xxxModel（驼峰）
  insertUserDto: insertUserSchema.omit({ ... }),
  selectUserTable: selectUserSchema,
};

// ✅ 正确 - TypeScript类型命名
export type InsertUserDto = z.infer<typeof usersModel.insertUserDto>;  // Dto后缀，大驼峰
export type SelectUserVo = z.infer<typeof usersModel.selectUserTable>;  // Vo后缀，大驼峰
export type UserWithPostsVo = { ... };                               // 复合类型，大驼峰

// ❌ 错误 - 不规范的命名
export const userSchema = pgTable('users', { ... });     // 应使用 usersTable
export const UserSchema = createInsertSchema(...);       // 应使用 insertUserSchema
export type userDto = { ... };                           // 应使用 InsertUserDto（大驼峰）
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

### 4.3 错误处理规范

```typescript
// ❌ 错误示例 - Service层返回null
async getUserById(id: number): Promise<UserEntity | null> {
  const user = await db.select().from(usersSchema).where(eq(usersSchema.id, id)).get();
  return user || null;
}

// ✅ 正确示例 - Service层抛出错误
async getUserById(id: number): Promise<UserEntity> {
  const user = await db.select().from(usersSchema).where(eq(usersSchema.id, id)).get();
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}
```

### 4.4 API 响应格式

#### 统一响应格式（使用 commonRes）

```typescript
// 成功响应 - 单个数据
return commonRes(user);
// 输出: { success: true, data: user }

// 成功响应 - 分页数据
return commonRes({
  data: users,
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
});

// 错误响应（自动处理）
throw new NotFoundError('User not found');
// 输出: { success: false, error: { message: 'User not found' } }
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
    if (error instanceof CustomError.CustomError) {
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
export class CustomError extends Error {
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
export function handleDatabaseError(error: any): CustomError {
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
export class DatabaseError extends CustomError {   //定义业务码
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
  if (error instanceof CustomError) {
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

## 7. 📦 Drizzle + Zod 类型系统规范

### 7.1 四层架构标准

#### 7.1.1 完整模块示例

```typescript
// src/schema/users.ts
import { relations } from "drizzle-orm";
import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from "zod";
import { BaseQueryZod } from "./utils";

// 1. Drizzle 表定义层
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Zod Schema 层（运行时校验）
export const insertUserSchema = createInsertSchema(usersTable);
export const updateUserSchema = createUpdateSchema(usersTable);
export const selectUserSchema = createSelectSchema(usersTable);

// 3. 业务模型层（供Elysia使用）
export const usersModel = {
  insertUserDto: insertUserSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
  }),
  updateUserDto: updateUserSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
  }),
  selectUserTable: selectUserSchema,
  queryUserDto: BaseQueryZod.extend({
    isActive: z.boolean().optional(),
    email: z.string().optional(),
  })
};

// 4. TypeScript 类型定义层
export type InsertUserDto = z.infer<typeof usersModel.insertUserDto>;
export type UpdateUserDto = z.infer<typeof usersModel.updateUserDto>;
export type SelectUserVo = z.infer<typeof usersModel.selectUserTable>;
export type QueryUserDto = z.infer<typeof usersModel.queryUserDto>;

// 5. 关联关系层
export const usersRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
}));
```

### 7.2 命名规范总结

| 用途 | 命名风格 | 示例 | 后缀 | 说明 |
|------|----------|------|------|------|
| **Drizzle表定义** | 驼峰 | `usersTable` | `Table` | 数据库表定义 |
| **Zod Schema** | 驼峰 | `insertUserSchema` | `Schema` | 运行时校验 |
| **业务模型** | 驼峰 | `usersModel` | `Model` | 供Elysia使用 |
| **请求类型** | 大驼峰 | `InsertUserDto` | `Dto` | 前端提交数据 |
| **返回类型** | 大驼峰 | `SelectUserVo` | `Vo` | 前端展示数据 |
| **复合类型** | 大驼峰 | `UserWithPostsVo` | `Vo` | 多表联查结果 |

### 7.3 类型复用最佳实践

```typescript
// ✅ 正确 - 基于Drizzle Schema复用
export const productsModel = {
  insertProductDto: insertProductSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
  }).extend({
    // 自定义扩展字段
    imageIds: z.array(z.number()),
  }),
  selectProductTable: selectProductSchema,
};

// ❌ 错误 - 重复定义类型
export const productsModel = {
  insertProductDto: z.object({
    name: z.string(),
    price: z.number(),
    // 违反类型复用原则，应基于Drizzle Schema
  })
};
```

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

## 10. ✅ 合规检查表

### 代码提交前检查清单：

#### 基础规范
- [ ] 所有函数都有适当的类型注解
- [ ] 代码通过 ESLint 和 Prettier 检查
- [ ] 敏感信息不在代码中硬编码
- [ ] 所有 TODO 注释都有对应的任务跟踪

#### API 响应格式
- [ ] 使用 `commonRes()` 统一响应格式
- [ ] 分页接口返回标准分页格式
- [ ] 错误处理使用统一的错误类（NotFoundError等）

#### Service 层规范
- [ ] Service 方法不返回 null，改为抛出错误
- [ ] Service 层无需进行数据验证（由 Controller 层处理）
- [ ] 查询不到数据时抛出 NotFoundError

#### Controller 层规范
- [ ] Controller 导出使用 `[Entity]Controller` 命名
- [ ] 使用 Model 中定义的类型进行验证
- [ ] 所有响应使用 `commonRes()` 包装

#### 数据库和类型规范
- [ ] 使用 `database.types.ts` 统一类型转换
- [ ] Model 类型使用 `DbType.typebox` 复用数据库类型
- [ ] 数据库查询使用 Drizzle ORM
- [ ] Schema 文件正确导出类型
```