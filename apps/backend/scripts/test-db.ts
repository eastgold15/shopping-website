import { config } from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
config({ path: resolve(process.cwd(), '.env.development') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

// 测试数据库连接
import { db } from '../src/db/connection';

async function testConnection() {
  try {
    console.log('正在测试数据库连接...');
    const result = await db.execute('SELECT 1 as test');
    console.log('数据库连接成功:', result);
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

testConnection();