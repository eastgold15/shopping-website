<template>
  <div class="product-detail-page min-h-screen bg-gray-50">
    <!-- 商品详情主体 -->
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：商品图片和视频区域 -->
        <div class="product-media">
          <!-- 主图显示区域 -->
          <div class="main-image-container mb-4">
            <div class="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
              <!-- 图片显示 -->
              <img :src="currentImage" :alt="product?.name"
                class="w-full h-full object-cover cursor-zoom-in transition-all duration-300 ease-in-out"
                @click="openImageModal" />
            </div>
          </div>

          <!-- 缩略图选择区域 -->
          <div class="media-thumbnails" v-if="product?.images && product.images.length > 1">
            <div class="grid grid-cols-5 gap-2">
              <!-- 商品图片缩略图 -->
              <div v-for="(image, index) in product.images" :key="index"
                class="aspect-square bg-white rounded-lg overflow-hidden cursor-pointer border-2 transition-all" :class="{
                  'border-blue-500': currentImage === getImageUrl(image),
                  'border-gray-200 hover:border-gray-300': currentImage !== getImageUrl(image)
                }" @click="setCurrentImage(getImageUrl(image))">
                <img :src="getImageUrl(image)" :alt="image.alt || product.name" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：商品信息区域 -->
        <div class="product-info">
          <!-- 商品标题 -->
          <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
            {{ product?.name }}
          </h1>

          <!-- 价格信息 -->
          <div class="price-section mb-6">
            <div class="flex items-center gap-4 mb-2">
              <span class="text-3xl font-bold text-gray-900">
                ¥{{ parseFloat(product?.price || '0').toFixed(2) }}
              </span>
              <span v-if="product?.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)"
                class="text-xl text-gray-500 line-through">
                ¥{{ parseFloat(product.comparePrice).toFixed(2) }}
              </span>
              <span v-if="product?.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price)"
                class="text-lg font-semibold text-red-600">
                省¥{{ (parseFloat(product.comparePrice) - parseFloat(product.price)).toFixed(2) }}
              </span>
            </div>
            <!-- 库存信息 -->
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <span v-if="product?.stock && product.stock > 0" class="text-green-600">
                库存充足 ({{ product.stock }}件)
              </span>
              <span v-else class="text-red-600">暂时缺货</span>
            </div>
            <!-- 分类信息 -->
            <div v-if="product?.categoryName" class="text-sm text-gray-600 mt-1">
              分类: {{ product.categoryName }}
            </div>
          </div>

          <!-- 颜色选择 -->
          <div v-if="product?.colors?.length > 0" class="color-selection mb-6">
            <h3 class="text-lg font-semibold mb-3">颜色: {{ selectedColor?.name || '请选择颜色' }}</h3>
            <div class="flex gap-3">
              <div v-for="color in product.colors" :key="color.id"
                class="w-12 h-12 rounded-full border-2 cursor-pointer transition-all relative" :class="{
                  'border-blue-500 ring-2 ring-blue-200': selectedColor?.id === color.id,
                  'border-gray-300 hover:border-gray-400': selectedColor?.id !== color.id
                }" :style="{ backgroundColor: color.hexCode }" :title="color.name" @click="selectColor(color)">
                <div v-if="selectedColor?.id === color.id"
                  class="absolute inset-0 rounded-full flex items-center justify-center">
                  <i class="i-ic:baseline-check text-white text-sm drop-shadow-lg"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- 尺寸选择 -->
          <div v-if="product?.sizes?.length > 0" class="size-selection mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold">尺寸: {{ selectedSize?.name || '请选择尺寸' }}</h3>
              <button class="text-sm text-blue-600 underline hover:text-blue-800">
                尺寸表
              </button>
            </div>

            <!-- 尺寸类型切换 -->
            <div class="size-type-tabs mb-4">
              <div class="flex border-b border-gray-200">
                <button v-for="sizeType in sizeTypes" :key="sizeType"
                  class="px-4 py-2 text-sm font-medium border-b-2 transition-colors" :class="{
                    'border-blue-500 text-blue-600': currentSizeType === sizeType,
                    'border-transparent text-gray-500 hover:text-gray-700': currentSizeType !== sizeType
                  }" @click="currentSizeType = sizeType">
                  {{ sizeType.toUpperCase() }}
                </button>
              </div>
            </div>

            <!-- 尺寸选项 -->
            <div class="grid grid-cols-4 gap-3">
              <button v-for="size in product.sizes" :key="size.id"
                class="py-3 px-4 border rounded-lg text-center transition-all" :class="{
                  'border-blue-500 bg-blue-50 text-blue-700': selectedSize?.id === size.id,
                  'border-gray-300 hover:border-gray-400': selectedSize?.id !== size.id && size.isAvailable,
                  'border-gray-200 text-gray-400 cursor-not-allowed': !size.isAvailable
                }" :disabled="!size.isAvailable" @click="selectSize(size)">
                <div class="font-medium">{{ size.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ getSizeByType(size, currentSizeType) }}
                </div>
                <div v-if="!size.isAvailable" class="text-xs text-red-500 mt-1">缺货</div>
              </button>
            </div>

            <p v-if="!selectedSize" class="text-sm text-gray-600 mt-2">
              请选择尺寸以继续购买
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons mb-8">
            <div class="flex gap-4 mb-4">
              <!-- 加入购物袋按钮 -->
              <button
                class="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                :disabled="!canAddToCart" @click="addToCart">
                <i class="i-ic:baseline-shopping-cart"></i>
                {{ !canAddToCart ? '请选择规格' : '加入购物车' }}
              </button>

              <!-- 立即购买按钮 -->
              <button
                class="flex-1 bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                :disabled="!canAddToCart" @click="buyNow">
                {{ !canAddToCart ? '请选择规格' : '立即购买' }}
              </button>
            </div>

            <div class="flex gap-4">
              <!-- 收藏按钮 -->
              <button
                class="flex-1 border border-gray-300 py-3 px-6 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                :class="{ 'text-red-500 border-red-300 bg-red-50': isFavorited }" @click="toggleFavorite">
                <i class="i-ic:baseline-favorite" :class="{ 'text-red-500': isFavorited }"></i>
                {{ isFavorited ? '已收藏' : '收藏' }}
              </button>

              <!-- 分享按钮 -->
              <button
                class="flex-1 border border-gray-300 py-3 px-6 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                @click="shareProduct">
                <i class="i-ic:baseline-share"></i>
                分享
              </button>
            </div>

            <!-- 额外信息 -->
            <div class="text-sm text-gray-600 space-y-1 mt-4">
              <p>✓ 免费店内退货</p>
              <p>✓ 线上下单，店内自提享9折优惠</p>
              <p>✓ 购买可获得 {{ product?.rewardPoints || 0 }} 积分</p>
              <p class="text-xs">30积分 = ¥1优惠券</p>
            </div>
          </div>

          <!-- 评分信息 -->
          <div v-if="product?.averageRating" class="rating-section mb-8">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex">
                <i v-for="star in 5" :key="star" class="i-ic:baseline-star text-yellow-400" :class="{
                  'text-yellow-400': star <= Math.floor(product.averageRating),
                  'text-gray-300': star > Math.floor(product.averageRating)
                }"></i>
              </div>
              <span class="text-sm text-gray-600">
                {{ product.averageRating }} out of 5 Customer Rating
              </span>
            </div>
            <div class="text-sm text-blue-600">
              <span class="underline cursor-pointer hover:text-blue-800">Be the first to write a review</span>
              |
              <span class="underline cursor-pointer hover:text-blue-800">Be the first to ask a question</span>
            </div>
          </div>

          <!-- 商品描述 -->
          <div class="product-description">
            <h3 class="text-lg font-semibold mb-3">商品描述</h3>
            <p class="text-gray-700 leading-relaxed mb-4">
              {{ product?.shortDescription || product?.description }}
            </p>

            <!-- 详细描述 -->
            <div v-if="showFullDescription" class="detailed-description">
              <h4 class="font-semibold mb-2">详细描述</h4>
              <p class="text-gray-700 leading-relaxed mb-4">
                {{ product?.description }}
              </p>

              <!-- 商品信息 -->
              <div class="product-info-details mb-4">
                <h4 class="font-semibold mb-2">商品信息</h4>
                <dl class="grid grid-cols-1 gap-2">
                  <div v-if="product?.sku" class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">SKU:</dt>
                    <dd class="text-gray-900">{{ product.sku }}</dd>
                  </div>
                  <div v-if="product?.barcode" class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">条形码:</dt>
                    <dd class="text-gray-900">{{ product.barcode }}</dd>
                  </div>
                  <div v-if="product?.weight && parseFloat(product.weight) > 0"
                    class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">重量:</dt>
                    <dd class="text-gray-900">{{ product.weight }}kg</dd>
                  </div>
                  <div v-if="product?.cost && parseFloat(product.cost) > 0"
                    class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">成本价:</dt>
                    <dd class="text-gray-900">¥{{ parseFloat(product.cost).toFixed(2) }}</dd>
                  </div>
                  <div class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">创建时间:</dt>
                    <dd class="text-gray-900">{{ formatDate(product?.createdAt) }}</dd>
                  </div>
                  <div class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">更新时间:</dt>
                    <dd class="text-gray-900">{{ formatDate(product?.updatedAt) }}</dd>
                  </div>
                </dl>
              </div>

              <!-- 商品规格 -->
              <div v-if="product?.specifications && Object.keys(product.specifications).length > 0"
                class="specifications mb-4">
                <h4 class="font-semibold mb-2">商品规格</h4>
                <dl class="grid grid-cols-1 gap-2">
                  <div v-for="(value, key) in product.specifications" :key="key"
                    class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">{{ key }}:</dt>
                    <dd class="text-gray-900">{{ value }}</dd>
                  </div>
                </dl>
              </div>

              <!-- 护理说明 -->
              <div v-if="product?.careInstructions" class="care-instructions">
                <h4 class="font-semibold mb-2">护理说明</h4>
                <p class="text-gray-700">{{ product.careInstructions }}</p>
              </div>
            </div>

            <button v-if="product?.description" class="text-blue-600 underline hover:text-blue-800 mt-2"
              @click="showFullDescription = !showFullDescription">
              {{ showFullDescription ? '收起' : '查看更多' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Banner广告区域 -->
    <div class="banner-ads-section mt-8 mb-8">
      <BannerAds position="product-detail" :show-title="false" height="150px" layout="horizontal" :gap="'1rem'"
        :rounded="true" :shadow="true" :show-empty="false" />
    </div>

    <!-- 相关推荐 -->
    <div class="related-products bg-white py-12" v-if="relatedProducts.length > 0">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-8">您可能还喜欢</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="relatedProduct in relatedProducts" :key="relatedProduct.id"
            class="product-card group cursor-pointer" @click="navigateToProduct(relatedProduct.id)">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              <img :src="getProductImage(relatedProduct)" :alt="getProductName(relatedProduct)"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h3 class="font-medium text-gray-900 mb-1 line-clamp-2">
              {{ getProductName(relatedProduct) }}
            </h3>
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold text-gray-900">
                ¥{{ getProductPrice(relatedProduct) }}
              </span>
              <span v-if="getProductComparePrice(relatedProduct)" class="text-sm text-gray-500 line-through">
                ¥{{ getProductComparePrice(relatedProduct) }}
              </span>
            </div>
            <p v-if="getProductDescription(relatedProduct)" class="text-sm text-gray-600 mt-1 line-clamp-2">
              {{ getProductDescription(relatedProduct) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片放大模态框 -->
    <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click="closeImageModal">
      <div class="max-w-4xl max-h-4xl p-4">
        <img :src="currentImage" :alt="product?.title" class="max-w-full max-h-full object-contain" />
      </div>
      <button class="absolute top-4 right-4 text-white text-2xl" @click="closeImageModal">
        <i class="i-ic:baseline-close"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectProductDetailVo } from "@backend/types";
import { useFrontApi } from "@frontend/utils/handleApi";
import BannerAds from "../components/BannerAds.vue";



// 路由相关
const route = useRoute();
const router = useRouter();

// 响应式数据
const product = ref<SelectProductDetailVo | null>(null);
const relatedProducts = ref<SelectProductDetailVo[]>([]);
const loading = ref(true);

// 商品选择状态
const selectedColor = ref<any>(null);
const selectedSize = ref<any>(null);
const currentImage = ref<string>("");
const currentSizeType = ref<"uk" | "eu" | "us">("uk");
const sizeTypes = ["uk", "eu", "us"] as const;

// UI状态
const showFullDescription = ref(false);
const showImageModal = ref(false);
const isFavorited = ref(false);

// 计算属性
const canAddToCart = computed(() => {
  if (!product.value) return false;

  // 检查库存
  if (!product.value?.stock || product.value.stock <= 0) {
    return false;
  }

  // 如果有颜色选项，必须选择颜色
  if (product.value.colors?.length > 0 && !selectedColor.value) return false;

  // 如果有尺寸选项，必须选择尺寸
  if (product.value.sizes?.length > 0 && !selectedSize.value) return false;

  return true;
});

// 方法
const setCurrentImage = (imageUrl: string) => {
  currentImage.value = imageUrl;
};

// 获取图片URL的辅助方法
const getImageUrl = (image: any) => {
  if (typeof image === 'string') {
    return image.replace(/`/g, ''); // 移除反引号
  }
  if (image && image.url) {
    return image.url.replace(/`/g, ''); // 移除反引号
  }
  return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'; // 默认占位图
};

// 格式化日期的辅助方法
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const selectColor = (color: any) => {
  selectedColor.value = color;
  // 如果该颜色有对应的图片，切换到该图片
  if (color.imageUrl) {
    setCurrentImage(color.imageUrl);
  }
};

const selectSize = (size: any) => {
  if (size.isAvailable) {
    selectedSize.value = size;
  }
};

const getSizeByType = (size: any, type: string) => {
  switch (type) {
    case 'uk':
      return size.ukSize || size.name;
    case 'eu':
      return size.euSize || size.name;
    case 'us':
      return size.usSize || size.name;
    default:
      return size.name;
  }
};
// const selectColor = (color: string) => {
//   selectedColor.value = color
//   // 如果该颜色有对应的图片，切换到该图片
//   if (color.imageUrl) {
//     setCurrentImage(color.imageUrl)
//   }
// }

// const selectSize = (size: string) => {
//   if (size.isAvailable) {
//     selectedSize.value = size
//   }
// }

// const getSizeByType = (size: string, type: string) => {
//   switch (type) {
//     case 'uk':
//       return size.ukSize || size.name
//     case 'eu':
//       return size.euSize || size.name
//     case 'us':
//       return size.usSize || size.name
//     default:
//       return size.name
//   }
// }

const addToCart = () => {
  if (!canAddToCart.value) {
    return;
  }

  // 构建购物车项目
  const cartItem = {
    productId: product.value?.id,
    name: product.value?.name,
    price: product.value?.price,
    image: currentImage.value,
    color: selectedColor.value?.name,
    size: selectedSize.value?.name,
    quantity: 1
  };

  // 这里应该调用购物车API或状态管理
  console.log('添加到购物车:', cartItem);

  // 显示成功提示
  alert('商品已添加到购物车！');
};

const buyNow = () => {
  if (!canAddToCart.value) {
    return;
  }

  // 构建订单项目
  const orderItem = {
    productId: product.value?.id,
    name: product.value?.name,
    price: product.value?.price,
    image: currentImage.value,
    color: selectedColor.value?.name,
    size: selectedSize.value?.name,
    quantity: 1
  };

  // 这里应该跳转到结算页面
  console.log('立即购买:', orderItem);
  alert('跳转到结算页面...');
};

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value;

  // 这里应该调用收藏API
  console.log(isFavorited.value ? '添加到收藏' : '取消收藏', product.value?.id);
  alert(isFavorited.value ? '已添加到收藏！' : '已取消收藏！');
};

const shareProduct = () => {
  // 分享功能
  if (navigator.share) {
    navigator.share({
      title: product.value?.name,
      text: product.value?.shortDescription,
      url: window.location.href
    });
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href);
    alert('商品链接已复制到剪贴板！');
  }
};

const openImageModal = () => {
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
};

// 相关商品数据处理辅助函数
const getProductImage = (product: any) => {
  if (product.images && product.images.length > 0) {
    return typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
  }
  return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
};

const getProductName = (product: any) => {
  return product.name || product.title || '商品名称';
};

const getProductPrice = (product: any) => {
  if (product.price) {
    return typeof product.price === 'string' ? product.price : product.price.currentPrice || product.price;
  }
  return '0.00';
};

const getProductComparePrice = (product: any) => {
  if (product.comparePrice) {
    return product.comparePrice;
  }
  if (product.price && typeof product.price === 'object' && product.price.originalPrice) {
    return product.price.originalPrice > getProductPrice(product) ? product.price.originalPrice : null;
  }
  return null;
};

const getProductDescription = (product: any) => {
  return product.shortDescription || product.description || '';
};

const navigateToProduct = (productId: string) => {
  router.push(`/product/${productId}`);
};

const api = useFrontApi()
// 获取商品数据
const fetchProduct = async (productId: string) => {
  try {
    loading.value = true;
    // 使用API调用
    const res = await api.products.getById(Number(productId));
    if (!res) {
      return;
    }

    if (res.code === 200) {
      product.value = res.data as any;

      // 设置默认图片
      if (product.value?.images && product.value.images.length > 0) {
        currentImage.value = getImageUrl(product.value.images[0]);
      }
    } else {
      // 如果API调用失败，使用模拟数据作为后备
      console.warn("API调用失败，使用模拟数据:", res.message);
      // 设置模拟数据
      product.value = {
        id: Number(productId),
        name: "经典棉质T恤",
        slug: "classic-cotton-tshirt",
        description: "这是一款经典的棉质T恤，采用100%纯棉材质制作，舒适透气，适合日常穿着。",
        shortDescription: "经典棉质T恤，舒适透气，日常必备",
        price: "89.00",
        comparePrice: "129.00",
        stock: 50,
        images: [
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
          "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800",
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"
        ],
        colors: [
          { id: 1, name: "白色", hexCode: "#FFFFFF" },
          { id: 2, name: "黑色", hexCode: "#000000" },
          { id: 3, name: "灰色", hexCode: "#808080" }
        ],
        sizes: [
          { id: 1, name: "S", isAvailable: true, ukSize: "S", euSize: "36", usSize: "S" },
          { id: 2, name: "M", isAvailable: true, ukSize: "M", euSize: "38", usSize: "M" },
          { id: 3, name: "L", isAvailable: true, ukSize: "L", euSize: "40", usSize: "L" },
          { id: 4, name: "XL", isAvailable: false, ukSize: "XL", euSize: "42", usSize: "XL" }
        ],
        averageRating: 4.5,
        rewardPoints: 89,
        specifications: [
          { name: "材质", value: "100%纯棉" },
          { name: "产地", value: "中国" },
          { name: "洗涤方式", value: "机洗" }
        ],
        careInstructions: [
          "机洗，水温不超过30°C",
          "不可漂白",
          "低温熨烫",
          "不可干洗"
        ],
        fullDescription: "这款经典棉质T恤采用优质100%纯棉面料，经过精心设计和制作。面料柔软舒适，透气性好，适合各种场合穿着。简约的设计风格，经典的剪裁，让您在任何时候都能展现出优雅的气质。无论是日常休闲还是运动健身，都是您的理想选择。"
      } as any;

      // 设置默认图片
      if (product.value?.images && product.value.images.length > 0) {
        currentImage.value = product.value.images[0] as any;
      }
    }

    // 获取相关商品
    await fetchRelatedProducts();
  } catch (err) {
    console.error("Error fetching product:", err);
    // 错误时也设置模拟数据
    product.value = {
      id: Number(productId),
      name: "经典棉质T恤",
      price: "89.00",
      comparePrice: "129.00",
      stock: 50,
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
      shortDescription: "经典棉质T恤，舒适透气，日常必备"
    } as any;
    currentImage.value = product.value.images[0] as any;
  } finally {
    loading.value = false;
  }
};

// 获取相关商品
const fetchRelatedProducts = async () => {
  try {
    // 调用API获取相关商品
    const res = await api.products.list({ page: 1, limit: 4 });
    if (res && res.code === 200) {
      // 过滤掉当前商品
      relatedProducts.value = res.data?.items.filter((item: any) => item.id !== product.value?.id).slice(0, 4);
    } else {
      // 使用模拟数据
      relatedProducts.value = [
        {
          id: "2",
          title: "经典牛仔裤",
          price: {
            currentPrice: 199.00,
            originalPrice: 259.00,
            currency: "CNY",
          },
          images: [
            {
              id: "1",
              url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
              alt: "经典牛仔裤",
              isMain: true,
              sortOrder: 1,
            },
          ],
        },
        {
          id: "3",
          title: "休闲衬衫",
          price: {
            currentPrice: 159.00,
            originalPrice: 199.00,
            currency: "CNY",
          },
          images: [
            {
              id: "1",
              url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
              alt: "休闲衬衫",
              isMain: true,
              sortOrder: 1,
            },
          ],
        },
        {
          id: "4",
          title: "运动鞋",
          price: {
            currentPrice: 299.00,
            originalPrice: 399.00,
            currency: "CNY",
          },
          images: [
            {
              id: "1",
              url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
              alt: "运动鞋",
              isMain: true,
              sortOrder: 1,
            },
          ],
        },
        {
          id: "5",
          title: "棒球帽",
          price: {
            currentPrice: 89.00,
            originalPrice: 119.00,
            currency: "CNY",
          },
          images: [
            {
              id: "1",
              url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
              alt: "棒球帽",
              isMain: true,
              sortOrder: 1,
            },
          ],
        },
      ] as Product[];
    }
  } catch (err) {
    console.error("Error fetching related products:", err);
    // 错误时使用模拟数据
    relatedProducts.value = [
      {
        id: "2",
        title: "相关商品1",
        price: {
          currentPrice: 99.00,
          originalPrice: 129.00,
          currency: "CNY",
        },
        images: [
          {
            id: "1",
            url: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800",
            alt: "相关商品1",
            isMain: true,
            sortOrder: 1,
          },
        ],
      },
      {
        id: "3",
        title: "相关商品2",
        price: {
          currentPrice: 79.00,
          originalPrice: 99.00,
          currency: "CNY",
        },
        images: [
          {
            id: "1",
            url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
            alt: "相关商品2",
            isMain: true,
            sortOrder: 1,
          },
        ],
      }
    ] as Product[];
  }
};

// 组件挂载时获取商品数据
onMounted(() => {
  const productId = route.params.id as string;
  if (productId) {
    fetchProduct(productId);
  }
});
</script>

<style scoped>
/* 自定义样式 */
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .product-detail-page {
    padding: 1rem;
  }

  .grid.grid-cols-1.lg\:grid-cols-2 {
    gap: 1.5rem;
  }

  .main-image-container {
    margin-bottom: 1rem;
  }

  .media-thumbnails .grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .size-selection .grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .related-products .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>