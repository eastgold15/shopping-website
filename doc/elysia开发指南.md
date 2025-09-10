
# elysia 数据库模式定义
### 目录结构

```
src/
├── db/
│   ├── schema/                  # 数据库表结构定义
│   │   ├── index.schema.ts      # 统一导出
│   │   └── [entity].schema.ts
│   │
│   ├── types/                   # 类型转换层
│   │   └── database.typebox.ts  # Drizzle → TypeBox 转换
│   └── connection.ts            # 数据库连接实例
├── modules/
│   ├── [entity]/                # 知识库模块
│   │   ├── [entity].model.ts    # API 模型定义
│   │   ├── [entity].service.ts  # 业务逻辑
│   │   └── [entity].controller.ts   # 路由定义
│   ├── [entity]/                # 模块（轻量）
│   │   ├── [entity].model.ts
│   │   └── [entity].controller.ts
│   └── [entity]/                # 复杂业务模块
│       ├── [entity].model.ts
│       ├── [entity].service.ts
│       └── [entity].controller.ts
```

---

## 二、数据库模式定义 (schema.ts)

### 1. 表结构定义

> 项目可能不是sqlite，根据项目的数据库生成

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// 基础表定义
export const [entity]Schema = sqliteTable('[entity]', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

### 2. 关系定义

```typescript
export const [entity]Relations = relations([entity], ({ many, one }) => ({
  children: many(folders),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
  }),
}));
```

### 3. 类型导出（关键）

```typescript
// 使用 Drizzle 内置类型推断
export type [Entity] = typeof [entity].$inferSelect;    // 查询类型
export type New[Entity] = typeof [entity].$inferInsert; // 插入类型

// 导出完整 schema
export const schema = {
  [entity]Schema
  // ... 其他表
} as const;
```

---

## 三、TypeBox 转换配置 (database.types.ts)

### 自动类型转换

```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox';
import { schema } from './schema';
import { t } from 'elysia';

export const DbType = {
  typebox: {
    insert: {
      [entity]: createInsertSchema(schema.[entity], {
        parentId: t.Number({ default: 0 })  // 覆盖默认值
      }),
      [entity]: createInsertSchema(schema.[entity]),
      // ... 其他表
    },
    select: {
      [entity]: createSelectSchema(schema.[entity]),
      [entity]: createSelectSchema(schema.[entity]),
      // ... 其他表
    }
  }
} as const
```

---

## 四、API 模型定义 (knowledge.model.ts)

### 基础模型复用

```typescript
import { DbType } from "@/db/database.types";
import { Static, t } from "elysia";

export const [entity]Model = {
  // 直接使用数据库查询类型
  [key]: DbType.typebox.select.files,

  // 使用 Pick 选择需要的字段
  [key]: t.Pick(DbType.typebox.select.folders, ['id', 'parentId']),

  // 使用 Omit 排除不需要的字段
  update[key]: t.Omit(DbType.typebox.insert.folders, ['id', 'updatedAt', 'createdAt']),

  // 复合类型组合
  [key]search: t.Composite([
    t.Omit(DbType.typebox.insert.files, ['id', 'updatedAt', 'createdAt']),
    UnoSearchQuery
  ])
}
```

### 自定义查询类型

> 放在src/db/type

```typescript
const UnoSearchQuery = t.Object({
  text: t.String(),
  limit: t.Optional(t.Number()),
  name: t.Optional(t.Array(t.String())),
});
```

---

## 五、路由类型应用 (knowledge.ts)

### 模型注册

```typescript
export const [entity]Routes = new Elysia({ prefix: '/[entity]' })
  .model([entity]Model)  // 注册模型
```

### 类型安全路由

```typescript
.post('/folders', async ({ body, [entity]Service }) => {
  const folder = await knowledgeService.createFolder(body);
  return { success: true, data: folder };
}, {
  body: 'folder'  // 使用模型中定义的类型
})

.put('/folders/:id', async ({ params: { id }, body, [entity]Service }) => {
  const folder = await [entity]Service.updateFolder(id, body);
  return { success: true, data: folder };
}, {
  params: 'id',
  body: 'updateFolder'  // 使用特定的更新类型
})
```

---

## 六、类型转换流程图

```
数据库表定义 → Drizzle Schema → TypeBox 转换 → API 模型 → 路由验证
     ↓              ↓              ↓           ↓          ↓
sqliteTable   $inferSelect  createSelectSchema  t.Pick   body: 'model'
 relations    $inferInsert  createInsertSchema  t.Omit   params: 'type'
```

---

## 七、关键技巧总结

### 1. 类型推断技巧

- 使用 `typeof table.$inferSelect` 获取查询类型
- 使用 `typeof table.$inferInsert` 获取插入类型
- 这些类型会自动包含所有字段定义和约束

### 2. TypeBox 转换技巧

- `createSelectSchema()` 将 Drizzle schema 转换为 TypeBox
- `createInsertSchema()` 创建插入验证 schema
- 可以在转换时覆盖默认值和验证规则

### 3. 模型复用技巧

- `t.Pick()` 选择需要的字段
- `t.Omit()` 排除不需要的字段
- `t.Composite()` 组合多个类型
- `t.Union()` 创建联合类型

### 4. 路由集成技巧

- 使用 `.model()` 注册所有模型
- 通过字符串引用模型中的类型
- 支持内联类型定义覆盖

---

## 八、实际应用示例

### 文件夹管理 API

```typescript
// 创建文件夹
.post('/folders', async ({ body, knowledgeService }) => {
  const folder = await knowledgeService.createFolder(body);
  return { success: true, data: folder };
}, {
  body: 'folder'  // 自动验证 folder 类型
})

// 更新文件夹
.put('/folders/:id', async ({ params: { id }, body, knowledgeService }) => {
  const folder = await knowledgeService.updateFolder(id, body);
  return { success: true, data: folder };
}, {
  params: 'id',
  body: 'updateFolder'  // 使用排除时间字段的类型
})
```

### 搜索 API

```typescript
// 复合搜索类型
.post('/search', async ({ body, knowledgeService }) => {
  const result = await knowledgeService.searchFiles(body);
  return { success: true, data: result };
}, {
  body: 'filetagsearch'  // 组合文件基础类型和搜索参数
})
```