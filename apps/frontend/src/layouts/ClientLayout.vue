<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import CategoryNav from '../components/CategoryNav.vue';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import Menu from 'primevue/menu';

const router = useRouter();
const isMobileMenuOpen = ref(false);
const currentLanguage = ref('中文');
const isUserLoggedIn = ref(false);
const isDarkMode = ref(false);
const languageMenu = ref();
const mobileLanguageMenu = ref();
const searchQuery = ref('');
const cartCount = ref(0);

// 语言选项
const languageOptions = ref([
	{
		label: '中文',
		icon: 'pi pi-flag',
		command: () => switchLanguage('中文')
	},
	{
		label: 'English',
		icon: 'pi pi-flag',
		command: () => switchLanguage('English')
	}
]);

const toggleMobileMenu = () => {
	isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
	isMobileMenuOpen.value = false;
};

const switchLanguage = (language) => {
	currentLanguage.value = language;
	// 菜单会自动关闭
};

const toggleLanguageMenu = (event) => {
	languageMenu.value.toggle(event);
};

const toggleMobileLanguageMenu = (event) => {
	mobileLanguageMenu.value.toggle(event);
};

const toggleTheme = () => {
	isDarkMode.value = !isDarkMode.value;
	if (isDarkMode.value) {
		document.documentElement.classList.add('dark');
		localStorage.setItem('theme', 'dark');
	} else {
		document.documentElement.classList.remove('dark');
		localStorage.setItem('theme', 'light');
	}
};

const toggleFavorites = () => {
	// TODO: 实现收藏功能
	console.log('切换收藏');
};

const handleLogin = () => {
	// TODO: 实现登录功能
	console.log('处理登录');
};

const handleSearch = () => {
	if (searchQuery.value.trim()) {
		router.push({
			path: '/search',
			query: { q: searchQuery.value.trim() }
		});
	}
};

// 初始化主题
onMounted(() => {
	const savedTheme = localStorage.getItem('theme');
	if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
		isDarkMode.value = true;
		document.documentElement.classList.add('dark');
	}
});
</script>

