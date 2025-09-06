-- 初始化示例数据
-- 清空现有数据（按依赖关系倒序删除）
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE refunds CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE advertisements CASCADE;
TRUNCATE TABLE site_config CASCADE;
TRUNCATE TABLE header_config CASCADE;
TRUNCATE TABLE footer_config CASCADE;
TRUNCATE TABLE images CASCADE;
TRUNCATE TABLE partners CASCADE;

-- 重置序列
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE site_config_id_seq RESTART WITH 1;
ALTER SEQUENCE advertisements_id_seq RESTART WITH 1;
ALTER SEQUENCE header_config_id_seq RESTART WITH 1;
ALTER SEQUENCE footer_config_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE refunds_id_seq RESTART WITH 1;
ALTER SEQUENCE partners_id_seq RESTART WITH 1;

-- 插入商品分类数据
INSERT INTO categories (name, slug, description, parent_id, sort_order, is_visible, icon, image) VALUES
('服装', 'clothing', '各类服装产品', NULL, 1, true, 'pi pi-shopping-bag', '/images/categories/clothing.jpg'),
('男装', 'mens-clothing', '男士服装系列', 1, 1, true, 'pi pi-user', '/images/categories/mens.jpg'),
('女装', 'womens-clothing', '女士服装系列', 1, 2, true, 'pi pi-heart', '/images/categories/womens.jpg'),
('童装', 'kids-clothing', '儿童服装系列', 1, 3, true, 'pi pi-star', '/images/categories/kids.jpg'),
('T恤', 't-shirts', '各种款式T恤', 2, 1, true, 'pi pi-circle', '/images/categories/tshirts.jpg'),
('衬衫', 'shirts', '正装和休闲衬衫', 2, 2, true, 'pi pi-circle', '/images/categories/shirts.jpg'),
('连衣裙', 'dresses', '各种场合连衣裙', 3, 1, true, 'pi pi-circle', '/images/categories/dresses.jpg'),
('上衣', 'tops', '女士上衣系列', 3, 2, true, 'pi pi-circle', '/images/categories/tops.jpg'),
('配饰', 'accessories', '服装配饰', NULL, 2, true, 'pi pi-gift', '/images/categories/accessories.jpg'),
('帽子', 'hats', '各种帽子', 9, 1, true, 'pi pi-circle', '/images/categories/hats.jpg');

-- 插入商品数据
INSERT INTO products (name, slug, description, short_description, price, compare_price, cost, sku, barcode, weight, dimensions, images, videos, colors, sizes, materials, care_instructions, features, specifications, category_id, stock, min_stock, is_active, is_featured, meta_title, meta_description, meta_keywords) VALUES
('经典白色T恤', 'classic-white-tshirt', '采用100%纯棉制作的经典白色T恤，舒适透气，适合日常穿着。简约设计，百搭单品。', '100%纯棉经典白T恤，舒适百搭', 29.99, 39.99, 15.00, 'TS001', '1234567890123', 0.20, '{"length": 70, "width": 50, "height": 2}', '["https://example.com/images/white-tshirt-1.jpg", "https://example.com/images/white-tshirt-2.jpg"]', '[]', '["白色", "米白"]', '["S", "M", "L", "XL", "XXL"]', '["100%纯棉"]', '机洗冷水，低温烘干，不可漂白', '["透气舒适", "经典剪裁", "耐洗耐穿"]', '{"fabric": "100% Cotton", "weight": "180gsm", "fit": "Regular"}', 5, 150, 20, true, true, '经典白色T恤 - 100%纯棉舒适百搭', '经典白色T恤，采用100%纯棉制作，舒适透气，适合日常穿着，多种尺码可选', '白色T恤,纯棉T恤,经典T恤,百搭上衣'),

