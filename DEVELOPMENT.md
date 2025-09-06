# Shopping Website - 多运行时 Mono 仓库

## 项目结构

这是一个使用 Turborepo 管理的多运行时 mono 仓库，具有以下特点：

- **根包管理器**: pnpm
- **后端运行时**: Bun (Elysia 框架)
- **前端框架**: Vue + Vite
- **代码格式化**: Biome
- **构建工具**: pkgroll

## 目录结构

```
shopping-website/
├── apps/
│   ├── backend/          # Bun 后端应用
│   └── frontend/         # Vue 前端应用
├── packages/
│   ├── core/             # 核心共享包
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── docs/                 # 文档
├── package.json          # 根包配置
├── pnpm-workspace.yaml   # pnpm 工作区配置
├── turbo.json           # Turborepo 配置
└── biome.json           # Biome 代码格式化配置
```

## 开发命令

### 根目录命令

```bash
# 安装所有依赖
pnpm install

# 启动所有开发服务器
pnpm dev

# 构建所有应用
pnpm build

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm type-check

# 测试
pnpm test

# 清理构建文件
pnpm clean
```

### 后端特定命令 (使用 Bun)

```bash
# 进入后端目录
cd apps/backend

# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 构建项目
bun run build
```

### 前端特定命令 (使用 pnpm)

```bash
# 进入前端目录
cd apps/frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建项目
pnpm build
```

## 多运行时管理

### 包管理器策略

1. **根目录**: 使用 pnpm 管理整个 mono 仓库
2. **后端**: 使用 Bun 作为运行时和包管理器
3. **前端**: 使用 pnpm 作为包管理器
4. **共享包**: 使用 pnpm workspace 管理

### 依赖管理

- 外部依赖在各应用的 package.json 中管理
- 内部依赖使用 workspace 协议引用
- 根目录的 pnpm-lock.yaml 管理整体依赖

## 开发工作流

1. **设置开发环境**
   ```bash
   pnpm install:all
   ```

2. **同时开发前后端**
   ```bash
   # 终端1: 启动后端
   pnpm dev:backend
   
   # 终端2: 启动前端
   pnpm dev:frontend
   ```

3. **代码质量检查**
   ```bash
   pnpm lint          # 代码检查
   pnpm format        # 代码格式化
   pnpm type-check    # 类型检查
   ```

## 构建和部署

### 本地构建

```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm build --filter=backend
pnpm build --filter=frontend
```

### 环境变量

创建 `.env.local` 文件来配置环境变量：

```env
NODE_ENV=development
PORT=3000
```

## 代码规范

项目使用 Biome 进行代码格式化和检查：

- 自动格式化: `pnpm format`
- 代码检查: `pnpm lint`
- 自动修复: `pnpm lint:fix`

## 最佳实践

1. **依赖管理**: 优先使用 workspace 协议引用内部包
2. **脚本统一**: 根目录提供统一的命令接口
3. **缓存优化**: Turborepo 自动处理构建缓存
4. **类型安全**: 所有包都使用 TypeScript
5. **代码质量**: 使用 Biome 保持代码风格一致