<template>
	<div class="w-full h-full">
		<!-- 网站头部 -->
		<header class="w-full">
			<!-- 顶部信息栏 -->
			<div class=" w-full flex  flex-justify-between">
				<div class="px-4">
					<span class="shipping-info">FREE SHIPPING on orders over $59* details</span>
				</div>
				<div class="px-4">
					<a href="#" class="px-2">Track Order</a>
					<a href="#" class="px-2	">Help</a>
				</div>
			</div>

			<!-- 主要头部区域 -->
			<div class="header-main">
				<div class="container">
					<!-- 桌面端布局 -->
					<div class="hidden md:flex flex-justify-around">
						<!-- 左侧：语言切换和主题切换 -->
						<div class="header-left">
							<!-- 语言切换下拉菜单 -->
							<div class="relative">
								<button @click="toggleLanguageMenu" class="language-btn">
									<div class="i-ic:baseline-g-translate"></div>
									<span>{{ currentLanguage }}</span>
									<div class="i-ic:baseline-keyboard-arrow-down"></div>
								</button>
								<Menu ref="languageMenu" :model="languageOptions" :popup="true" class="language-menu" />
							</div>

							<!-- 主题切换按钮 -->
							<button @click="toggleTheme" class="theme-btn" :title="isDarkMode ? '切换到白天模式' : '切换到夜间模式'">
								<div :class="isDarkMode ? 'i-ic:baseline-light-mode' : 'i-ic:baseline-dark-mode'"></div>
							</button>
						</div>

						<!-- 中间：Logo -->
						<div class="header-center">
							<RouterLink to="/" class="logo-link">
								<h1 class="logo-text">外贸商城</h1>
							</RouterLink>
						</div>

						<!-- 右侧：搜索、收藏、登录、购物袋 -->
						<div class="header-right">
							<!-- 搜索框 -->
							<div class="search-box">
								<input 
									type="text" 
									placeholder="搜索商品..." 
									class="search-input"
									v-model="searchQuery"
									@keyup.enter="handleSearch"
								>
								<button class="search-btn" @click="handleSearch">
									<div class="i-ic:baseline-search"></div>
								</button>
							</div>

							<!-- 功能按钮组 -->
							<div class="action-buttons">
								<!-- 收藏 -->
								<button @click="toggleFavorites" class="action-btn" title="收藏">
									<div class="i-ic:baseline-favorite-border"></div>
								</button>

								<!-- 登录/用户信息 -->
								<button @click="handleLogin" class="action-btn" :title="isUserLoggedIn ? '用户中心' : '登录'">
									<div :class="isUserLoggedIn ? 'i-ic:baseline-person' : 'i-ic:baseline-login'"></div>
								</button>

								<!-- 购物袋 -->
								<button class="cart-btn">
									<div class="i-ic:baseline-shopping-bag"></div>
									<span class="cart-count">0</span>
								</button>
							</div>
						</div>
					</div>

					<!-- 移动端布局 -->
					<div class="header-content mobile-header md:hidden">
						<!-- 第一行：菜单、Logo、购物袋 -->
						<div class="mobile-top-row flex">
							<!-- 左侧：菜单按钮 -->
							<div class="mobile-left">
								<button @click="toggleMobileMenu" class="mobile-menu-btn">
									<div class="i-ic:baseline-menu"></div>
								</button>

								<!-- 移动端主题切换 -->
								<button @click="toggleTheme" class="mobile-theme-btn"
									:title="isDarkMode ? '切换到白天模式' : '切换到夜间模式'">
									<div :class="isDarkMode ? 'i-ic:baseline-light-mode' : 'i-ic:baseline-dark-mode'">
									</div>
								</button>
							</div>

							<!-- 中间：Logo -->
							<div class="mobile-center-logo">
								<RouterLink to="/" class="mobile-logo-link">
									<h1 class="mobile-logo-text">外贸商城</h1>
								</RouterLink>
							</div>

							<!-- 右侧：购物袋 -->
							<div class="mobile-right">
								<!-- 移动端语言切换 -->
								<div class="relative">
									<button @click="toggleMobileLanguageMenu" class="mobile-language-btn">
										<div class="i-ic:baseline-g-translate"></div>
									</button>
									<Menu ref="mobileLanguageMenu" :model="languageOptions" :popup="true" />
								</div>
								<button class="mobile-cart-btn">
									<div class="i-ic:baseline-shopping-bag"></div>
									<span class="mobile-cart-count">{{ cartCount }}</span>
								</button>
							</div>
						</div>

						<!-- 第二行：搜索框 -->
						<div class="mobile-search-row">
							<div class="mobile-search-box">
								<input type="text" placeholder="搜索..." class="mobile-search-input">
								<button class="mobile-search-btn">
									<div class="i-ic:baseline-search"></div>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

		</header>

		<!-- 分类导航 - 桌面版 -->
		<div class="hidden md:block">
			<CategoryNav />
		</div>

		<!-- 移动端分类菜单抽屉 -->
		<Drawer v-model:visible="isMobileMenuOpen">
			<template #header>
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-semibold text-gray-800">商品分类</h3>
				</div>
			</template>
			<!-- 移动端分类菜单 -->
			<div class="overflow-y-auto h-full pb-20">
				<CategoryNav :is-mobile="true" @category-selected="closeMobileMenu" />
			</div>
			<template #footer>
				<div class="flex items-center gap-2">
					<Button label="Account" icon="pi pi-user" class="flex-auto" variant="outlined"></Button>
					<Button label="Logout" icon="pi pi-sign-out" class="flex-auto" severity="danger" text></Button>
				</div>
			</template>
		</Drawer>

		<!-- 主要内容区域 -->
		<main class="main-content">
			<slot />
		</main>

		<!-- 网站底部 -->
		<footer class="site-footer">
			<div class="container">
				<div class="footer-content">
					<div class="footer-section">
						<h4>For You</h4>
						<ul>
							<li><a href="#">Favorites</a></li>
							<li><a href="#">Gift Cards</a></li>
							<li><a href="#">Afterpay</a></li>
						</ul>
					</div>

					<div class="footer-section">
						<h4>Connect with Us</h4>
						<ul>
							<li><a href="#">Back to top</a></li>
						</ul>
					</div>

					<div class="footer-section">
						<h4>Legal</h4>
						<ul>
							<li><a href="#">Terms of Use</a></li>
							<li><a href="#">Privacy & Cookie Policy</a></li>
							<li><a href="#">Text Messaging Terms</a></li>
							<li><a href="#">Bulk Buyer Policy</a></li>
							<li><a href="#">Accessibility</a></li>
						</ul>
					</div>
				</div>

				<div class="footer-bottom">
					<p>© 2024 WWW.APPARELCITY.COM.CN All Rights Reserved 赣ICP备2024041550号-5</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<style scoped>
/* 顶部信息栏样式 */
.shipping-info {
	@apply text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg;
}

/* 头部主要区域 */
.header-main {
	@apply bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 py-4 sticky top-0 z-50;
}

.container {
	@apply max-w-7xl mx-auto px-4;
}

/* 桌面端头部布局 */
.desktop-header {
	@apply justify-between;
}

.header-left {
	@apply flex items-center space-x-3;
}

.language-btn {
	@apply flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md;
}

.language-btn div {
	@apply w-4 h-4;
}

.language-btn span {
	@apply text-sm font-medium;
}

.theme-btn {
	@apply flex items-center justify-center p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md;
}

.theme-btn div {
	@apply w-5 h-5;
}

/* 语言菜单样式 */
.language-menu {
	@apply mt-2 rounded-xl shadow-lg border border-gray-200/50;
}

/* 深色模式下的样式调整 */
.dark .language-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .theme-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .header-main {
	@apply bg-gray-900/95 backdrop-blur-sm border-gray-700/50;
}

.dark .search-input {
	@apply bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400;
}