('商务休闲衬衫', 'business-casual-shirt', '精选优质棉质面料，商务休闲两相宜。经典版型设计，细节处理精致，是职场和日常的完美选择。', '商务休闲衬衫，优质棉质面料', 79.99, 99.99, 40.00, 'SH001', '1234567890124', 0.35, '{"length": 75, "width": 55, "height": 3}', '["https://example.com/images/shirt-1.jpg", "https://example.com/images/shirt-2.jpg"]', '[]', '["白色", "浅蓝", "条纹"]', '["S", "M", "L", "XL", "XXL"]', '["65%棉", "35%聚酯纤维"]', '机洗温水，悬挂晾干，可熨烫', '["免烫处理", "经典版型", "精致做工"]', '{"fabric": "65% Cotton 35% Polyester", "collar": "Spread", "cuff": "Button"}', 6, 80, 15, true, true, '商务休闲衬衫 - 优质棉质职场首选', '商务休闲衬衫，精选优质棉质面料，经典版型设计，适合职场和日常穿着', '商务衬衫,休闲衬衫,棉质衬衫,职场服装'),

('优雅连衣裙', 'elegant-dress', '设计师精心打造的优雅连衣裙，采用高品质面料，剪裁合身，展现女性优雅气质。适合多种场合穿着。', '设计师款优雅连衣裙，展现女性魅力', 159.99, 199.99, 80.00, 'DR001', '1234567890125', 0.45, '{"length": 120, "width": 60, "height": 5}', '["https://example.com/images/dress-1.jpg", "https://example.com/images/dress-2.jpg", "https://example.com/images/dress-3.jpg"]', '[]', '["黑色", "深蓝", "酒红"]', '["XS", "S", "M", "L", "XL"]', '["95%聚酯纤维", "5%氨纶"]', '干洗或手洗，阴干，低温熨烫', '["修身剪裁", "优雅设计", "多场合适用"]', '{"style": "A-line", "length": "Midi", "sleeve": "3/4 sleeve"}', 7, 60, 10, true, true, '优雅连衣裙 - 设计师款女性魅力', '优雅连衣裙，设计师精心打造，高品质面料，修身剪裁，展现女性优雅气质', '连衣裙,优雅裙装,设计师款,女装'),

('儿童卡通T恤', 'kids-cartoon-tshirt', '专为儿童设计的卡通T恤，采用环保染料和柔软棉质面料，图案可爱，颜色鲜艳，让孩子穿着舒适又时尚。', '儿童卡通T恤，环保面料安全舒适', 24.99, 34.99, 12.00, 'KT001', '1234567890126', 0.15, '{"length": 45, "width": 35, "height": 2}', '["https://example.com/images/kids-tshirt-1.jpg", "https://example.com/images/kids-tshirt-2.jpg"]', '[]', '["粉色", "蓝色", "黄色"]', '["90cm", "100cm", "110cm", "120cm", "130cm"]', '["100%有机棉"]', '机洗冷水，自然晾干，不可漂白', '["环保染料", "柔软舒适", "可爱图案"]', '{"age_range": "2-8岁", "print": "数码印花", "safety": "A类标准"}', 4, 100, 25, true, false, '儿童卡通T恤 - 环保面料安全舒适', '儿童卡通T恤，采用环保染料和有机棉面料，图案可爱，适合2-8岁儿童穿着', '儿童T恤,卡通T恤,有机棉,环保童装'),

('时尚棒球帽', 'fashion-baseball-cap', '经典棒球帽设计，采用高品质棉质面料，可调节帽围，适合各种头型。简约时尚，是搭配的完美选择。', '经典棒球帽，高品质棉质可调节', 39.99, 49.99, 20.00, 'CAP001', '1234567890127', 0.12, '{"diameter": 18, "height": 12, "depth": 18}', '["https://example.com/images/cap-1.jpg", "https://example.com/images/cap-2.jpg"]', '[]', '["黑色", "白色", "海军蓝", "卡其色"]', '["均码"]', '["100%棉"]', '手洗，自然晾干，保持帽型', '["可调节帽围", "经典设计", "透气舒适"]', '{"brim": "弯檐", "closure": "魔术贴", "style": "经典棒球帽"}', 10, 200, 30, true, false, '时尚棒球帽 - 经典设计百搭单品', '时尚棒球帽，经典设计，高品质棉质面料，可调节帽围，适合各种场合佩戴', '棒球帽,时尚帽子,棉质帽子,可调节帽子');

