-- 颜色尺寸重构迁移脚本
-- 将传统的颜色×尺寸笛卡尔积模式重构为颜色规格+尺寸范围模式

-- 1. 创建颜色规格表
CREATE TABLE IF NOT EXISTS color_specs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 颜色名称，如"午夜蓝"、"玫瑰金"
  color_value VARCHAR(50), -- 颜色值，如"#FF0000"
  image_url TEXT NOT NULL, -- 该颜色的展示图片URL
  description TEXT DEFAULT '', -- 颜色描述
  sort_order INTEGER DEFAULT 0, -- 排序权重
  is_active BOOLEAN DEFAULT true, -- 是否启用
  created_at TIMESTAMP DEFAULT NOW(), -- 创建时间
  updated_at TIMESTAMP DEFAULT NOW() -- 更新时间
);

-- 创建索引
CREATE INDEX idx_color_specs_product_id ON color_specs(product_id);
CREATE INDEX idx_color_specs_active ON color_specs(is_active);
CREATE INDEX idx_color_specs_sort ON color_specs(sort_order);

-- 2. 为商品表添加尺码范围字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_min VARCHAR(20); -- 最小尺码，如"39"
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_max VARCHAR(20); -- 最大尺码，如"48"
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_table TEXT; -- 尺码表，如"39,40,41,42,43,44,45,46,47,48"
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_description TEXT; -- 尺码说明，如"适合脚长24.5-28cm"
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_image TEXT; -- 默认主图URL

-- 3. 移除商品表中的价格库存字段（这些由SKU管理）
-- 注意：在生产环境中，应该先备份数据再执行这些操作
-- ALTER TABLE products DROP COLUMN IF EXISTS price;
-- ALTER TABLE products DROP COLUMN IF EXISTS compare_price;
-- ALTER TABLE products DROP COLUMN IF EXISTS cost;
-- ALTER TABLE products DROP COLUMN IF EXISTS stock;
-- ALTER TABLE products DROP COLUMN IF EXISTS min_stock;

-- 4. 修改SKU表结构，关联颜色规格而不是传统的颜色和尺寸
ALTER TABLE skus ADD COLUMN IF NOT EXISTS color_spec_id INTEGER REFERENCES color_specs(id) ON DELETE CASCADE;
ALTER TABLE skus ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2); -- 添加成本价字段
ALTER TABLE skus ADD COLUMN IF NOT EXISTS image_override TEXT; -- SKU专属图片URL（覆盖颜色图片）

-- 创建新的索引
CREATE INDEX IF NOT EXISTS idx_skus_color_spec_id ON skus(color_spec_id);

-- 5. 移除SKU表中的冗余字段（这些信息现在由color_specs表管理）
-- 注意：在生产环境中，应该先迁移数据再删除字段
-- ALTER TABLE skus DROP COLUMN IF EXISTS color_id;
-- ALTER TABLE skus DROP COLUMN IF EXISTS size_id;
-- ALTER TABLE skus DROP COLUMN IF EXISTS color_value;
-- ALTER TABLE skus DROP COLUMN IF EXISTS color_name;
-- ALTER TABLE skus DROP COLUMN IF EXISTS size_value;
-- ALTER TABLE skus DROP COLUMN IF EXISTS size_name;
-- ALTER TABLE skus DROP COLUMN IF EXISTS uk_size;
-- ALTER TABLE skus DROP COLUMN IF EXISTS eu_size;
-- ALTER TABLE skus DROP COLUMN IF EXISTS us_size;

-- 6. 创建数据迁移示例（需要根据实际数据调整）
/*
-- 示例：将现有的颜色信息迁移到颜色规格表
INSERT INTO color_specs (product_id, name, color_value, image_url, sort_order, is_active)
SELECT DISTINCT 
  s.product_id,
  s.color_name,
  s.color_value,
  '/images/default-color.jpg', -- 需要设置实际的图片URL
  0,
  true
FROM skus s 
WHERE s.color_name IS NOT NULL AND s.color_name != '';

-- 示例：更新SKU表，关联到新的颜色规格
UPDATE skus 
SET color_spec_id = cs.id
FROM color_specs cs
WHERE skus.product_id = cs.product_id 
  AND skus.color_name = cs.name;
*/

-- 7. 添加注释
COMMENT ON TABLE color_specs IS '颜色规格表 - 存储商品的颜色规格信息，每个颜色规格包含展示图片';
COMMENT ON COLUMN color_specs.name IS '颜色名称，如"午夜蓝"、"玫瑰金"';
COMMENT ON COLUMN color_specs.image_url IS '该颜色的展示图片URL，用户点击颜色时切换显示';
COMMENT ON COLUMN products.size_min IS '最小尺码，如"39"';
COMMENT ON COLUMN products.size_max IS '最大尺码，如"48"';
COMMENT ON COLUMN products.size_table IS '尺码表，如"39,40,41,42,43,44,45,46,47,48"或JSON格式';
COMMENT ON COLUMN products.size_description IS '尺码说明，如"适合脚长24.5-28cm"';
COMMENT ON COLUMN skus.color_spec_id IS '关联的颜色规格ID，替代原有的color_id';
COMMENT ON COLUMN skus.image_override IS 'SKU专属图片URL，可覆盖颜色规格的默认图片';