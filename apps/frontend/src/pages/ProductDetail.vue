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
              <!-- 视频播放器 -->
              <video v-if="isVideoMode && currentVideo" :src="currentVideo"
                class="w-full h-full object-cover cursor-zoom-in" controls :poster="currentImage"
                @click="openImageModal">
                您的浏览器不支持视频播放。
              </video>
              <!-- 图片显示 -->
              <img v-else :src="currentImage" :alt="product?.name"
                class="w-full h-full object-cover cursor-zoom-in transition-all duration-300 ease-in-out"
                @click="openImageModal" />
            </div>
          </div>

          <!-- 缩略图和视频选择区域 -->
          <div class="media-thumbnails">
            <div class="grid grid-cols-5 gap-2">
              <!-- 商品图片缩略图 -->
              <div v-for="(url) in product?.images" :key="url"
                class="aspect-square bg-white rounded-lg overflow-hidden cursor-pointer border-2 transition-all" :class="{
                  'border-blue-500': currentImage === url,
                  'border-gray-200 hover:border-gray-300': currentImage !== url
                }" @click="setCurrentImage(url)">
                <img :src="url" class="w-full h-full object-cover" />
              </div>

              <!-- 视频缩略图 -->
              <!-- <div v-for="video in product?.videos" :key="video"
                class="aspect-square bg-white rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative"
                :class="{
                  'border-blue-500': isVideoMode && currentVideo === video.url,
                  'border-gray-200 hover:border-gray-300': !isVideoMode! && !currentVideo !=== !video.url
                }" @click="setCurrentVideo(video.url, video.thumbnail)">
                <img :src="video.thumbnail" :alt="video.title" class="w-full h-full object-cover" />
           
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <i class="i-ic:baseline-play-arrow text-white text-lg"></i>
                  </div>
                </div>
              </div> -->
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
                ${{ product?.price }}
              </span>
              <span v-if="product?.comparePrice && product?.comparePrice > product?.price"
                class="text-xl text-gray-500 line-through">
                ${{ product?.comparePrice }}
              </span>
            </div>


          </div>

          <!-- 颜色选择 -->
          <div v-if="product?.colors?.length" class="color-selection mb-6">
            <h3 class="text-lg font-semibold mb-3">Color: {{ selectedColor?.name || 'Select a color' }}</h3>
            <div class="flex gap-3">
              <div v-for="color in product.colors" :key="color"
                class="w-12 h-12 rounded-full border-2 cursor-pointer transition-all" :class="{
                  'border-gray-900 ring-2 ring-gray-300': selectedColor?.id === color.id,
                  'border-gray-300 hover:border-gray-400': selectedColor?.id !== color.id
                }" :style="{ backgroundColor: color.hexCode }" :title="color.name" @click="selectColor(color)"></div>
            </div>
          </div>

          <!-- 尺寸选择 -->
          <div v-if="product?.sizes?.length" class="size-selection mb-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold">Size:</h3>
              <button class="text-sm text-blue-600 underline hover:text-blue-800">
                Size Chart
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
                  'border-gray-900 bg-gray-900 text-white': selectedSize?.id === size.id,
                  'border-gray-300 hover:border-gray-400': selectedSize?.id !== size.id && size.isAvailable,
                  'border-gray-200 text-gray-400 cursor-not-allowed': !size.isAvailable
                }" :disabled="!size.isAvailable" @click="selectSize(size)">
                <div class="font-medium">{{ size.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ getSizeByType(size, currentSizeType) }}
                </div>
              </button>
            </div>

            <p v-if="!selectedSize" class="text-sm text-gray-600 mt-2">
              Choose a size to continue, Selection will refresh the page with new results
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons mb-8">
            <div class="flex gap-4 mb-4">
              <!-- 加入购物袋按钮 -->
              <button
                class="flex-1 bg-gray-900 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                :disabled="!canAddToCart" @click="addToCart">
                Add to Bag
              </button>

              <!-- 收藏按钮 -->
              <button class="p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                :class="{ 'text-red-500 border-red-300': isFavorited }" @click="toggleFavorite">
                <i class="i-ic:baseline-favorite text-xl" :class="{ 'text-red-500': isFavorited }"></i>
              </button>

              <!-- 分享按钮 -->
              <button class="p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                @click="shareProduct">
                <i class="i-ic:baseline-share text-xl"></i>
              </button>
            </div>

            <!-- 额外信息 -->
            <div class="text-sm text-gray-600 space-y-1">
              <p>FREE In Store Returns (?)</p>
              <p>Get 10% off* - Buy online, Pick up in store*</p>
              <p>Earn {{ product?.rewardPoints || 0 }} Reward Points (?)</p>
              <p class="text-xs">30 points = $1 Reward</p>
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
            <h3 class="text-lg font-semibold mb-3">Description</h3>
            <p class="text-gray-700 leading-relaxed mb-4">
              {{ product?.shortDescription }}
            </p>

            <!-- 详细描述 -->
            <div v-if="showFullDescription" class="detailed-description">
              <h4 class="font-semibold mb-2">Detailed Description</h4>
              <p class="text-gray-700 leading-relaxed mb-4">
                {{ product?.fullDescription }}
              </p>

              <!-- 商品规格 -->
              <div v-if="product?.specifications?.length" class="specifications mb-4">
                <h4 class="font-semibold mb-2">Specifications</h4>
                <dl class="grid grid-cols-1 gap-2">
                  <div v-for="spec in product.specifications" :key="spec.name"
                    class="flex justify-between py-1 border-b border-gray-100">
                    <dt class="text-gray-600">{{ spec.name }}:</dt>
                    <dd class="text-gray-900">{{ spec.value }}</dd>
                  </div>
                </dl>
              </div>

              <!-- 护理说明 -->
              <div v-if="product?.careInstructions?.length" class="care-instructions">
                <h4 class="font-semibold mb-2">Care Instructions</h4>
                <ul class="list-disc list-inside text-gray-700 space-y-1">
                  <li v-for="instruction in product.careInstructions" :key="instruction">
                    {{ instruction }}
                  </li>
                </ul>
              </div>
            </div>

            <button class="text-blue-600 underline hover:text-blue-800 mt-2"
              @click="showFullDescription = !showFullDescription">
              {{ showFullDescription ? 'Show Less' : 'Show More' }}
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
    <div class="related-products bg-white py-12">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="relatedProduct in relatedProducts" :key="relatedProduct.id"
            class="product-card group cursor-pointer" @click="navigateToProduct(relatedProduct.id)">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              <img :src="relatedProduct.images[0]?.url" :alt="relatedProduct.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h3 class="font-medium text-gray-900 mb-1 line-clamp-2">
              {{ relatedProduct.title }}
            </h3>
            <p class="text-lg font-semibold text-gray-900">
              ${{ relatedProduct.price.currentPrice }}
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { client } from '@/share/useTreaty'
import BannerAds from '../components/BannerAds.vue'
import type { Products } from '../types/product'
import { handleApiRes } from '../utils/handleApi'


