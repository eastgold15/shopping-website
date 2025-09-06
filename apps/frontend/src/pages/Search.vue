<template>
  <div class="search-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">商品搜索</h1>
        <p class="page-description">找到您心仪的商品</p>
      </div>
    </div>

    <!-- 搜索内容 -->
    <div class="search-content">
      <div class="container">
        <ProductSearch />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductSearch from '../components/ProductSearch.vue';

// 设置页面元数据
const title = '商品搜索';
const description = '搜索您需要的商品，支持多种筛选条件';
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: var(--surface-ground);
}

.page-header {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.5rem;
}

.page-description {
  font-size: 1.125rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.search-content {
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-description {
    font-size: 1rem;
  }
  
  .search-content {
    padding: 1.5rem 0;
  }
}
</style>