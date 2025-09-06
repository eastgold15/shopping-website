import { db } from '../src/db/connection.ts';
import { 
  categoriesSchema, 
  productsSchema, 
  advertisementsSchema, 
  siteConfigSchema,
  headerConfigSchema,
  footerConfigSchema
} from '../src/db/schema/index.ts';
import { eq } from 'drizzle-orm';

/**
 * 初始化测试数据脚本
 */
async function initializeData() {
  console.log('🚀 开始初始化测试数据...');

  try {
    // 1. 初始化分类数据
    const categories = await initCategories();
    
    // 2. 初始化商品数据
    await initProducts(categories);
    
    // 3. 初始化广告数据
    await initAdvertisements();
    
    // 4. 初始化网站配置
    await initSiteConfigs();
    
    // 5. 初始化布局配置
    await initLayoutConfigs();
    
    console.log('✅ 测试数据初始化完成！');
  } catch (error) {
    console.error('❌ 初始化数据失败:', error);
    process.exit(1);
  }
}

/**
 * 初始化分类数据
 */
async function initCategories() {
  console.log('📁 初始化分类数据...');
  
  const categories = [
    {
      name: '女装',
      slug: 'womens-clothing',
      description: '时尚女装系列',
      parentId: null,
      sortOrder: 1,
      isVisible: true,
      icon: 'ic:outline-woman',
      image: '/images/categories/womens.jpg'
    },
    {
      name: '男装',
      slug: 'mens-clothing',
      description: '时尚男装系列',
      parentId: null,
      sortOrder: 2,
      isVisible: true,
      icon: 'ic:outline-man',
      image: '/images/categories/mens.jpg'
    }
  ];

  const createdCategories: any[] = [];
  
  for (const category of categories) {
    const existing = await db.select()
      .from(categoriesSchema)
      .where(eq(categoriesSchema.slug, category.slug))
      .limit(1);
    
    if (existing.length === 0) {
      const [newCategory] = await db.insert(categoriesSchema).values(category).returning();
      createdCategories.push(newCategory);
      console.log(`  ✓ 创建分类: ${category.name} (ID: ${newCategory.id})`);
    } else {
      createdCategories.push(existing[0]);
      console.log(`  - 分类已存在: ${category.name} (ID: ${existing[0].id})`);
    }
  }
  
  return createdCategories;
}

/**
 * 初始化商品数据
 */
