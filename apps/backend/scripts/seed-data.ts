
import { db } from '@backend/db/connection';
import { hashSync } from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import {
  advertisementsSchema,
  categoriesSchema,
  imagesSchema,
  partnersSchema,
  productImagesSchema,
  productsSchema
} from '../src/db/schema/schema';

// 图片数据
const imageData = [
  {
    id: 2,
    fileName: 'laptop-1.jpg',
    originalName: '笔记本电脑1.jpg',
    url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    category: 'product',
    fileSize: 245760,
    mimeType: 'image/jpeg',
    altText: '高性能笔记本电脑'
  },
  {
    id: 3,
    fileName: 'phone-1.jpg',
    originalName: '智能手机1.jpg',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    category: 'product',
    fileSize: 189440,
    mimeType: 'image/jpeg',
    altText: '最新款智能手机'
  },
  {
    id: 4,
    fileName: 'headphones-1.jpg',
    originalName: '耳机1.jpg',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    category: 'product',
    fileSize: 167890,
    mimeType: 'image/jpeg',
    altText: '无线蓝牙耳机'
  },
  {
    id: 5,
    fileName: 'banner-1.jpg',
    originalName: '横幅广告1.jpg',
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200',
    category: 'advertisement',
    fileSize: 456780,
    mimeType: 'image/jpeg',
    altText: '春季大促销横幅'
  },
  {
    id: 6,
    fileName: 'partner-logo-1.png',
    originalName: '合作伙伴logo1.png',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400',
    category: 'partner',
    fileSize: 89340,
    mimeType: 'image/png',
    altText: '科技公司logo'
  }
];

// 分类数据
const categoryData = [
  {
    id: 1,
    name: '电子产品',
    slug: 'electronics',
    description: '各类电子设备和数码产品',
    parentId: null,
    sortOrder: 1,
    isActive: true,
    seoTitle: '电子产品 - 优质数码设备',
    seoDescription: '提供最新的电子产品，包括手机、电脑、耳机等数码设备'
  },
  {
    id: 2,
    name: '笔记本电脑',
    slug: 'laptops',
    description: '各品牌笔记本电脑',
    parentId: null, // 将在插入后更新
    sortOrder: 1,
    isActive: true,
    seoTitle: '笔记本电脑 - 高性能便携设备',
    seoDescription: '精选各品牌笔记本电脑，满足办公、游戏、设计等需求'
  },
  {
    id: 3,
    name: '智能手机',
    slug: 'smartphones',
    description: '最新款智能手机',
    parentId: null, // 将在插入后更新
    sortOrder: 2,
    isActive: true,
    seoTitle: '智能手机 - 最新科技体验',
    seoDescription: '汇聚各大品牌最新智能手机，体验前沿科技'
  },
  {
    id: 4,
    name: '音频设备',
    slug: 'audio',
    description: '耳机、音响等音频设备',
    parentId: null, // 将在插入后更新
    sortOrder: 3,
    isActive: true,
    seoTitle: '音频设备 - 享受高品质音效',
    seoDescription: '专业音频设备，包括耳机、音响、麦克风等'
  }
];

// 用户数据
const userData = [
  {
    id: 1,
    email: 'admin@example.com',
    password: hashSync('admin123', 10),
    name: '管理员',
    role: 'admin',
    emailVerified: true,
    phone: '13800138000',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    isActive: true
  },
  {
    id: 2,
    email: 'user@example.com',
    password: hashSync('user123', 10),
    name: '测试用户',
    role: 'user',
    emailVerified: true,
    phone: '13900139000',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200',
    isActive: true
  }
];