// 路由相关
const route = useRoute()
const router = useRouter()

// 响应式数据
const product = ref<Products | null>(null)
const relatedProducts = ref<Products[]>([])
const loading = ref(true)


// 商品选择状态
const selectedColor = ref<string | null>(null)
const selectedSize = ref<string | null>(null)
const currentImage = ref<string>('')
const currentVideo = ref<string>('')
const isVideoMode = ref(false)
const currentSizeType = ref<'uk' | 'eu' | 'us'>('uk')
const sizeTypes = ['uk', 'eu', 'us'] as const

// UI状态
const showFullDescription = ref(false)
const showImageModal = ref(false)
const isFavorited = ref(false)

// 计算属性
const canAddToCart = computed(() => {
  if (!product.value) return false

  // 如果有颜色选项，必须选择颜色
  if (product.value.colors?.length && !selectedColor.value) return false

  // 如果有尺寸选项，必须选择尺寸
  if (product.value.sizes?.length && !selectedSize.value) return false

  return true
})

// 方法
const setCurrentImage = (imageUrl: string) => {
  currentImage.value = imageUrl
  // currentVideo.value = ''
  isVideoMode.value = false
}

const setCurrentVideo = (videoUrl: string, thumbnailUrl: string) => {
  currentVideo.value = videoUrl
  currentImage.value = thumbnailUrl
  isVideoMode.value = true
}
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
  if (!canAddToCart.value) return

  // TODO: 实现加入购物车逻辑
  console.log('Adding to cart:', {
    productId: product.value?.id,
    colorId: selectedColor.value?.id,
    sizeId: selectedSize.value?.id,
    quantity: 1
  })

  // 显示成功提示
  alert('Product added to cart!')
}

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  // TODO: 实现收藏逻辑
  console.log('Toggle favorite:', isFavorited.value)
}

