# 数据库列注释插件使用说明

这个插件允许为PostgreSQL数据库表的列添加注释，使数据库结构更加清晰易懂。

## 文件结构

- `comment.plugin.ts` - 注释插件的核心实现
- `schema-comments.ts` - 为数据库表添加注释的配置文件

## 使用方法

### 1. 运行注释添加脚本

```bash
# 使用Bun运行
bun run src/db/schema-comments.ts

# 或使用Node运行
node --loader ts-node/esm src/db/schema-comments.ts
```

### 2. 添加新的表注释

在`schema-comments.ts`文件中，按照以下格式添加新的表注释：

```typescript
pgComments(表名, {
  列名1: "列1的注释",
  列名2: "列2的注释",
  // ...
});
```

例如：

```typescript
pgComments(newTable, {
  id: "唯一标识符",
  name: "名称",
  description: "描述信息",
});
```

### 3. 查看注释

添加注释后，可以在PostgreSQL客户端工具中查看表的注释信息，或者使用以下SQL查询：

```sql
-- 查看特定表的列注释
SELECT
    a.attname AS column_name,
    d.description AS column_description
FROM
    pg_catalog.pg_attribute a
    LEFT JOIN pg_catalog.pg_description d ON
        d.objoid = a.attrelid AND d.objsubid = a.attnum
WHERE
    a.attrelid = '表名'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped
ORDER BY
    a.attnum;
```

## 注意事项

1. 注释只会在运行脚本时添加到数据库，不会影响表结构或数据
2. 如果列已有注释，运行脚本会覆盖现有注释
3. 确保在添加注释前，相应的表和列已经在数据库中创建