-- 插入商品评价数据
INSERT INTO reviews (product_id, user_name, user_email, rating, title, content, is_verified, is_approved) VALUES
(1, '张三', 'zhangsan@example.com', 5, '质量很好', '面料很舒服，洗了几次也不变形，值得推荐！', true, true),
(1, '李四', 'lisi@example.com', 4, '不错的选择', '款式简约，穿着舒适，就是颜色选择少了点。', false, true),
(2, '王五', 'wangwu@example.com', 5, '商务首选', '做工精细，版型很好，穿去上班很合适。', true, true),
(3, '赵六', 'zhaoliu@example.com', 5, '非常优雅', '裙子很漂亮，穿上很显气质，朋友都说好看。', true, true),
(4, '孙七', 'sunqi@example.com', 4, '孩子很喜欢', '图案很可爱，面料也很柔软，孩子穿着很舒服。', true, true);

-- 插入网站配置数据
INSERT INTO site_config (key, value, description, category) VALUES
-- 基本设置
('site_name', '外贸服装商城', '网站名称', 'general'),
('site_logo', '', '网站Logo URL', 'general'),
('site_keywords', '外贸,服装,时尚,购物', '网站关键词', 'seo'),
('site_description', '专业的外贸服装购物平台', '网站描述', 'seo'),
('contact_email', '', '联系邮箱', 'contact'),
('contact_phone', '', '联系电话', 'contact'),
('contact_address', '', '联系地址', 'contact'),
('icp_number', '', 'ICP备案号', 'legal'),
('copyright', '© 2024 外贸服装商城 All Rights Reserved', '版权信息', 'legal'),
('header_notice', 'FREE SHIPPING on orders over $59* details', '顶部通知', 'general'),
('free_shipping_threshold', '59', '免费配送门槛', 'general'),
('currency', 'USD', '货币单位', 'general'),

-- 导航页配置
('nav_home_enabled', 'true', '是否显示首页导航', 'navigation'),
('nav_products_enabled', 'true', '是否显示产品导航', 'navigation'),
('nav_categories_enabled', 'true', '是否显示分类导航', 'navigation'),
('nav_about_enabled', 'true', '是否显示关于我们导航', 'navigation'),
('nav_contact_enabled', 'true', '是否显示联系我们导航', 'navigation'),

-- 网站顶部配置
('header_banner_text', 'FREE SHIPPING on orders over $59* details', '顶部横幅文本', 'header'),
('header_banner_link', '/shipping-info', '顶部横幅链接', 'header'),
('header_track_order_text', 'Track Order', '追踪订单文本', 'header'),
('header_track_order_link', '/track-order', '追踪订单链接', 'header'),
('header_help_links', '[{"text":"Help","url":"/help"},{"text":"Contact","url":"/contact"}]', '帮助链接JSON', 'header'),
('header_search_enabled', 'true', '是否显示搜索框', 'header'),
('header_cart_enabled', 'true', '是否显示购物车图标', 'header'),
('header_user_menu_enabled', 'true', '是否显示用户菜单', 'header'),