const shareProduct = () => {
  // TODO: 实现分享逻辑
  if (navigator.share) {
    navigator.share({
      title: product.value?.title,
      text: product.value?.shortDescription,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href)
    alert('Product link copied to clipboard!')
  }
}

const openImageModal = () => {
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
}

const navigateToProduct = (productId: string) => {
  router.push(`/product/${productId}`)
}

// 获取商品数据
const fetchProduct = async (productId: string) => {
  try {
    loading.value = true
    // 使用Eden Treaty调用API
    const res = await handleApiRes(client.api.products({ id: productId }).get())
    if (!res) {
      return
    }

    if (res.code == 200) {
      product.value = res.data as any

      // 设置默认图片
      //@ts-ignore
      if (product.value?.images.length > 0) {
        currentImage.value = product?.value?.images[0] as any
        isVideoMode.value = false
        currentVideo.value = ''
      }

    } else {
      // 如果API调用失败，使用模拟数据作为后备
      console.warn('API调用失败，使用模拟数据:')
    }



    // 获取相关商品
    // await fetchRelatedProducts()

  } catch (err) {

    console.error('Error fetching product:', err)
  } finally {
    loading.value = false
  }
}

// 获取相关商品
const fetchRelatedProducts = async () => {
  try {
    // 使用Eden Treaty调用API
    if (product.value?.id) {
      const { data, error: apiError } = await client.api.products.related({ id: product.value.id }).get()

      if (data) {
        relatedProducts.value = data
        return
      } else {
        console.warn('获取相关产品失败，使用模拟数据:', apiError)
      }
    }

    // 如果API调用失败或没有产品ID，使用模拟数据作为后备
    // 模拟数据
    relatedProducts.value = [
      {
        id: '2',
        title: 'Classic Cotton T-Shirt',
        price: {
          currentPrice: 29.99,
          originalPrice: 39.99,
          currency: 'USD'
        },
        images: [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
            alt: 'Cotton T-Shirt',
            isMain: true,
            sortOrder: 1
          }
        ]
      },
      {
        id: '3',
        title: 'Casual Denim Jacket',
        price: {
          currentPrice: 89.99,
          originalPrice: 119.99,
          currency: 'USD'
        },
        images: [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800',
            alt: 'Denim Jacket',
            isMain: true,
            sortOrder: 1
          }
        ]
      },
      {
        id: '4',
        title: 'Slim Fit Chinos',
        price: {
          currentPrice: 49.99,
          originalPrice: 69.99,
          currency: 'USD'
        },
        images: [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
            alt: 'Chinos',
            isMain: true,
            sortOrder: 1
          }
        ]
      },
      {
        id: '5',
        title: 'Knit Sweater',
        price: {
          currentPrice: 64.99,
          originalPrice: 84.99,
          currency: 'USD'
        },
        images: [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
            alt: 'Knit Sweater',
            isMain: true,
            sortOrder: 1
          }
        ]
      }
    ] as Product[]
  } catch (err) {
    console.error('Error fetching related products:', err)
  }
}

// 组件挂载时获取商品数据
onMounted(() => {
  const productId = route.params.id as string
  if (productId) {
    fetchProduct(productId)
  }
})
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