async function initProducts(categories: any[]) {
  console.log('🛍️ 初始化商品数据...');
  
  // 获取分类ID
  const womensCategory = categories.find(c => c.slug === 'womens-clothing');
  const mensCategory = categories.find(c => c.slug === 'mens-clothing');
  
  if (!womensCategory || !mensCategory) {
    console.error('未找到必要的分类，跳过商品初始化');
    return;
  }
  
  const products = [
    {
      name: '优雅连衣裙',
      slug: 'elegant-dress',
      description: '时尚优雅的连衣裙，适合各种场合穿着。采用高品质面料，舒适透气。',
      shortDescription: '时尚优雅连衣裙',
      price: 299.00,
      comparePrice: 399.00,
      cost: 150.00,
      sku: 'DRESS001',
      barcode: '1234567890123',
      weight: 0.5,
      dimensions: { length: 120, width: 60, height: 2 },
      images: [
        '/images/products/dress1-1.jpg',
        '/images/products/dress1-2.jpg',
        '/images/products/dress1-3.jpg'
      ],
      videos: [],
      colors: ['黑色', '白色', '红色'],
      sizes: ['S', 'M', 'L', 'XL'],
      materials: ['聚酯纤维', '弹性纤维'],
      careInstructions: '机洗，低温熨烫',
      features: ['透气', '舒适', '时尚'],
      specifications: { fabric: '聚酯纤维95%，弹性纤维5%' },
      categoryId: womensCategory.id, // 女装分类
      stock: 100,
      minStock: 10,
      isActive: true,
      isFeatured: true,
      metaTitle: '优雅连衣裙 - 时尚女装',
      metaDescription: '优雅连衣裙，时尚设计，高品质面料，适合各种场合',
      metaKeywords: '连衣裙,女装,时尚,优雅'
    },
    {
      name: '休闲T恤',
      slug: 'casual-tshirt',
      description: '舒适的休闲T恤，100%纯棉材质，透气吸汗，适合日常穿着。',
      shortDescription: '舒适休闲T恤',
      price: 89.00,
      comparePrice: 129.00,
      cost: 45.00,
      sku: 'TSHIRT001',
      barcode: '1234567890124',
      weight: 0.2,
      dimensions: { length: 70, width: 50, height: 1 },
      images: [
        '/images/products/tshirt1-1.jpg',
        '/images/products/tshirt1-2.jpg'
      ],
      videos: [],
      colors: ['白色', '黑色', '灰色', '蓝色'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      materials: ['纯棉'],
      careInstructions: '机洗，中温熨烫',
      features: ['透气', '吸汗', '舒适'],
      specifications: { fabric: '100%纯棉' },
      categoryId: mensCategory.id, // 男装分类
      stock: 200,
      minStock: 20,
      isActive: true,
      isFeatured: false,
      metaTitle: '休闲T恤 - 男装',
      metaDescription: '舒适休闲T恤，100%纯棉，透气吸汗',
      metaKeywords: 'T恤,男装,休闲,纯棉'
    },
    {
      name: '时尚上衣',
      slug: 'fashion-top',
      description: '时尚女士上衣，设计简约大方，适合职场和休闲场合。',
      shortDescription: '时尚女士上衣',
      price: 199.00,
      comparePrice: 259.00,
      cost: 100.00,
      sku: 'TOP001',
      barcode: '1234567890125',
      weight: 0.3,
      dimensions: { length: 65, width: 45, height: 1 },
      images: [
        '/images/products/top1-1.jpg',
        '/images/products/top1-2.jpg',
        '/images/products/top1-3.jpg'
      ],
      videos: [],
      colors: ['白色', '粉色', '蓝色'],
      sizes: ['S', 'M', 'L'],
      materials: ['雪纺', '聚酯纤维'],
      careInstructions: '手洗，阴干',
      features: ['轻薄', '透气', '时尚'],
      specifications: { fabric: '雪纺面料' },
      categoryId: womensCategory.id, // 女装分类
      stock: 80,
      minStock: 8,
      isActive: true,
      isFeatured: true,
      metaTitle: '时尚上衣 - 女装',
      metaDescription: '时尚女士上衣，简约设计，适合多种场合',
      metaKeywords: '上衣,女装,时尚,职场'
    }
  ];

  for (const product of products) {
    const existing = await db.select()
      .from(productsSchema)
      .where(eq(productsSchema.slug, product.slug))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(productsSchema).values(product);
      console.log(`  ✓ 创建商品: ${product.name}`);
    } else {
      console.log(`  - 商品已存在: ${product.name}`);
    }
  }
}

/**
 * 初始化广告数据
 */