-- 底部配置
('footer_copyright', '© 2024 WWW.APPARELCITY.COM.CN All Rights Reserved 赣ICP备2024041550号-5', '版权信息', 'footer'),
('footer_back_to_top_text', 'Back to top', '返回顶部文本', 'footer'),
('footer_sections', '[{"title":"For You","links":[{"text":"Favorites","url":"/favorites"},{"text":"Gift Cards","url":"/gift-cards"}]},{"title":"Connect with Us","links":[{"text":"Customer Service","url":"/customer-service"},{"text":"Social Media","url":"/social"}]},{"title":"Legal","links":[{"text":"Terms of Use","url":"/terms"},{"text":"Privacy Policy","url":"/privacy"}]}]', '底部栏目JSON', 'footer'),
('footer_company_name', '外贸服装商城有限公司', '公司名称', 'footer'),
('footer_company_address', '', '公司地址', 'footer'),
('footer_company_phone', '', '公司电话', 'footer'),
('footer_company_email', '', '公司邮箱', 'footer'),
('footer_social_facebook', '', 'Facebook链接', 'footer'),
('footer_social_twitter', '', 'Twitter链接', 'footer'),
('footer_social_instagram', '', 'Instagram链接', 'footer'),
('footer_social_youtube', '', 'YouTube链接', 'footer');

-- 插入广告数据
INSERT INTO advertisements (title, type, image, link, position, sort_order, is_active, start_date, end_date) VALUES
('春季新品上市', 'banner', '/images/ads/spring-collection.jpg', '/categories/new-arrivals', 'homepage_hero', 1, true, '2024-03-01 00:00:00', '2024-05-31 23:59:59'),
('夏日清仓特惠', 'carousel', '/images/ads/summer-sale.jpg', '/sale', 'homepage_carousel', 2, true, '2024-06-01 00:00:00', '2024-08-31 23:59:59'),
('会员专享折扣', 'sidebar', '/images/ads/member-discount.jpg', '/membership', 'product_sidebar', 1, true, '2024-01-01 00:00:00', '2024-12-31 23:59:59'),
('免费配送活动', 'banner', '/images/ads/free-shipping.jpg', '/shipping-info', 'category_top', 1, true, '2024-01-01 00:00:00', '2024-12-31 23:59:59');

-- 插入顶部配置数据
INSERT INTO header_config (shipping_text, track_order_text, help_text, track_order_url, help_url, is_active) VALUES
('满$59免费配送* 查看详情', '订单追踪', '帮助中心', '/track-order', '/help', true);

-- 插入底部配置数据
INSERT INTO footer_config (section_title, link_text, link_url, sort_order, is_active) VALUES
('客户服务', '联系我们', '/contact', 1, true),
('客户服务', '配送信息', '/shipping', 2, true),
('客户服务', '退换政策', '/returns', 3, true),
('客户服务', '尺码指南', '/size-guide', 4, true),
('关于我们', '公司简介', '/about', 1, true),
('关于我们', '招聘信息', '/careers', 2, true),
('关于我们', '新闻资讯', '/news', 3, true),
('法律信息', '隐私政策', '/privacy', 1, true),
('法律信息', '服务条款', '/terms', 2, true),
('法律信息', 'Cookie政策', '/cookies', 3, true);

-- 插入图片管理数据
INSERT INTO images (id, file_name, original_name, url, category, file_size, mime_type, alt_text) VALUES
('img_001', 'white-tshirt-1.jpg', '白色T恤正面.jpg', '/uploads/products/white-tshirt-1.jpg', 'products', 245760, 'image/jpeg', '经典白色T恤正面图'),
('img_002', 'white-tshirt-2.jpg', '白色T恤背面.jpg', '/uploads/products/white-tshirt-2.jpg', 'products', 198432, 'image/jpeg', '经典白色T恤背面图'),
('img_003', 'shirt-1.jpg', '商务衬衫.jpg', '/uploads/products/shirt-1.jpg', 'products', 312576, 'image/jpeg', '商务休闲衬衫'),
('img_004', 'dress-1.jpg', '优雅连衣裙.jpg', '/uploads/products/dress-1.jpg', 'products', 387264, 'image/jpeg', '优雅连衣裙展示图'),
('img_005', 'logo.png', '网站Logo.png', '/uploads/site/logo.png', 'site', 45312, 'image/png', 'Fashion Store Logo');

