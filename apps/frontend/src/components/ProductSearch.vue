<template>
  <div class="product-search">
    <!-- 搜索框 -->
    <div class="search-box">
      <div class="p-inputgroup">
        <InputText v-model="searchQuery" placeholder="搜索商品..." @keyup.enter="handleSearch" class="search-input" />
        <Button icon="pi pi-search" @click="handleSearch" :loading="loading" class="search-button" />
      </div>
    </div>

    <!-- 筛选器 -->
    <div v-if="showFilters" class="filters-section">
      <div class="filters-grid">
        <!-- 分类筛选 -->
        <div class="filter-item">
          <label>分类</label>
          <Dropdown v-model="filters.categoryId" :options="categories" option-label="name" option-value="id"
            placeholder="选择分类" show-clear @change="handleFilterChange" />
        </div>

        <!-- 价格范围 -->
        <div class="filter-item">
          <label>价格范围</label>
          <div class="price-range">
            <InputNumber v-model="filters.minPrice" placeholder="最低价" mode="currency" currency="USD" locale="en-US"
              @input="handleFilterChange" />
            <span class="price-separator">-</span>
            <InputNumber v-model="filters.maxPrice" placeholder="最高价" mode="currency" currency="USD" locale="en-US"
              @input="handleFilterChange" />
          </div>
        </div>

        <!-- 颜色筛选 -->
        <div class="filter-item">
          <label>颜色</label>
          <MultiSelect v-model="filters.colors" :options="filterOptions.colors" placeholder="选择颜色" display="chip"
            @change="handleFilterChange" />
        </div>

        <!-- 尺寸筛选 -->
        <div class="filter-item">
          <label>尺寸</label>
          <MultiSelect v-model="filters.sizes" :options="filterOptions.sizes" placeholder="选择尺寸" display="chip"
            @change="handleFilterChange" />
        </div>

        <!-- 排序 -->
        <div class="filter-item">
          <label>排序</label>
          <Dropdown v-model="sortOption" :options="sortOptions" option-label="label" option-value="value"
            placeholder="选择排序" @change="handleSortChange" />
        </div>
      </div>

      <!-- 筛选操作 -->
      <div class="filter-actions">
        <Button label="清除筛选" icon="pi pi-times" severity="secondary" outlined @click="clearFilters" />
        <Button label="应用筛选" icon="pi pi-check" @click="applyFilters" />
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results">
      <!-- 结果统计 -->
      <div v-if="searchResults" class="results-header">
        <div class="results-info">
          <span class="results-count">
            找到 {{ searchResults.total }} 个商品
          </span>
          <span v-if="searchResults.query" class="search-term">
            关键词: "{{ searchResults.query }}"
          </span>
        </div>
        <Button :icon="showFilters ? 'pi pi-filter-slash' : 'pi pi-filter'" :label="showFilters ? '隐藏筛选' : '显示筛选'"
          severity="secondary" outlined @click="toggleFilters" />
      </div>

      <!-- 商品列表 -->
      <div v-if="searchResults?.products.length" class="products-grid">
        <ProductCard v-for="product in searchResults.products" :key="product.id" :product="product"
          @click="goToProduct(product)" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && searchResults" class="empty-state">
        <i class="pi pi-search" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
        <h3>未找到相关商品</h3>
        <p>请尝试调整搜索关键词或筛选条件</p>
        <Button label="查看所有商品" @click="viewAllProducts" />
      </div>

      <!-- 分页 -->
      <div v-if="searchResults && searchResults.total > searchResults.limit" class="pagination">
        <Paginator :rows="searchResults.limit" :total-records="searchResults.total"
          :first="(searchResults.page - 1) * searchResults.limit" @page="handlePageChange" />
      </div>
    </div>

    <!-- 热门搜索 -->
    <div v-if="!searchResults && popularTerms.length" class="popular-searches">
      <h4>热门搜索</h4>
      <div class="popular-tags">
        <Tag v-for="term in popularTerms" :key="term" :value="term" @click="searchByTerm(term)" class="popular-tag" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Paginator from 'primevue/paginator';
import Tag from 'primevue/tag';
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { client } from '@/share/useTreaty';
import ProductCard from './ProductCard.vue';
import { handleApiRes } from '../utils/handleApi';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  images: string[];
  colors: string[];
  sizes: string[];
  categoryId?: string;
  isActive: boolean;
  isFeatured: boolean;
}

const meta = reactive({
  page: 0,
  pageSize: 10,
  total: 0,
  pageTotal: 0
})

interface SearchResult {
  products: Product[];
  query?: string;
  filters: any;
  sort: any;
}

interface FilterOptions {
  colors: string[];
  sizes: string[];
  priceRange: { min: number; max: number };
  tags: string[];
}

interface Category {
  id: string;
  name: string;
}

const router = useRouter();

