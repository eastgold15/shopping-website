<template>
  <div class="product-card" @click="$emit('click')">
    <!-- 商品图片 -->
    <div class="product-image">
      <img
        :src="product.images?.[0] || '/placeholder-product.jpg'"
        :alt="product.name"
        loading="lazy"
      />
      
      <!-- 促销标签 -->
      <div v-if="product.salePrice" class="sale-badge">
        <span>SALE</span>
      </div>
      
      <!-- 推荐标签 -->
      <div v-if="product.isFeatured" class="featured-badge">
        <i class="pi pi-star-fill"></i>
      </div>
      
      <!-- 快速操作 -->
      <div class="quick-actions">
        <Button
          icon="pi pi-heart"
          severity="secondary"
          outlined
          rounded
          @click.stop="toggleFavorite"
          :class="{ 'favorited': isFavorited }"
          v-tooltip="'添加到收藏'"
        />
        <Button
          icon="pi pi-eye"
          severity="secondary"
          outlined
          rounded
          @click.stop="quickView"
          v-tooltip="'快速查看'"
        />
      </div>
    </div>
    
    <!-- 商品信息 -->
    <div class="product-info">
      <!-- 商品名称 -->
      <h3 class="product-name">{{ product.name }}</h3>
      
      <!-- 商品价格 -->
      <div class="product-price">
        <span v-if="product.salePrice" class="sale-price">
          ${{ product.salePrice.toFixed(2) }}
        </span>
        <span
          :class="{
            'original-price': true,
            'crossed': product.salePrice
          }"
        >
          ${{ product.price.toFixed(2) }}
        </span>
        <span v-if="discountPercentage" class="discount">
          -{{ discountPercentage }}%
        </span>
      </div>
      
      <!-- 分期付款信息 -->
      <div v-if="installmentPrice" class="installment-info">
        <span>or 4 payments of ${{ installmentPrice.toFixed(2) }} by</span>
        <span class="payment-method">Learn more</span>
      </div>
      
      <!-- 颜色选项 -->
      <div v-if="product.colors?.length" class="color-options">
        <span class="color-label">Color:</span>
        <div class="color-swatches">
          <div
            v-for="(color, index) in product.colors.slice(0, 4)"
            :key="index"
            class="color-swatch"
            :style="{ backgroundColor: getColorCode(color) }"
            :title="color"
          ></div>
          <span v-if="product.colors.length > 4" class="more-colors">
            +{{ product.colors.length - 4 }}
          </span>
        </div>
      </div>
      
      <!-- 尺寸选项 -->
      <div v-if="product.sizes?.length" class="size-options">
        <span class="size-label">Sizes:</span>
        <div class="size-list">
          <span
            v-for="(size, index) in product.sizes.slice(0, 3)"
            :key="index"
            class="size-item"
          >
            {{ size }}
          </span>
          <span v-if="product.sizes.length > 3" class="more-sizes">
            +{{ product.sizes.length - 3 }}
          </span>
        </div>
      </div>
      
      <!-- 评分 -->
      <div v-if="product.averageRating" class="product-rating">
        <Rating
          :model-value="product.averageRating"
          readonly
          :cancel="false"
        />
        <span class="rating-text">
          {{ product.averageRating.toFixed(1) }} ({{ product.totalReviews }})
        </span>
      </div>
      
      <!-- 库存状态 -->
      <div class="stock-status">
        <span
          v-if="product.stock > 10"
          class="in-stock"
        >
          <i class="pi pi-check-circle"></i>
          In Stock
        </span>
        <span
          v-else-if="product.stock > 0"
          class="low-stock"
        >
          <i class="pi pi-exclamation-triangle"></i>
          Only {{ product.stock }} left
        </span>
        <span
          v-else
          class="out-of-stock"
        >
          <i class="pi pi-times-circle"></i>
          Out of Stock
        </span>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="product-actions">
      <Button
        label="Add to Cart"
        icon="pi pi-shopping-cart"
        @click.stop="addToCart"
        :disabled="product.stock === 0"
        class="add-to-cart-btn"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';
import Rating from 'primevue/rating';
import { computed, ref } from 'vue';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  images: string[];
  colors?: string[];
  sizes?: string[];
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  averageRating?: number;
  totalReviews?: number;
}

interface Props {
  product: Product;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [];
  addToCart: [product: Product];
  toggleFavorite: [product: Product];
  quickView: [product: Product];
}>();

// 响应式数据
const isFavorited = ref(false);

// 计算属性
const discountPercentage = computed(() => {
  if (!props.product.salePrice) return null;
  const discount = ((props.product.price - props.product.salePrice) / props.product.price) * 100;
  return Math.round(discount);
});

const installmentPrice = computed(() => {
  const price = props.product.salePrice || props.product.price;
  return price / 4;
});

// 方法
const getColorCode = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'BLACK': '#000000',
    'WHITE': '#FFFFFF',
    'RED': '#FF0000',
    'BLUE': '#0000FF',
    'GREEN': '#008000',
    'YELLOW': '#FFFF00',
    'PINK': '#FFC0CB',
    'PURPLE': '#800080',
    'ORANGE': '#FFA500',
    'BROWN': '#A52A2A',
    'GRAY': '#808080',
    'GREY': '#808080',
    'NAVY': '#000080',
    'BEIGE': '#F5F5DC',
    'KHAKI': '#F0E68C'
  };
  
  return colorMap[colorName.toUpperCase()] || '#CCCCCC';
};

const addToCart = () => {
  emit('addToCart', props.product);
};

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value;
  emit('toggleFavorite', props.product);
};

const quickView = () => {
  emit('quickView', props.product);
};
</script>

<style scoped>
.product-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.product-image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.sale-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--red-500);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.featured-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--yellow-500);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .quick-actions {
  opacity: 1;
}

.quick-actions .p-button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.quick-actions .p-button.favorited {
  background: var(--red-500);
  border-color: var(--red-500);
  color: white;
}

.product-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sale-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--red-500);
}

.original-price {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.original-price.crossed {
  text-decoration: line-through;
  color: var(--text-color-secondary);
  font-weight: 400;
}

.discount {
  background: var(--red-500);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.installment-info {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.payment-method {
  color: var(--primary-color);
  text-decoration: underline;
  cursor: pointer;
}

.color-options,
.size-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.color-label,
.size-label {
  color: var(--text-color);
  font-weight: 500;
}

.color-swatches {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--surface-border);
  cursor: pointer;
  transition: transform 0.2s;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.more-colors,
.more-sizes {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.size-list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.size-item {
  background: var(--surface-100);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--text-color);
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-text {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.stock-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.in-stock {
  color: var(--green-600);
}

.low-stock {
  color: var(--orange-600);
}

.out-of-stock {
  color: var(--red-600);
}

.product-actions {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
}

.add-to-cart-btn {
  width: 100%;
}

@media (max-width: 768px) {
  .product-info {
    padding: 0.75rem;
  }
  
  .product-name {
    font-size: 0.9rem;
  }
  
  .product-price {
    font-size: 0.9rem;
  }
  
  .quick-actions {
    opacity: 1;
  }
}
</style>