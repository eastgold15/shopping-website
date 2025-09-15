
# Elysia + Drizzle + Zod 全栈开发指南

## 一、项目架构概览

### 1.1 目录结构

```
src/
├── db/
│   ├── model/                  # 数据库表结构定义
│   │   ├── index.ts      # 统一导出
│   │   └── [entity].model.ts
│   │
│   ├── types/                   # 类型转换层
│   │   └── database.typebox.ts  # Drizzle → TypeBox 转换
│   └── connection.ts            # 数据库连接实例
├── modules/
│   ├── [entity]/                # 知识库模块
│   │   ├── [entity].service.ts  # 业务逻辑
│   │   └── [entity].controller.ts   # 路由定义

│   └── [entity]/                # 复杂业务模块
│       ├── [entity].service.ts
│       └── [entity].controller.ts
```

---

## 二、数据库模式定义 (schema.ts)

### 1. 表结构定义

> 项目可能不是sqlite，根据项目的数据库生成

```typescript
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

### 2.2 通用工具 (src/schema/utils.ts)

```typescript
import { z } from "zod";

// 基础查询参数
export const BaseQueryZod = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// 分页响应格式
export const PaginationResponseZod = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    meta: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });
```

## 三、Service 层实现

### 3.1 用户服务 (src/modules/users/users.service.ts)

```typescript
import { db } from "@/db/connection";
import { usersTable, type InsertUserDto, type UpdateUserDto, type QueryUserDto } from "@/schema/users";
import { eq, and, ilike, count } from "drizzle-orm";

export class UsersService {
  // 创建用户
  async createUser(data: InsertUserDto) {
    const [user] = await db.insert(usersTable).values(data).returning();
    return user;
  }

