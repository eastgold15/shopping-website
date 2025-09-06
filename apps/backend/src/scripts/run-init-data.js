#!/usr/bin/env bun

/**
 * 数据库初始化脚本
 * 执行示例数据的插入
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { config } from 'dotenv';
import { envConfig, EnvConfig } from '../src/config/env';

// 加载环境变量
config({ path: join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库连接配置
console.log(`数据库连接配置: ${envConfig.get('DATABASE_URL')}`)
const sql = postgres(envConfig.get('DATABASE_URL'));

async function initSampleData() {
  try {
    console.log('🚀 开始初始化示例数据...');

    // 读取SQL文件
    const sqlFilePath = join(__dirname, 'init-sample-data.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf-8');

    // 分割SQL语句（按分号分割，但忽略注释中的分号）
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .filter(statement => statement.trim() !== '');

    console.log(`📝 找到 ${statements.length} 条SQL语句`);

    // 执行每条SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await sql.unsafe(statement);
          console.log(`✅ 执行第 ${i + 1} 条语句成功`);
        } catch (error) {
          console.error(`❌ 执行第 ${i + 1} 条语句失败:`, error.message);
          console.error('语句内容:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n🎉 示例数据初始化完成！');
    console.log('\n📊 数据统计:');

    // 查询各表的记录数量
    const tables = [
      'categories', 'products', 'reviews', 'site_config',
      'advertisements', 'header_config', 'footer_config',
      'images', 'partners', 'orders', 'order_items', 'refunds'
    ];

    for (const table of tables) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`   ${table}: ${result[0].count} 条记录`);
      } catch (error) {
        console.log(`   ${table}: 查询失败 (${error.message})`);
      }
    }

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// 确认执行
const args = process.argv.slice(2);
if (args.includes('--force') || args.includes('-f')) {
  initSampleData();
} else {
  console.log('⚠️  这将清空现有数据并插入示例数据！');
  console.log('如果确定要继续，请使用 --force 或 -f 参数:');
  console.log('bun run scripts/run-init-data.js --force');
}