// 产品数据
const productData = [
  {
    id: 3,
    name: 'MacBook Pro 14英寸',
    slug: 'macbook-pro-14',
    description: 'Apple M2 Pro芯片，专业级性能笔记本电脑',
    shortDescription: '搭载M2 Pro芯片的专业笔记本',
    categoryId: -1, // 将在插入后更新
    price: "15999.00",
    comparePrice: "17999.00",
    cost: "12000.00",
    sku: 'MBP-14-M2P-512',
    barcode: '194253715634',
    stock: 50,
    minStock: 5,
    weight: "1.60",
    dimensions: { "length": "31.26", "width": "22.12", "height": "1.55", "unit": "cm" },
    videos: [],
    colors: ["深空灰色", "银色"],
    sizes: ["16GB/512GB", "16GB/1TB"],
    materials: ["铝合金"],
    careInstructions: "请避免液体接触，定期清洁屏幕",
    features: ["M2 Pro芯片", "Liquid Retina XDR显示屏", "ProMotion技术"],
    specifications: {
      processor: "Apple M2 Pro",
      memory: "16GB",
      storage: "512GB SSD",
      display: "14.2英寸 Liquid Retina XDR"
    },
    isActive: true,
    isFeatured: true,
    metaTitle: "MacBook Pro 14英寸 M2 Pro - 专业笔记本电脑",
    metaDescription: "Apple MacBook Pro 14英寸，搭载M2 Pro芯片，适合专业用户",
    metaKeywords: "Apple,MacBook,笔记本,M2 Pro"
  },
  {
    id: 4,
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    description: 'A17 Pro芯片，钛金属设计，专业摄影系统',
    shortDescription: '搭载A17 Pro芯片的旗舰手机',
    categoryId: -1, // 将在插入后更新
    price: "8999.00",
    comparePrice: "9999.00",
    cost: "6500.00",
    sku: 'IP15P-128-TI',
    barcode: '194253715641',
    stock: 100,
    minStock: 10,
    weight: "0.19",
    dimensions: { "length": "14.67", "width": "7.08", "height": "0.83", "unit": "cm" },
    videos: [],
    colors: ["原色钛金属", "蓝色钛金属", "白色钛金属", "黑色钛金属"],
    sizes: ["128GB", "256GB", "512GB", "1TB"],
    materials: ["钛金属", "玻璃"],
    careInstructions: "避免接触液体，使用原装充电器",
    features: ["A17 Pro芯片", "48MP摄像系统", "动作按钮", "USB-C接口"],
    specifications: {
      processor: "A17 Pro",
      storage: "128GB",
      display: "6.1英寸 Super Retina XDR",
      camera: "48MP主摄 + 12MP超广角 + 12MP长焦"
    },
    isActive: true,
    isFeatured: true,
    metaTitle: "iPhone 15 Pro - A17 Pro芯片旗舰手机",
    metaDescription: "Apple iPhone 15 Pro，A17 Pro芯片，钛金属设计",
    metaKeywords: "Apple,iPhone,智能手机,A17 Pro"
  },
  {
    id: 5,
    name: 'AirPods Pro 第三代',
    slug: 'airpods-pro-3rd',
    description: '主动降噪，空间音频，USB-C充电',
    shortDescription: '新一代主动降噪无线耳机',
    categoryId: -1, // 将在插入后更新
    price: "1899.00",
    comparePrice: "1999.00",
    cost: "1200.00",
    sku: 'APP3-USBC-WH',
    barcode: '194253715658',
    stock: 200,
    minStock: 20,
    weight: "0.06",
    dimensions: { "length": "3.05", "width": "2.18", "height": "2.40", "unit": "cm" },
    videos: [],
    colors: ["白色"],
    sizes: ["标准版"],
    materials: ["塑料", "硅胶"],
    careInstructions: "避免接触液体，定期清洁耳塞",
    features: ["主动降噪", "空间音频", "自适应透明模式", "USB-C充电"],
    specifications: {
      type: "入耳式无线耳机",
      battery: "最长6小时聆听时间",
      charging: "USB-C充电盒",
      connectivity: "蓝牙5.3"
    },
    isActive: true,
    isFeatured: false,
    metaTitle: "AirPods Pro 第三代 - 主动降噪无线耳机",
    metaDescription: "Apple AirPods Pro 第三代，主动降噪，空间音频体验",
    metaKeywords: "Apple,AirPods,无线耳机,降噪"
  }
];

// 广告数据
const advertisementData = [
  {
    title: '春季大促销',
    type: 'banner',
    image: '', // 将在插入后更新
    link: '/promotions/spring-sale',
    position: 'homepage_hero',
    sortOrder: 1,
    isActive: true,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-03-31')
  }
];

// 合作伙伴数据
const partnerData = [
  {
    name: '苹果公司',
    description: '全球领先的科技公司，iPhone和Mac的制造商',
    image: '', // 将在插入后更新
    url: 'https://www.apple.com',
    sortOrder: 1,
    isActive: true
  }
];

// 网站配置数据
const siteConfigData = [
  {
    key: 'site_name',
    value: '优购商城',
    description: '网站名称',
    type: 'string',
    category: 'general',
    isPublic: true
  },
  {
    key: 'site_description',
    value: '专业的电子产品购物平台，提供优质的数码设备和电子产品',
    description: '网站描述',
    type: 'text',
    category: 'general',
    isPublic: true
  },
  {
    key: 'contact_email',
    value: 'contact@yougo-mall.com',
    description: '联系邮箱',
    type: 'email',
    category: 'contact',
    isPublic: true
  },
  {
    key: 'contact_phone',
    value: '400-888-9999',
    description: '客服电话',
    type: 'string',
    category: 'contact',
    isPublic: true
  },
  {
    key: 'shipping_fee',
    value: '15.00',
    description: '默认运费',
    type: 'number',
    category: 'shipping',
    isPublic: false
  },
  {
    key: 'free_shipping_threshold',
    value: '199.00',
    description: '免运费门槛',
    type: 'number',
    category: 'shipping',
    isPublic: true
  }
];

