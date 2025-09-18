# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

这是一个基于 Bun + Turborepo 的全栈电商项目，使用 Elysia 后端框架和 Vue3 + PrimeVue 前端框架。项目采用 monorepo 架构，包含以下主要应用：

- `apps/backend` - Elysia 后端 API 服务
- `apps/frontend` - Vue3 前端应用
- `packages/*` - 共享配置包（ESLint、TypeScript 配置等）

## Development Environment

### 包管理器
- **项目使用 Bun 作为包管理器**（根据用户配置）
- 使用 `bun` 而不是 `npm` 或 `pnpm` 进行依赖管理

### 常用命令

#### 根目录命令
```bash
# 开发环境启动所有服务
bun dev

# 构建所有应用
bun build

# 代码检查
bun lint

# 自动修复代码问题
bun lint:fix

# 类型检查
bun check-types

# 清理构建文件
bun clean
```

#### 后端开发 (apps/backend)
```bash
# 启动后端开发服务器
cd apps/backend && bun dev

# 后端类型检查
cd apps/backend && bun type-check

# 数据库相关命令
cd apps/backend && bun db:generate    # 生成数据库迁移文件
cd apps/backend && bun db:migrate     # 执行数据库迁移
cd apps/backend && bun db:push        # 推送 schema 到数据库
cd apps/backend && bun db:studio      # 启动数据库管理界面
```

#### 前端开发 (apps/frontend)
```bash
# 启动前端开发服务器
cd apps/frontend && bun dev

# 前端类型检查
cd apps/frontend && bun type-check

# 构建前端应用
cd apps/frontend && bun build
```

## 技术栈

### 后端技术栈
- **框架**: Elysia (基于 Bun 的 Web 框架)
- **数据库**: PostgreSQL + Drizzle ORM
- **验证**: Zod + drizzle-zod
- **API 文档**: OpenAPI (Swagger)
- **认证**: @pori15/elysia-auth-drizzle
- **文件存储**: AWS S3

### 前端技术栈
- **框架**: Vue3 + TypeScript
- **UI 库**: PrimeVue + UnoCSS
- **构建工具**: Vite
- **状态管理**: Pinia (Vue 官方推荐)
- **路由**: Vue Router 4
- **表单**: @primevue/forms + Zod 验证

## 项目架构

### 后端架构
- **控制器层**: `/modules/*/controller.ts` - 处理 HTTP 请求
- **服务层**: `/modules/*/service.ts` - 业务逻辑
- **数据模型**: `/db/models/*.ts` - 数据库表定义和 Zod schema
- **数据库连接**: `/db/connection.ts` - Drizzle ORM 配置

### 前端架构
- **页面**: `/pages/*.vue` - 页面组件
- **组件**: `/components/*.vue` - 可复用组件
- **API 客户端**: 使用 `@elysiajs/eden` 连接后端 API
- **类型共享**: 直接使用后端定义的数据库类型

## 类型共享

项目实现了前后端类型共享：
- 前端可以通过 `@backend/types` 导入后端定义的类型
- 后端通过 `exports` 在 `package.json` 中暴露类型定义
- 主要的数据库模型类型位于 `apps/backend/src/db/models/` 目录

## 数据库设计

主要数据模型：
- **产品**: `products` - 商品基本信息
- **SKU**: `skus` - 商品变体（颜色、尺寸组合）
- **分类**: `categories` - 商品分类（支持树形结构）
- **图片**: `images` + `productImages` - 图片管理和商品图片关联
- **用户**: `users` - 用户管理
- **属性**: `attributes` - 商品属性系统

## 开发注意事项

### 代码规范
- 使用 **Biome** 进行代码格式化和检查
- 使用 **TypeScript** 严格模式
- 遵循 **ESLint** 规则（继承自 `@repo/eslint-config`）

### 数据库操作
- 所有数据库操作使用 **Drizzle ORM**
- 使用 **事务** 确保数据一致性
- 数据库 schema 变更需要通过 **Drizzle Kit** 管理迁移

### API 设计
- 使用 **OpenAPI** 自动生成文档
- 采用 **RESTful** 设计原则
- 统一的响应格式和错误处理

### 前端开发
- 使用 **Composition API** 和 `<script setup>` 语法
- 组件使用 **PrimeVue** UI 库
- 样式使用 **UnoCSS** 原子化 CSS

## 部署相关

项目支持生产环境部署：
- 后端：使用 `bun build` 构建生产版本
- 前端：使用 `vite build` 构建静态资源
- 支持 SFTP 部署（通过 `deploy-*.cjs` 脚本）

## 重要配置文件

- `turbo.json` - Turborepo 任务配置
- `tsconfig.json` - TypeScript 配置（支持路径映射）
- `apps/backend/package.json` - 后端依赖和脚本
- `apps/frontend/package.json` - 前端依赖和脚本