.dark .search-btn {
	@apply bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white;
}

.dark .action-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .cart-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

/* 移动端深色模式样式 */
.dark .mobile-header {
	@apply bg-gray-900/95 backdrop-blur-sm;
}

.dark .mobile-menu-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .mobile-theme-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .mobile-language-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .mobile-logo-text {
	@apply text-blue-400;
}

.dark .mobile-search-input {
	@apply bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400;
}

.dark .mobile-search-btn {
	@apply bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white;
}

.dark .mobile-cart-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

/* 中间Logo区域 */
.header-center {
	@apply flex items-center;
}

.logo-link {
	@apply text-decoration-none;
}

.logo-text {
	@apply text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent m-0 hover:scale-105 transition-transform duration-300;
}

/* 右侧功能区域 */
.header-right {
	@apply flex items-center space-x-4;
}

.search-box {
	@apply flex items-center;
}

.search-input {
	@apply px-4 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 bg-gray-50 text-gray-800 placeholder-gray-500 transition-all duration-300;
}

.search-btn {
	@apply px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 rounded-r-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl;
}

.search-btn div {
	@apply w-4 h-4;
}

.action-buttons {
	@apply flex items-center space-x-2;
}

.action-btn {
	@apply p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md hover:scale-110;
}

.action-btn div {
	@apply w-5 h-5;
}

.cart-btn {
	@apply relative p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md hover:scale-110;
}

.cart-btn div {
	@apply w-5 h-5;
}

.cart-count {
	@apply absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md;
}

/* 移动端头部布局 */
.mobile-header {
	@apply py-3 space-y-3 bg-white/95 backdrop-blur-sm;
}

.mobile-top-row {
	@apply items-center justify-between;
}

.mobile-left {
	@apply flex items-center space-x-3;
}

.mobile-menu-btn {
	@apply p-3 text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md;
}

.mobile-menu-btn div {
	@apply w-6 h-6;
}

.mobile-theme-btn {
	@apply p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md;
}

.mobile-theme-btn div {
	@apply w-5 h-5;
}

.mobile-center-logo {
	@apply flex-1 flex justify-center;
}

.mobile-logo-link {
	@apply text-decoration-none;
}

.mobile-logo-text {
	@apply text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent m-0;
}

.mobile-search-row {
	@apply px-4;
}

.mobile-search-box {
	@apply flex items-center w-full;
}

.mobile-search-input {
	@apply flex-1 px-4 py-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 text-gray-800 placeholder-gray-500 transition-all duration-300;
}

.mobile-search-btn {
	@apply px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 rounded-r-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300;
}

.mobile-search-btn div {
	@apply w-4 h-4;
}

.mobile-right {
	@apply flex items-center space-x-3;
}

.mobile-language-btn {
	@apply p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md;
}

.mobile-language-btn div {
	@apply w-5 h-5;
}

.mobile-language-menu {
	@apply mt-2 rounded-xl shadow-lg border border-gray-200/50;
}

.mobile-cart-btn {
	@apply relative p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 bg-transparent border-none cursor-pointer shadow-sm hover:shadow-md;
}

.mobile-cart-btn div {
	@apply w-5 h-5;
}

.mobile-cart-count {
	@apply absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md;
}

/* 主要内容区域 */
.main-content {
	@apply flex-1 min-h-screen bg-gradient-to-br from-gray-50 to-white;
}

.loading-container {
	@apply flex items-center justify-center min-h-96;
}

.loading-spinner {
	@apply flex flex-col items-center space-y-2 text-gray-600;
}

/* 底部样式 */
.site-footer {
	@apply bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16 mt-20;
}

.footer-content {
	@apply grid grid-cols-1 md:grid-cols-3 gap-12;
}

.footer-section h4 {
	@apply text-xl font-semibold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent;
}

.footer-section ul {
	@apply list-none p-0 m-0 space-y-3;
}

.footer-section li {
	@apply mb-0;
}

.footer-section a {
	@apply text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 text-decoration-none inline-block;
}

.footer-bottom {
	@apply mt-12 pt-8 border-t border-gray-700 text-center text-gray-400;
}

/* 链接样式美化 */
.header-main a {
	@apply text-gray-600 hover:text-blue-600 transition-colors duration-300 px-3 py-1 rounded-lg hover:bg-blue-50;
}

/* 按钮悬停效果 */
.action-btn:hover,
.cart-btn:hover,
.mobile-cart-btn:hover,
.mobile-language-btn:hover,
.mobile-menu-btn:hover,
.mobile-theme-btn:hover {
	@apply transform scale-110 rotate-3;
}

/* 搜索框聚焦效果 */
.search-input:focus,
.mobile-search-input:focus {
	@apply ring-2 ring-blue-500 border-blue-500 bg-white shadow-lg;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .header-main {
    @apply py-3;
  }
  
  .mobile-header {
    @apply py-2 space-y-2;
  }
  
  .search-input {
    @apply w-64;
  }
}
</style>