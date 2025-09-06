# 数据库表注释功能

本项目使用自定义插件为PostgreSQL数据库表和列添加中文注释，方便开发和维护。

## 文件结构

- `comment.plugin.ts` - 注释插件核心文件，提供添加注释的功能
- `schema-comments.ts` - 注释配置文件，包含所有表和列的注释定义

## 使用方法

### 运行注释脚本

执行以下命令将注释应用到数据库：

```bash
bun run db:comments
```

### 添加新表注释

如果需要为新表添加注释，请按照以下步骤操作：

1. 在 `schema-comments.ts` 文件中导入新表：

```typescript
import { newTable } from "../schema/index";
```

2. 使用 `pgComments` 函数添加表注释：

```typescript
// 为新表添加注释
pgComments(newTable, {
  id: "ID，主键",
  name: "名称",
  // 其他字段...
});
```

## 查看注释

可以使用以下SQL查询查看已添加的表和列注释：

```sql
-- 查看表注释
SELECT c.relname AS table_name, d.description AS table_comment
FROM pg_class c
LEFT JOIN pg_description d ON c.oid = d.objoid AND d.objsubid = 0
WHERE c.relkind = 'r' AND c.relname NOT LIKE 'pg_%' AND c.relname NOT LIKE 'sql_%'
ORDER BY c.relname;

-- 查看列注释
SELECT c.relname AS table_name, a.attname AS column_name, d.description AS column_comment
FROM pg_class c
JOIN pg_attribute a ON c.oid = a.attrelid
LEFT JOIN pg_description d ON c.oid = d.objoid AND a.attnum = d.objsubid
WHERE c.relkind = 'r' AND c.relname NOT LIKE 'pg_%' AND c.relname NOT LIKE 'sql_%' AND a.attnum > 0
ORDER BY c.relname, a.attnum;
```

## 注意事项

1. 注释只会在执行 `db:comments` 命令后应用到数据库
2. 修改注释后需要重新运行命令才能更新数据库中的注释
3. 注释不会影响数据库功能，仅用于提高可读性和文档化
4. 确保数据库连接配置正确，否则注释添加可能失败