async function initAdvertisements() {
  console.log('📢 初始化广告数据...');
  
  const advertisements = [
    {
      title: '春季新品上市',
      type: 'carousel',
      image: '/images/ads/spring-collection.jpg',
      link: '/products?category=new-arrivals',
      position: 'homepage-carousel',
      sortOrder: 1,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    {
      title: '夏日清仓大促',
      type: 'carousel',
      image: '/images/ads/summer-sale.jpg',
      link: '/products?sale=true',
      position: 'homepage-carousel',
      sortOrder: 2,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    {
      title: '新用户专享优惠',
      type: 'banner',
      image: '/images/ads/new-user-banner.jpg',
      link: '/register',
      position: 'product-detail',
      sortOrder: 1,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    },
    {
      title: '免费配送',
      type: 'banner',
      image: '/images/ads/free-shipping.jpg',
      link: '/shipping-info',
      position: 'sidebar',
      sortOrder: 1,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    }
  ];

  for (const ad of advertisements) {
    const existing = await db.select()
      .from(advertisementsSchema)
      .where(eq(advertisementsSchema.title, ad.title))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(advertisementsSchema).values(ad);
      console.log(`  ✓ 创建广告: ${ad.title}`);
    } else {
      console.log(`  - 广告已存在: ${ad.title}`);
    }
  }
}

/**
 * 初始化网站配置
 */
async function initSiteConfigs() {
  console.log('⚙️ 初始化网站配置...');
  
  const configs = [
    {
      key: 'site_name',
      value: '时尚服装商城',
      description: '网站名称',
      category: 'basic'
    },
    {
      key: 'site_logo',
      value: '/images/logo.png',
      description: '网站Logo',
      category: 'basic'
    },
    {
      key: 'site_keywords',
      value: '服装,时尚,购物,女装,男装',
      description: '网站关键词',
      category: 'seo'
    },
    {
      key: 'site_description',
      value: '专业的时尚服装购物平台，提供优质的男女装产品',
      description: '网站描述',
      category: 'seo'
    },
    {
      key: 'contact_email',
      value: 'contact@fashion-store.com',
      description: '联系邮箱',
      category: 'contact'
    },
    {
      key: 'contact_phone',
      value: '+86 400-123-4567',
      description: '联系电话',
      category: 'contact'
    },
    {
      key: 'icp_number',
      value: '京ICP备12345678号',
      description: '备案号',
      category: 'legal'
    },
    {
      key: 'copyright',
      value: '© 2024 时尚服装商城 版权所有',
      description: '版权信息',
      category: 'legal'
    },
    {
      key: 'free_shipping_threshold',
      value: '99',
      description: '免费配送门槛',
      category: 'shipping'
    },
    {
      key: 'currency',
      value: 'CNY',
      description: '默认货币',
      category: 'basic'
    }
  ];

  for (const config of configs) {
    const existing = await db.select()
      .from(siteConfigSchema)
      .where(eq(siteConfigSchema.key, config.key))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(siteConfigSchema).values(config);
      console.log(`  ✓ 创建配置: ${config.key}`);
    } else {
      console.log(`  - 配置已存在: ${config.key}`);
    }
  }
}

/**
 * 初始化布局配置
 */
async function initLayoutConfigs() {
  console.log('🎨 初始化布局配置...');
  
  // 初始化顶部配置
  const headerConfig = {
    shippingText: 'FREE SHIPPING on orders over $59* details',
    trackOrderText: 'Track Order',
    helpText: 'Help',
    trackOrderUrl: '/track-order',
    helpUrl: '/help',
    isActive: true
  };

  const existingHeader = await db.select()
    .from(headerConfigSchema)
    .limit(1);
  
  if (existingHeader.length === 0) {
    await db.insert(headerConfigSchema).values(headerConfig);
    console.log(`  ✓ 创建顶部配置`);
  } else {
    console.log(`  - 顶部配置已存在`);
  }

  // 初始化底部配置
  const footerConfigs = [
    {
      sectionTitle: '关于我们',
      linkText: '公司简介',
      linkUrl: '/about',
      sortOrder: 1,
      isActive: true
    },
    {
      sectionTitle: '客户服务',
      linkText: '联系我们',
      linkUrl: '/contact',
      sortOrder: 2,
      isActive: true
    },
    {
      sectionTitle: '帮助中心',
      linkText: '常见问题',
      linkUrl: '/faq',
      sortOrder: 3,
      isActive: true
    }
  ];

  for (const footerConfig of footerConfigs) {
    const existing = await db.select()
      .from(footerConfigSchema)
      .where(eq(footerConfigSchema.sectionTitle, footerConfig.sectionTitle))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(footerConfigSchema).values(footerConfig);
      console.log(`  ✓ 创建底部配置: ${footerConfig.sectionTitle}`);
    } else {
      console.log(`  - 底部配置已存在: ${footerConfig.sectionTitle}`);
    }
  }
}

// 运行初始化
initializeData().catch(console.error);