async function seedDatabase() {
  try {
    console.log('开始填充数据库...');

    // 1. 插入图片数据
    console.log('插入图片数据...');
    await db.insert(imagesSchema).values(imageData);

    // 2. 插入用户数据
    // console.log('插入用户数据...');
    // await db.insert(userSchema).values(userData);

    // 3. 插入分类数据
    console.log('插入分类数据...');
    const insertedCategories = await db.insert(categoriesSchema).values(categoryData).returning();

    // 更新子分类的parentId
    const electronicsCategory = insertedCategories.find(c => c.slug === 'electronics');
    if (electronicsCategory) {
      await db.update(categoriesSchema)
        .set({ parentId: electronicsCategory.id })
        .where(or(
          eq(categoriesSchema.slug, 'laptops'),
          eq(categoriesSchema.slug, 'smartphones'),
          eq(categoriesSchema.slug, 'audio')
        ));
    }

    // 4. 插入产品数据
    console.log('插入产品数据...');
    const laptopCategory = insertedCategories.find(c => c.slug === 'laptops');
    const smartphoneCategory = insertedCategories.find(c => c.slug === 'smartphones');
    const audioCategory = insertedCategories.find(c => c.slug === 'audio');

    // 更新产品的分类ID
    productData[0].categoryId = laptopCategory?.id || -1;
    productData[1].categoryId = smartphoneCategory?.id || -1;
    productData[2].categoryId = audioCategory?.id || -1;
    productData.map(product => { product.price = String(product.price) })
    const insertedProducts = await db.insert(productsSchema).values(productData).returning();

    // 5. 插入产品图片关联数据
    console.log('插入产品图片关联数据...');
    const insertedImages = await db.select().from(imagesSchema).where(eq(imagesSchema.category, 'product'));

    const productImageRelations = [];
    // MacBook Pro 关联笔记本图片
    const macbookProduct = insertedProducts.find(p => p.slug === 'macbook-pro-14');
    const laptopImage = insertedImages.find(img => img.fileName === 'laptop-1.jpg');
    if (macbookProduct && laptopImage) {
      productImageRelations.push({
        productId: macbookProduct.id,
        imageId: laptopImage.id,
        sortOrder: 1,
        isMain: true
      });
    }

    // iPhone 15 Pro 关联手机图片
    const iphoneProduct = insertedProducts.find(p => p.slug === 'iphone-15-pro');
    const phoneImage = insertedImages.find(img => img.fileName === 'phone-1.jpg');
    if (iphoneProduct && phoneImage) {
      productImageRelations.push({
        productId: iphoneProduct.id,
        imageId: phoneImage.id,
        sortOrder: 1,
        isMain: true
      });
    }

    // AirPods Pro 关联耳机图片
    const airpodsProduct = insertedProducts.find(p => p.slug === 'airpods-pro-3rd');
    const headphonesImage = insertedImages.find(img => img.fileName === 'headphones-1.jpg');
    if (airpodsProduct && headphonesImage) {
      productImageRelations.push({
        productId: airpodsProduct.id,
        imageId: headphonesImage.id,
        sortOrder: 1,
        isMain: true
      });
    }

    if (productImageRelations.length > 0) {
      await db.insert(productImagesSchema).values(productImageRelations);
    }

    // 6. 插入广告数据
    console.log('插入广告数据...');
    const bannerImage = insertedImages.find(img => img.category === 'advertisement') || imageData.find(img => img.category === 'advertisement');
    advertisementData[0].image = bannerImage?.url || '';
    await db.insert(advertisementsSchema).values(advertisementData);

    // 7. 插入合作伙伴数据
    console.log('插入合作伙伴数据...');
    const partnerImage = insertedImages.find(img => img.category === 'partner') || imageData.find(img => img.category === 'partner');
    partnerData[0].image = partnerImage?.url || '';
    await db.insert(partnersSchema).values(partnerData);

    // // 7. 插入网站配置数据
    // console.log('插入网站配置数据...');
    // await db.insert(siteConfigSchema).values(siteConfigData);

    console.log('✅ 数据库填充完成！');
    console.log(`插入了：`);
    console.log(`- ${imageData.length} 张图片`);
    console.log(`- ${userData.length} 个用户`);
    console.log(`- ${categoryData.length} 个分类`);
    console.log(`- ${productData.length} 个产品`);
    console.log(`- ${advertisementData.length} 个广告`);
    console.log(`- ${partnerData.length} 个合作伙伴`);
    console.log(`- ${siteConfigData.length} 个配置项`);

  } catch (error) {
    console.error('❌ 数据填充失败:', error);
    throw error;
  }
}

// 直接执行数据填充
seedDatabase()
  .then(() => {
    console.log('数据填充脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据填充脚本执行失败:', error);
    process.exit(1);
  });

export { seedDatabase };
