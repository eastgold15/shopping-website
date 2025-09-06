import { db } from '../src/db/connection.js';
import { productsSchema, categoriesSchema } from '../src/db/schema/index.js';

async function checkData() {
  try {
    console.log('检查数据库数据...');
    
    // 检查分类数据
    const categories = await db.select().from(categoriesSchema);
    console.log(`分类数量: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id}, 激活: ${cat.isActive})`);
    });
    
    // 检查商品数据
    const products = await db.select().from(productsSchema);
    console.log(`\n商品数量: ${products.length}`);
    products.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id}, 分类ID: ${product.categoryId}, 激活: ${product.isActive})`);
    });
    
    console.log('\n数据检查完成');
  } catch (error) {
    console.error('检查数据时出错:', error);
  } finally {
    process.exit(0);
  }
}

checkData();