-- 插入合作伙伴数据
INSERT INTO partners (name, description, image, url, sort_order, is_active) VALUES
('时尚品牌A', '国际知名时尚品牌，专注于高品质服装设计', '/images/partners/brand-a.jpg', 'https://brand-a.com', 1, true),
('设计师工作室B', '独立设计师工作室，创新设计理念', '/images/partners/studio-b.jpg', 'https://studio-b.com', 2, true),
('面料供应商C', '优质面料供应商，环保可持续发展', '/images/partners/supplier-c.jpg', 'https://supplier-c.com', 3, true),
('物流合作伙伴D', '专业物流服务，快速安全配送', '/images/partners/logistics-d.jpg', 'https://logistics-d.com', 4, true);

-- 插入订单数据
INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, billing_address, subtotal, shipping_cost, tax_amount, discount_amount, total_amount, currency, status, payment_status, payment_method, payment_id, tracking_number, shipping_method, notes) VALUES
('ORD-2024-001', '张三', 'zhangsan@example.com', '+86-138-0000-0001', '{"name": "张三", "address": "北京市朝阳区xxx街道123号", "city": "北京", "postal_code": "100000", "country": "中国"}', '{"name": "张三", "address": "北京市朝阳区xxx街道123号", "city": "北京", "postal_code": "100000", "country": "中国"}', 59.98, 0.00, 5.40, 0.00, 65.38, 'USD', 'delivered', 'paid', 'credit_card', 'pay_123456789', 'TRK001234567', 'standard', '客户要求快速配送'),
('ORD-2024-002', '李四', 'lisi@example.com', '+86-138-0000-0002', '{"name": "李四", "address": "上海市浦东新区xxx路456号", "city": "上海", "postal_code": "200000", "country": "中国"}', '{"name": "李四", "address": "上海市浦东新区xxx路456号", "city": "上海", "postal_code": "200000", "country": "中国"}', 79.99, 5.99, 7.74, 10.00, 83.72, 'USD', 'processing', 'paid', 'paypal', 'pay_987654321', NULL, 'express', '使用了优惠券');

-- 插入订单项数据
INSERT INTO order_items (order_id, product_id, product_name, product_sku, product_image, unit_price, quantity, total_price, selected_color, selected_size, product_options) VALUES
(1, 1, '经典白色T恤', 'TS001', '/uploads/products/white-tshirt-1.jpg', 29.99, 2, 59.98, '白色', 'L', '{"gift_wrap": false}'),
(2, 2, '商务休闲衬衫', 'SH001', '/uploads/products/shirt-1.jpg', 79.99, 1, 79.99, '浅蓝', 'M', '{"gift_wrap": true, "gift_message": "生日快乐！"}');

-- 插入退款数据
INSERT INTO refunds (order_id, refund_number, amount, reason, status, refund_method, processed_at, notes) VALUES
(1, 'REF-2024-001', 29.99, '尺码不合适', 'processed', 'original_payment', '2024-01-15 10:30:00', '客户申请退款一件T恤，已处理完成');

COMMIT;

-- 查询验证数据
SELECT 'Categories' as table_name, count(*) as record_count FROM categories
UNION ALL
SELECT 'Products', count(*) FROM products
UNION ALL
SELECT 'Reviews', count(*) FROM reviews
UNION ALL
SELECT 'Site Config', count(*) FROM site_config
UNION ALL
SELECT 'Advertisements', count(*) FROM advertisements
UNION ALL
SELECT 'Header Config', count(*) FROM header_config
UNION ALL
SELECT 'Footer Config', count(*) FROM footer_config
UNION ALL
SELECT 'Images', count(*) FROM images
UNION ALL
SELECT 'Partners', count(*) FROM partners
UNION ALL
SELECT 'Orders', count(*) FROM orders
UNION ALL
SELECT 'Order Items', count(*) FROM order_items
UNION ALL
SELECT 'Refunds', count(*) FROM refunds;