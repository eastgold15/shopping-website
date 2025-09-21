<script setup lang="ts">
// 简化的客户端布局
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm border-b border-gray-100">
      <nav class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center">
            <router-link to="/" class="text-2xl font-light tracking-wider text-gray-900">
              GINA
            </router-link>
          </div>

          <!-- 导航菜单 -->
          <div class="hidden md:flex items-center space-x-8">
            <router-link 
              to="/" 
              class="text-gray-700 hover:text-gray-900 transition-colors duration-200"
              :class="{ 'text-gray-900 font-medium': $route.name === 'home' }"
            >
              首页
            </router-link>
            <router-link 
              to="/products" 
              class="text-gray-700 hover:text-gray-900 transition-colors duration-200"
              :class="{ 'text-gray-900 font-medium': $route.name === 'products' }"
            >
              商品
            </router-link>
            <router-link 
              to="/about" 
              class="text-gray-700 hover:text-gray-900 transition-colors duration-200"
              :class="{ 'text-gray-900 font-medium': $route.name === 'about' }"
            >
              关于我们
            </router-link>
            <router-link 
              to="/contact" 
              class="text-gray-700 hover:text-gray-900 transition-colors duration-200"
              :class="{ 'text-gray-900 font-medium': $route.name === 'contact' }"
            >
              联系我们
            </router-link>
          </div>

          <!-- 右侧操作 -->
          <div class="flex items-center space-x-4">
            <button class="text-gray-600 hover:text-gray-900 transition-colors">
              <i class="pi pi-search text-xl"></i>
            </button>
            <button class="text-gray-600 hover:text-gray-900 transition-colors">
              <i class="pi pi-user text-xl"></i>
            </button>
          </div>
        </div>
      </nav>
    </header>

    <!-- 分类导航栏 -->
    <div class="hidden md:block">
      <CategoryNav />
    </div>

    <!-- 中间内容区域 -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- 底部 -->
    <footer class="bg-gray-50 border-t border-gray-200">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- 品牌介绍 -->
          <div class="md:col-span-2">
            <h3 class="text-2xl font-light tracking-wider text-gray-900 mb-4">GINA</h3>
            <p class="text-gray-600 mb-4">
              自1954年以来，GINA一直致力于创造世界上最精美的女鞋。我们的每一双鞋都在意大利手工制作，
              融合了传统工艺与现代设计理念，为追求品质与优雅的女性提供完美的选择。
            </p>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="pi pi-facebook text-xl"></i>
              </a>
              <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="pi pi-instagram text-xl"></i>
              </a>
              <a href="#" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i class="pi pi-twitter text-xl"></i>
              </a>
            </div>
          </div>

          <!-- 快速链接 -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">快速链接</h4>
            <ul class="space-y-2">
              <li>
                <router-link to="/" class="text-gray-600 hover:text-gray-900 transition-colors">
                  首页
                </router-link>
              </li>
              <li>
                <router-link to="/products" class="text-gray-600 hover:text-gray-900 transition-colors">
                  商品系列
                </router-link>
              </li>
              <li>
                <router-link to="/about" class="text-gray-600 hover:text-gray-900 transition-colors">
                  关于我们
                </router-link>
              </li>
              <li>
                <router-link to="/contact" class="text-gray-600 hover:text-gray-900 transition-colors">
                  联系我们
                </router-link>
              </li>
            </ul>
          </div>

          <!-- 联系信息 -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">联系我们</h4>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-center space-x-2">
                <i class="pi pi-map-marker text-sm"></i>
                <span>北京市朝阳区建国路88号</span>
              </li>
              <li class="flex items-center space-x-2">
                <i class="pi pi-phone text-sm"></i>
                <span>+86 400-123-4567</span>
              </li>
              <li class="flex items-center space-x-2">
                <i class="pi pi-envelope text-sm"></i>
                <span>contact@gina.com</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 版权信息 -->
        <div class="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2024 GINA. 版权所有。</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 导航链接激活状态 */
.router-link-active {
  color: #111827 !important;
  font-weight: 500;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .grid {
    gap: 2rem;
  }
}
</style>