  // 获取用户列表
  async getUsers(query: QueryUserDto) {
    const { page, pageSize, isActive, email } = query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [];
    if (isActive !== undefined) conditions.push(eq(usersTable.isActive, isActive));
    if (email) conditions.push(ilike(usersTable.email, `%${email}%`));

    // 查询数据
    const [users, [{ total }]] = await Promise.all([
      db.select().from(usersTable)
        .where(and(...conditions))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(usersTable)
        .where(and(...conditions))
    ]);

    return {
      items: users,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // 根据ID获取用户
  async getUserById(id: number) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }

  // 更新用户
  async updateUser(id: number, data: UpdateUserDto) {
    const [user] = await db.update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();
    return user;
  }

  // 删除用户
  async deleteUser(id: number) {
    await db.delete(usersTable).where(eq(usersTable.id, id));
    return { success: true };
  }
}
```
```

## 四、Controller 层实现

### 4.1 用户控制器 (src/modules/users/users.controller.ts)

```typescript
import { Elysia, t } from "elysia";
import { UsersService } from "./users.service";
import { usersModel, PaginationResponseZod, selectUserSchema } from "@/schema/users";

const usersService = new UsersService();

export const usersController = new Elysia({ prefix: "/users" })
  // 注册Zod模型
  .model({
    insertUser: usersModel.insertUserDto,
    updateUser: usersModel.updateUserDto,
    queryUser: usersModel.queryUserDto,
    userResponse: selectUserSchema,
    usersListResponse: PaginationResponseZod(selectUserSchema)
  })
  
  // 创建用户
  .post("/", async ({ body }) => {
    const user = await usersService.createUser(body);
    return { success: true, data: user };
  }, {
    body: "insertUser",
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: "userResponse"
      })
    },
    detail: {
      summary: "创建用户",
      tags: ["Users"]
    }
  })
  
  // 获取用户列表
  .get("/", async ({ query }) => {
    const result = await usersService.getUsers(query);
    return { success: true, data: result };
  }, {
    query: "queryUser",
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: "usersListResponse"
      })
    },
    detail: {
      summary: "获取用户列表",
      tags: ["Users"]
    }
  })
  
  // 根据ID获取用户
  .get("/:id", async ({ params: { id } }) => {
    const user = await usersService.getUserById(id);
    if (!user) {
      throw new Error("用户不存在");
    }
    return { success: true, data: user };
  }, {
    params: t.Object({ id: t.Number() }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: "userResponse"
      })
    },
    detail: {
      summary: "根据ID获取用户",
      tags: ["Users"]
    }
  })
  
  // 更新用户
  .put("/:id", async ({ params: { id }, body }) => {
    const user = await usersService.updateUser(id, body);
    return { success: true, data: user };
  }, {
    params: t.Object({ id: t.Number() }),
    body: "updateUser",
    response: {
      200: t.Object({
        success: t.Boolean(),
        data: "userResponse"
      })
    },
    detail: {
      summary: "更新用户",
      tags: ["Users"]
    }
  })
  
  // 删除用户
  .delete("/:id", async ({ params: { id } }) => {
    const result = await usersService.deleteUser(id);
    return result;
  }, {
    params: t.Object({ id: t.Number() }),
    response: {
      200: t.Object({
        success: t.Boolean()
      })
    },
    detail: {
      summary: "删除用户",
      tags: ["Users"]
    }
  });
```

## 五、应用集成

### 5.1 主应用入口 (src/app.ts)

```typescript
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { usersController } from "./modules/users/users.controller";
import { productsController } from "./modules/products/products.controller";

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: "Shopping Website API",
        version: "1.0.0",
        description: "基于 Elysia + Drizzle + Zod 的购物网站API"
      },
      tags: [
        { name: "Users", description: "用户管理" },
        { name: "Products", description: "商品管理" }
      ]
    }
  }))
  .use(usersController)
  .use(productsController)
  .get("/", () => ({ message: "Hello Elysia!" }))
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
```

### 5.2 数据库连接 (src/db/connection.ts)

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/schema";

const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/shopping";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

## 六、开发流程总结

### 6.1 四层架构流程

```
1. Drizzle 表定义层 → 定义数据库表结构
2. Zod Schema 层 → 自动生成运行时校验
3. 业务模型层 → 组合业务所需的Schema
4. TypeScript 类型层 → 导出前端使用的类型
```

### 6.2 开发步骤

1. **定义数据库表** (src/schema/[entity].ts)
   - 使用 Drizzle 定义表结构
   - 定义表关系

2. **生成 Zod Schema**
   - 使用 `createInsertSchema`、`createSelectSchema`
   - 组合业务模型

3. **实现 Service 层**
   - 编写业务逻辑
   - 使用类型安全的数据库操作

4. **实现 Controller 层**
   - 定义路由和验证规则
   - 集成 Swagger 文档

## 七、最佳实践

### 7.1 命名规范

- **表定义**: `usersTable`
- **Schema**: `insertUserSchema`、`selectUserSchema`
- **模型**: `usersModel`
- **类型**: `InsertUserDto`、`SelectUserVo`
- **服务**: `UsersService`
- **控制器**: `usersController`

### 7.2 错误处理

```typescript
// Service 层
export class UsersService {
  async getUserById(id: number) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      throw new Error(`用户 ${id} 不存在`);
    }
    return user;
  }
}

// Controller 层
.get("/:id", async ({ params: { id }, error }) => {
  try {
    const user = await usersService.getUserById(id);
    return { success: true, data: user };
  } catch (err) {
    return error(404, { success: false, message: err.message });
  }
})
```

### 7.3 类型复用

```typescript
// ✅ 正确 - 基于 Drizzle Schema 复用
export const usersModel = {
  insertUserDto: insertUserSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  updateUserDto: updateUserSchema.omit({ id: true, createdAt: true, updatedAt: true }),
};

// ❌ 错误 - 重复定义
export const usersModel = {
  insertUserDto: z.object({
    name: z.string(),
    email: z.string().email(),
    // 违反类型复用原则
  })
};
```