// 响应式数据
const searchQuery = ref('');
const loading = ref(false);
const showFilters = ref(false);
const searchResults = ref<SearchResult | null>(null);
const popularTerms = ref<string[]>([]);
const categories = ref<Category[]>([]);
const filterOptions = ref<FilterOptions>({
  colors: [],
  sizes: [],
  priceRange: { min: 0, max: 1000 },
  tags: []
});

// 筛选条件
const filters = reactive({
  categoryId: null as string | null,
  minPrice: null as number | null,
  maxPrice: null as number | null,
  colors: [] as string[],
  sizes: [] as string[],
  tags: [] as string[]
});

// 排序选项
const sortOptions = [
  { label: '最新上架', value: 'createdAt-desc' },
  { label: '最早上架', value: 'createdAt-asc' },
  { label: '价格从低到高', value: 'price-asc' },
  { label: '价格从高到低', value: 'price-desc' },
  { label: '名称A-Z', value: 'name-asc' },
  { label: '名称Z-A', value: 'name-desc' }
];

const sortOption = ref('createdAt-desc');

// 方法
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;

  loading.value = true;
  try {
    const [sortBy, sortOrder] = sortOption.value.split('-');
    const params = new URLSearchParams({
      q: searchQuery.value,
      sortBy,
      sortOrder,
      page: '1',
      limit: '20'
    });

    // 添加筛选条件
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.colors.length) params.append('colors', filters.colors.join(','));
    if (filters.sizes.length) params.append('sizes', filters.sizes.join(','));
    if (filters.tags.length) params.append('tags', filters.tags.join(','));

    const { data, error } = await client.api.products.search.get({ query: Object.fromEntries(params) });
    if (data) {
      searchResults.value = data;
    } else {
      console.error('搜索失败:', error);
    }
  } catch (error) {
    console.error('搜索失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleFilterChange = () => {
  // 延迟执行搜索，避免频繁请求
  setTimeout(() => {
    if (searchQuery.value.trim()) {
      handleSearch();
    }
  }, 300);
};

const handleSortChange = () => {
  if (searchQuery.value.trim()) {
    handleSearch();
  }
};

const handlePageChange = (event: any) => {
  const page = Math.floor(event.first / event.rows) + 1;
  searchWithPage(page);
};

const searchWithPage = async (page: number) => {
  loading.value = true;
  try {
    const [sortBy, sortOrder] = sortOption.value.split('-');
    const params = new URLSearchParams({
      q: searchQuery.value,
      sortBy,
      sortOrder,
      page: page.toString(),
      limit: '20'
    });

    // 添加筛选条件
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.colors.length) params.append('colors', filters.colors.join(','));
    if (filters.sizes.length) params.append('sizes', filters.sizes.join(','));
    if (filters.tags.length) params.append('tags', filters.tags.join(','));

    const res = await handleApiRes(client.api.products.search.get({ query: Object.fromEntries(params) }));
    if (!res) {
      return
    }


    if (res.code === 200) {  // 成功
      searchResults.value = res.data.items;
    } else {
      console.error('搜索失败:', error);
    }
  } catch (error) {
    console.error('搜索失败:', error);
  } finally {
    loading.value = false;
  }
};

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const clearFilters = () => {
  filters.categoryId = null;
  filters.minPrice = null;
  filters.maxPrice = null;
  filters.colors = [];
  filters.sizes = [];
  filters.tags = [];
  sortOption.value = 'createdAt-desc';

  if (searchQuery.value.trim()) {
    handleSearch();
  }
};

const applyFilters = () => {
  if (searchQuery.value.trim()) {
    handleSearch();
  }
};

const searchByTerm = (term: string) => {
  searchQuery.value = term;
  handleSearch();
};

const goToProduct = (product: Product) => {
  router.push(`/products/${product.slug}`);
};

const viewAllProducts = () => {
  router.push('/products');
};

// 加载初始数据
const loadInitialData = async () => {
  try {
    // 加载热门搜索关键词
    const { data: termsData } = await client.api.products.search['popular-terms'].get();
    if (termsData) {
      popularTerms.value = termsData;
    }

    // 加载分类列表
    const { data: categoriesData } = await client.api.categories.get();
    if (categoriesData) {
      categories.value = categoriesData;
    }

    // 加载筛选选项
    const { data: optionsData } = await client.api.products['filter-options'].get();
    if (optionsData) {
      filterOptions.value = optionsData;
    }
  } catch (error) {
    console.error('加载初始数据失败:', error);
  }
};

onMounted(() => {
  loadInitialData();
});
</script>

<style scoped>
.product-search {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.search-box {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
}

.filters-section {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.price-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-separator {
  color: var(--text-color-secondary);
}

.filter-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.results-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.results-count {
  font-weight: 600;
  color: var(--text-color);
}

.search-term {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: var(--text-color);
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.popular-searches {
  margin-top: 2rem;
}

.popular-searches h4 {
  margin-bottom: 1rem;
  color: var(--text-color);
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.popular-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.popular-tag:hover {
  background: var(--primary-color);
  color: var(--primary-color-text);
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-actions .p-button {
    flex: 1;
  }
}
</style>