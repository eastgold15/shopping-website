<template>
  <div class="product-detail-page min-h-screen bg-gray-50">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>

    <!-- 商品详情内容 -->
    <div v-else-if="product" class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          <!-- 商品图片区域 -->
          <div class="product-images">
            <!-- 主图 -->
            <div class="main-image-container mb-4">
              <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer" @click="openImageModal">
                <img :src="currentImage" :alt="product.name"
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            </div>

            <!-- 缩略图 -->
            <div class="media-thumbnails" v-if="product.images && product.images.length > 1">
              <div class="grid grid-cols-4 gap-2">
                <div v-for="(image, index) in product.images" :key="index"
                  class="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2"
                  :class="{ 'border-blue-500': currentImage === getImageUrl(image), 'border-transparent': currentImage !== getImageUrl(image) }"
                  @click="setCurrentImage(getImageUrl(image))">
                  <img :src="getImageUrl(image)" :alt="`${product.name} ${index + 1}`"
                    class="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>

          <!-- 商品信息区域 -->
          <div class="product-info">
            <!-- 商品标题和价格 -->
            <div class="mb-6">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ product.name }}</h1>
              <p v-if="product.shortDescription" class="text-gray-600 mb-4">{{ product.shortDescription }}</p>

              <div class="flex items-center gap-4 mb-4">
                <span class="text-3xl font-bold text-gray-900">¥{{ currentPrice }}</span>
                <span v-if="currentComparePrice" class="text-xl text-gray-500 line-through">¥{{ currentComparePrice
                  }}</span>
              </div>

              <!-- 库存状态 -->
              <div class="mb-4">
                <span v-if="currentStock > 0" class="text-green-600 font-medium">现货 {{ currentStock }} 件</span>
                <span v-else class="text-red-600 font-medium">暂时缺货</span>
              </div>
            </div>

            <!-- 颜色选择 -->
            <div v-if="availableColors.length > 0" class="color-selection mb-6">
              <h3 class="font-semibold mb-3">颜色</h3>
              <div class="flex gap-3">
                <button v-for="color in availableColors" :key="color.id || color.value"
                  class="w-10 h-10 rounded-full border-2 transition-all duration-200" :class="{
                    'border-gray-900 ring-2 ring-gray-900 ring-offset-2': selectedColor?.value === color.value,
                    'border-gray-300': selectedColor?.value !== color.value
                  }" :style="{ backgroundColor: color.value }" :title="color.name" @click="selectColor(color)">
                </button>
              </div>
              <p v-if="selectedColor" class="text-sm text-gray-600 mt-2">已选择: {{ selectedColor.name }}</p>
            </div>

            <!-- 尺寸选择 -->
            <div v-if="availableSizes.length > 0" class="size-selection mb-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold">尺寸</h3>
                <div class="flex gap-2">
                  <button v-for="sizeType in sizeTypes" :key="sizeType"
                    class="text-xs px-2 py-1 rounded transition-colors" :class="{
                      'bg-gray-900 text-white': currentSizeType === sizeType,
                      'bg-gray-200 text-gray-700 hover:bg-gray-300': currentSizeType !== sizeType
                    }" @click="currentSizeType = sizeType">
                    {{ sizeType.toUpperCase() }}
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <button v-for="size in availableSizes" :key="size.id || size.value"
                  class="py-3 px-4 border rounded-lg text-center transition-all duration-200" :class="{
                    'border-gray-900 bg-gray-900 text-white': selectedSize?.value === size.value,
                    'border-gray-300 hover:border-gray-400': selectedSize?.value !== size.value && size.isAvailable,
                    'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed': !size.isAvailable
                  }" :disabled="!size.isAvailable" @click="selectSize(size)">
                  {{ getSizeByType(size, currentSizeType) }}
                </button>
              </div>
              <p v-if="selectedSize" class="text-sm text-gray-600 mt-2">已选择: {{ selectedSize.name }}</p>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons mb-6">
              <div class="flex gap-3 mb-3">
                <button
                  class="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  :disabled="!canAddToCart" @click="addToCart">
                  加入购物车
                </button>
                <button
                  class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  :disabled="!canAddToCart" @click="buyNow">
                  立即购买
                </button>
              </div>

              <div class="flex gap-3">
                <button
                  class="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  @click="toggleFavorite">
                  <i :class="isFavorited ? 'i-ic:baseline-favorite text-red-500' : 'i-ic:baseline-favorite-border'"></i>
                  {{ isFavorited ? '已收藏' : '收藏' }}
                </button>
                <button
                  class="flex-1 border border-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  @click="shareProduct">
                  <i class="i-ic:baseline-share"></i>
                  分享
                </button>
              </div>
            </div>

            <!-- 商品描述 -->
            <div v-if="product.description" class="product-description">
              <h3 class="font-semibold mb-3">商品描述</h3>
              <div class="text-gray-700 leading-relaxed">
                <p :class="{ 'line-clamp-3': !showFullDescription }">
                  {{ product.description }}
                </p>
                <button v-if="product.description.length > 100" class="text-blue-600 underline hover:text-blue-800 mt-2"
                  @click="showFullDescription = !showFullDescription">
                  {{ showFullDescription ? '收起' : '查看更多' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品未找到 -->
    <div v-else class="flex flex-col items-center justify-center min-h-screen">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">商品未找到</h2>
        <p class="text-gray-600 mb-6">抱歉，您查找的商品不存在或已下架。</p>
        <button @click="$router.push('/')"
          class="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
          返回首页
        </button>
      </div>
    </div>

    <!-- 图片放大模态框 -->
    <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click="closeImageModal">
      <div class="max-w-4xl max-h-4xl p-4">
        <img :src="currentImage" :alt="product?.name" class="max-w-full max-h-full object-contain" />
      </div>
      <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300" @click="closeImageModal">
        <i class="i-ic:baseline-close"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFrontApi } from "@frontend/utils/handleApi";

// 路由相关
const route = useRoute();

const frontApi = useFrontApi();

// 响应式数据
const product = ref<any>(null);
const loading = ref(true);

// 商品选择状态
const selectedColor = ref<any>(null);
const selectedSize = ref<any>(null);
const selectedSku = ref<any>(null);
const currentImage = ref<string>("");
const currentSizeType = ref<"uk" | "eu" | "us">("uk");
const sizeTypes = ["uk", "eu", "us"] as const;

// UI状态
const showFullDescription = ref(false);
const showImageModal = ref(false);
const isFavorited = ref(false);

// 计算属性
const availableColors = computed(() => {
	if (!product.value) return [];

	// 如果商品有多规格，从SKU中获取颜色
	if (product.value.hasVariants && product.value.skus) {
		const colors = product.value.skus
			.filter((sku: any) => sku.colorValue && sku.colorName)
			.map((sku: any) => ({
				id: sku.colorId,
				name: sku.colorName,
				value: sku.colorValue,
				imageUrl:
					sku.images?.find((img: any) => img.isMain)?.url ||
					(sku.images && sku.images.length > 0 ? sku.images[0].url : null),
			}));

		// 去重
		const uniqueColors = Array.from(
			new Map(colors.map((color) => [color.value, color])).values(),
		);

		return uniqueColors;
	}

	// 否则从商品的colors字段获取
	if (product.value.colors && Array.isArray(product.value.colors)) {
		return product.value.colors.map((color: any) => ({
			id: color.id,
			name: color.name,
			value: color.hexCode || color.value,
			imageUrl: color.imageUrl,
		}));
	}

	return [];
});

const availableSizes = computed(() => {
	if (!product.value) return [];

	// 如果商品有多规格，从SKU中获取尺寸
	if (product.value.hasVariants && product.value.skus) {
		// 如果已选择颜色，只显示该颜色的可用尺寸
		let skus = product.value.skus;
		if (selectedColor.value) {
			skus = skus.filter(
				(sku: any) => sku.colorValue === selectedColor.value.value,
			);
		}

		const sizes = skus
			.filter((sku: any) => sku.sizeValue && sku.sizeName)
			.map((sku: any) => ({
				id: sku.sizeId,
				name: sku.sizeName,
				value: sku.sizeValue,
				isAvailable: sku.stock > 0,
				ukSize: sku.ukSize,
				euSize: sku.euSize,
				usSize: sku.usSize,
			}));

		// 去重
		const uniqueSizes = Array.from(
			new Map(sizes.map((size) => [size.value, size])).values(),
		);

		return uniqueSizes;
	}

	// 否则从商品的sizes字段获取
	if (product.value.sizes && Array.isArray(product.value.sizes)) {
		return product.value.sizes.map((size: any) => ({
			id: size.id,
			name: size.name,
			value: size.name,
			isAvailable: size.isAvailable !== undefined ? size.isAvailable : true,
			ukSize: size.ukSize,
			euSize: size.euSize,
			usSize: size.usSize,
		}));
	}

	return [];
});

const currentPrice = computed(() => {
	if (selectedSku.value) {
		return selectedSku.value.price;
	}
	return product.value?.price || "0";
});

const currentComparePrice = computed(() => {
	if (selectedSku.value && selectedSku.value.comparePrice) {
		return selectedSku.value.comparePrice;
	}
	return product.value?.comparePrice;
});

const currentStock = computed(() => {
	if (selectedSku.value) {
		return selectedSku.value.stock;
	}
	return product.value?.stock || 0;
});

const canAddToCart = computed(() => {
	if (!product.value) return false;

	// 检查库存
	if (currentStock.value <= 0) {
		return false;
	}

	// 如果商品有多规格，必须选择颜色和尺寸
	if (product.value.hasVariants) {
		if (availableColors.value.length > 0 && !selectedColor.value) return false;
		if (availableSizes.value.length > 0 && !selectedSize.value) return false;
	}

	return true;
});

// 方法
const setCurrentImage = (imageUrl: string) => {
	currentImage.value = imageUrl;
};

// 获取图片URL的辅助方法
const getImageUrl = (image: any) => {
	if (typeof image === "string") {
		return image.replace(/`/g, ""); // 移除反引号
	}
	if (image && image.url) {
		return image.url.replace(/`/g, ""); // 移除反引号
	}
	return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"; // 默认占位图
};

const selectColor = (color: any) => {
	selectedColor.value = color;
	// 重置尺寸选择
	selectedSize.value = null;

	// 如果该颜色有对应的图片，切换到该图片
	if (color.imageUrl) {
		setCurrentImage(color.imageUrl);
	} else if (product.value.hasVariants && product.value.skus) {
		// 查找该颜色的SKU并设置主图
		const colorSku = product.value.skus.find(
			(sku: any) =>
				sku.colorValue === color.value && sku.images && sku.images.length > 0,
		);
		if (colorSku) {
			const mainImage =
				colorSku.images.find((img: any) => img.isMain) || colorSku.images[0];
			if (mainImage) {
				setCurrentImage(mainImage.url);
			}
		}
	}

	// 更新选中的SKU
	updateSelectedSku();
};

const selectSize = (size: any) => {
	selectedSize.value = size;
	// 更新选中的SKU
	updateSelectedSku();
};

const updateSelectedSku = () => {
	if (!product.value || !product.value.hasVariants || !product.value.skus) {
		selectedSku.value = null;
		return;
	}

	// 根据选中的颜色和尺寸查找SKU
	const matchedSku = product.value.skus.find((sku: any) => {
		const colorMatch =
			!selectedColor.value || sku.colorValue === selectedColor.value.value;
		const sizeMatch =
			!selectedSize.value || sku.sizeValue === selectedSize.value.value;
		return colorMatch && sizeMatch;
	});

	selectedSku.value = matchedSku || null;

	// 如果找到SKU且有图片，更新当前图片
	if (matchedSku && matchedSku.images && matchedSku.images.length > 0) {
		const mainImage =
			matchedSku.images.find((img: any) => img.isMain) || matchedSku.images[0];
		if (mainImage) {
			setCurrentImage(mainImage.url);
		}
	}
};

const getSizeByType = (size: any, type: string) => {
	switch (type) {
		case "uk":
			return size.ukSize || size.name;
		case "eu":
			return size.euSize || size.name;
		case "us":
			return size.usSize || size.name;
		default:
			return size.name;
	}
};

const addToCart = () => {
	if (!canAddToCart.value) {
		return;
	}

	// 构建购物车项目
	const cartItem = {
		productId: product.value?.id,
		name: product.value?.name,
		price: currentPrice.value,
		image: currentImage.value,
		color: selectedColor.value?.name,
		size: selectedSize.value?.name,
		skuId: selectedSku.value?.id,
		quantity: 1,
	};

	// 这里应该调用购物车API或状态管理
	console.log("添加到购物车:", cartItem);

	// 显示成功提示
	alert("商品已添加到购物车！");
};

const buyNow = () => {
	if (!canAddToCart.value) {
		return;
	}

	// 构建订单项目
	const orderItem = {
		productId: product.value?.id,
		name: product.value?.name,
		price: currentPrice.value,
		image: currentImage.value,
		color: selectedColor.value?.name,
		size: selectedSize.value?.name,
		skuId: selectedSku.value?.id,
		quantity: 1,
	};

	// 这里应该跳转到结算页面
	console.log("立即购买:", orderItem);
	alert("跳转到结算页面...");
};

const toggleFavorite = () => {
	isFavorited.value = !isFavorited.value;

	// 这里应该调用收藏API
	console.log(isFavorited.value ? "添加到收藏" : "取消收藏", product.value?.id);
	alert(isFavorited.value ? "已添加到收藏！" : "已取消收藏！");
};

const shareProduct = () => {
	// 分享功能
	if (navigator.share) {
		navigator.share({
			title: product.value?.name,
			text: product.value?.shortDescription,
			url: window.location.href,
		});
	} else {
		// 复制链接到剪贴板
		navigator.clipboard.writeText(window.location.href);
		alert("商品链接已复制到剪贴板！");
	}
};

const openImageModal = () => {
	showImageModal.value = true;
};

const closeImageModal = () => {
	showImageModal.value = false;
};

// 获取商品数据
const fetchProduct = async (productId: string) => {
	try {
		loading.value = true;

		// 获取商品详情
		const result = await frontApi.products.getById(Number(productId));

		if (result && result.data) {
			product.value = result.data;

			// 如果商品有多规格，获取SKU信息
			if (product.value.hasVariants) {
				const skuResult = await frontApi.skus.getByProductId(Number(productId));
				if (skuResult && skuResult.data) {
					// 处理SKU图片数据，确保格式正确
					product.value.skus = skuResult.data.map((sku: any) => ({
						...sku,
						// 确保images字段格式正确
						images: Array.isArray(sku.images) ? sku.images : [],
					}));
				}
			}

			// 设置默认图片
			if (product.value.images && product.value.images.length > 0) {
				const mainImage = product.value.images.find((img: any) => img.isMain);
				currentImage.value = mainImage
					? mainImage.url
					: product.value.images[0].url;
			}
		} else {
			product.value = null;
		}
	} catch (err) {
		console.error("Error fetching product:", err);
		product.value = null;
	} finally {
		loading.value = false;
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
.line-clamp-3 {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
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
}
</style>