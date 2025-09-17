<script lang="ts" setup>
// 导航栏数据
const navigationItems = [
  { label: '首页', path: '/' },
  { label: '女鞋', path: '/category/women' },
  { label: '男鞋', path: '/category/men' },
  { label: '手袋', path: '/category/bags' },
  { label: '配饰', path: '/category/accessories' },
  { label: '新品', path: '/new-arrivals' },
  { label: '特价', path: '/sale' }
]

// 联系信息
const contactInfo = {
  phone: '+44(0)20 8885 7500',
  email: 'info@gina.com'
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航栏 - 粘性布局 -->
    <header class="sticky top-0 z-50 bg-white shadow-sm border-b">
      <!-- 顶部信息栏 -->
      <div class="bg-gray-50 text-sm text-gray-600 py-2">
        <div class="container mx-auto px-4 flex justify-between items-center">
          <span>免费配送至全球各地 - 30天退换保证</span>
          <span>{{ contactInfo.phone }}</span>
        </div>
      </div>
      
      <!-- 主导航栏 -->
      <nav class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center">
            <router-link to="/" class="text-2xl font-bold tracking-wider">
              GINA
            </router-link>
          </div>
          
          <!-- 导航菜单 -->
          <div class="hidden md:flex items-center space-x-8">
            <router-link 
              v-for="item in navigationItems" 
              :key="item.path"
              :to="item.path"
              class="text-gray-700 hover:text-black transition-colors duration-200 font-medium"
              active-class="text-black font-semibold"
            >
              {{ item.label }}
            </router-link>
          </div>
          
          <!-- 右侧功能区 -->
          <div class="flex items-center space-x-4">
            <!-- 搜索图标 -->
            <button class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <i class="pi pi-search text-gray-600"></i>
            </button>
            
            <!-- 收藏图标 -->
            <button class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <i class="pi pi-heart text-gray-600"></i>
            </button>
            
            <!-- 用户图标 -->
            <button class="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <i class="pi pi-user text-gray-600"></i>
            </button>
            
            <!-- 购物车图标 -->
            <button class="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <i class="pi pi-shopping-bag text-gray-600"></i>
              <span class="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </button>
            
            <!-- 移动端菜单按钮 -->
            <button class="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
              <i class="pi pi-bars text-gray-600"></i>
            </button>
          </div>
        </div>
      </nav>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="flex-1">
      <router-view></router-view>
    </main>
    
    <!-- 底部Footer -->
    <footer class="bg-gray-50 border-t mt-auto">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- 购买指南 -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">购买指南</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="#" class="hover:text-gray-900 transition-colors">尺码指南</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">护理说明</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">配送信息</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">退换政策</a></li>
            </ul>
          </div>
          
          <!-- 客户服务 -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">客户服务</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="#" class="hover:text-gray-900 transition-colors">联系GINA</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">常见问题</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">在线客服</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">预约服务</a></li>
            </ul>
          </div>
          
          <!-- 关于我们 -->
          <div>
            <h3 class="font-semibent text-gray-900 mb-4">关于我们</h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li><a href="#" class="hover:text-gray-900 transition-colors">品牌故事</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">工艺传承</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">可持续发展</a></li>
              <li><a href="#" class="hover:text-gray-900 transition-colors">招聘信息</a></li>
            </ul>
          </div>
          
          <!-- 订阅GINA最新资讯 -->
          <div>
            <h3 class="font-semibold text-gray-900 mb-4">订阅GINA最新资讯</h3>
            <div class="space-y-4">
              <div class="flex">
                <input 
                  type="email" 
                  placeholder="请输入您的邮箱地址"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                >
                <button class="bg-black text-white px-4 py-2 rounded-r-md hover:bg-gray-800 transition-colors text-sm">
                  订阅
                </button>
              </div>
              <div class="flex space-x-4">
                <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors">
                  <i class="pi pi-facebook text-lg"></i>
                </a>
                <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors">
                  <i class="pi pi-instagram text-lg"></i>
                </a>
                <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors">
                  <i class="pi pi-twitter text-lg"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 底部版权信息 -->
        <div class="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
          <div class="mb-4 md:mb-0">
            <p>&copy; 2024 GINA. 版权所有</p>
          </div>
          <div class="flex items-center space-x-4">
            <span>{{ contactInfo.phone }}</span>
            <span>|</span>
            <span>{{ contactInfo.email }}</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 自定义样式 */
.router-link-active {
  @apply text-black font-semibold;
}
</style>