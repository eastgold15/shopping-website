# 数据库初始化脚本

本目录包含数据库初始化相关的脚本和示例数据。

## 文件说明

### `init-sample-data.sql`
包含完整的示例数据，涵盖以下表：
- **categories** - 商品分类（服装、男装、女装、童装等）
- **products** - 商品信息（T恤、衬衫、连衣裙等）
- **reviews** - 商品评价
- **site_config** - 网站配置（名称、Logo、联系信息等）
- **advertisements** - 广告数据（轮播图、Banner等）
- **header_config** - 顶部配置
- **footer_config** - 底部配置
- **images** - 图片管理
- **partners** - 合作伙伴
- **orders** - 订单数据
- **order_items** - 订单项
- **refunds** - 退款记录

### `run-init-data.js`
Node.js脚本，用于执行SQL文件并初始化数据库。

## 使用方法

### 方法一：使用npm脚本（推荐）

```bash
# 初始化示例数据
bun run db:init-data

# 重置数据库并初始化示例数据
bun run db:reset
```

### 方法二：直接运行脚本

```bash
# 进入项目根目录
cd /path/to/your/project

# 运行初始化脚本
bun run src/server/scripts/run-init-data.js --force
```

### 方法三：直接执行SQL文件

如果你有PostgreSQL客户端工具，可以直接执行SQL文件：

```bash
psql -h localhost -U postgres -d fashion_store -f src/server/scripts/init-sample-data.sql
```

## 注意事项

⚠️ **重要警告**：
- 执行初始化脚本会**清空现有数据**
- 请确保在开发环境中使用，不要在生产环境执行
- 建议在执行前备份重要数据

## 环境变量

确保以下环境变量已正确配置（在`.env`文件中）：

```env
DATABASE_URL=postgres://app_user:app_pass@localhost:5432/buy_db
```

或者使用分离的环境变量：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=buy_db
DB_USER=app_user
DB_PASSWORD=app_pass
```

## 示例数据内容

### 商品分类
- 服装（主分类）
  - 男装
    - T恤
    - 衬衫
  - 女装
    - 连衣裙
    - 上衣
  - 童装
- 配饰
  - 帽子

### 商品
- 经典白色T恤（$29.99）
- 商务休闲衬衫（$79.99）
- 优雅连衣裙（$159.99）
- 儿童卡通T恤（$24.99）
- 时尚棒球帽（$39.99）

### 网站配置
- 网站名称：Fashion Store
- 联系邮箱：info@fashionstore.com
- 联系电话：+1-234-567-8900
- 货币：USD

## 故障排除

### 常见问题

1. **连接数据库失败**
   - 检查数据库是否运行：`bun run docker:dev`
   - 验证环境变量配置

2. **权限错误**
   - 确保数据库用户有足够权限
   - 检查数据库是否存在

3. **外键约束错误**
   - 确保数据库schema是最新的：`bun run db:push`

### 重新初始化

如果需要重新初始化：

```bash
# 重置数据库结构和数据
bun run db:reset

# 或者分步执行
bun run db:push      # 更新数据库结构
bun run db:init-data # 初始化示例数据
```

## 自定义数据

如果需要添加自定义示例数据：

1. 编辑 `init-sample-data.sql` 文件
2. 添加你的INSERT语句
3. 重新运行初始化脚本

## 开发建议

- 在开发新功能前，建议先运行 `bun run db:reset` 确保数据一致性
- 定期备份重要的开发数据
- 可以根据需要修改示例数据以适应测试场景