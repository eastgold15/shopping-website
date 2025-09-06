<script setup lang="ts">
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Menu from 'primevue/menu';
import { onMounted, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import CategoryNav from '../components/CategoryNav.vue';
import { client } from '@/share/useTreaty';
import { handleApiRes } from '../utils/handleApi';
import type { FooterConfig, FooterSection } from '../types/layout';

const router = useRouter();
const isMobileMenuOpen = ref(false);
const currentLanguage = ref('中文');
const isUserLoggedIn = ref(false);
const isDarkMode = ref(false);
const languageMenu = ref();
const mobileLanguageMenu = ref();
const searchQuery = ref('');
const cartCount = ref(0);



// 底部配置数据
const footerConfig = reactive<{ sections: FooterSection[], copyright: string, loading: boolean }>({
	sections: [],
	copyright: '',
	loading: true
});

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

const switchLanguage = (language: string) => {
	currentLanguage.value = language;
	// 菜单会自动关闭
};

const toggleLanguageMenu = (event: any) => {
	languageMenu.value.toggle(event);
};

const toggleMobileLanguageMenu = (event: any) => {
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
	// 检查用户是否已登录
	if (isUserLoggedIn.value) {
		// 已登录，跳转到用户中心或显示用户菜单
		console.log('跳转到用户中心');
	} else {
		// 未登录，跳转到登录页面
		router.push('/login');
	}
};

// 获取底部配置数据
const loadFooterConfig = async () => {
	try {
		footerConfig.loading = true;

		// 获取底部相关配置

		// @ts-ignore
		const footerResponse: any = await handleApiRes(client.api.siteConfigs.category['footer'].get())


		if (footerResponse.data && footerResponse.code === 200) {
			// 处理底部栏目数据
			const footerData: FooterConfig[] = footerResponse.data || [];

			// 查找底部栏目配置
			const sectionsConfig = footerData.find(config => config.key === 'footer_sections');
			if (sectionsConfig) {
				try {
					const sections: FooterSection = JSON.parse(sectionsConfig.value);
					if (Array.isArray(sections)) {
						footerConfig.sections = sections;
					}
				} catch (e) {
					console.warn('解析底部栏目数据失败:', e);
				}
			}

			// 查找版权信息
			const copyrightConfig = footerData.find(config => config.key === 'footer_copyright');
			if (copyrightConfig) {
				footerConfig.copyright = copyrightConfig.value;
			}
		}
	} catch (error) {
		console.error('加载底部配置失败:', error);

	} finally {
		footerConfig.loading = false;
	}
};

const handleSearch = () => {
	if (searchQuery.value.trim()) {
		router.push({
			path: '/search',
			query: { q: searchQuery.value.trim() }
		});
	}
};

// 初始化主题和加载配置
onMounted(() => {
	const savedTheme = localStorage.getItem('theme');
	if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
		isDarkMode.value = true;
		document.documentElement.classList.add('dark');
	}

	// 加载底部配置
	loadFooterConfig();
});
</script>

<template>
	<div class="container h-full">
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


			<div class="">
				<!-- 桌面端布局 -->
				<div class="hidden md:flex flex-justify-start items-center py-4">
					<!-- 左侧：语言切换和主题切换 -->



					<!-- logo -->
					<div class="inline-flex max-w-[100%]">
						<RouterLink to="/" class="logo-link px-4">
							<h1 class="logo-text">外贸商城</h1>
						</RouterLink>
					</div>






					<!-- 搜索框 -->
					<div class=" flex-1 mx-8">
						<!-- <input type="text" placeholder="搜索商品..." class="search-input" v-model="searchQuery"
								@keyup.enter="handleSearch">

							<InputText type="text" v-model="value" variant="filled" />
							<button class="search-btn" @click="handleSearch">
								<div class=""></div>
							</button> -->

						<InputGroup>
							<InputText v-model="searchQuery" placeholder="搜索商品..." @update:modelValue="handleSearch" />
							<InputGroupAddon>
								<Button icon="pi pi-search" severity="secondary" variant="text" @click="handleSearch" />
							</InputGroupAddon>
						</InputGroup>
					</div>




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




					<!-- 收藏 -->
					<!-- <button @click="toggleFavorites" class="theme-btn" title="收藏">
						<div class="i-ic:baseline-favorite-border"></div>
					</button> -->



					<!-- 购物袋 -->
					<button class="theme-btn">
						<div class="i-ic:outline-shopping-cart"></div>
						<span class="cart-count">0</span>
					</button>

					<!-- 登录/用户信息 -->
					<button @click="handleLogin" class="login-btn " :title="isUserLoggedIn ? '用户中心' : '登录'">
						<div :class="isUserLoggedIn ? 'i-ic:baseline-person' : 'i-ic:baseline-login'" class="w-5 h-5 mr-2"></div>
						<span class="login-text">{{ isUserLoggedIn ? '用户中心' : '登录' }}</span>
					</button>

				</div>

				<!-- 移动端布局 -->
				<div class=" mobile-header md:hidden">
					<!-- 第一行：菜单、Logo、购物袋 -->
					<div class="container mobile-top-row flex">
						<!-- 左侧：菜单按钮 -->
						<div class="mobile-left">
							<button @click="toggleMobileMenu" class="mobile-menu-btn">
								<div class="i-ic:baseline-menu"></div>
							</button>

							<!-- 移动端主题切换 -->
							<button @click="toggleTheme" class="mobile-theme-btn" :title="isDarkMode ? '切换到白天模式' : '切换到夜间模式'">
								<div :class="isDarkMode ? 'i-ic:baseline-light-mode' : 'i-ic:baseline-dark-mode'">
								</div>
							</button>


							<!-- 移动端语言切换 -->
							<div class="relative">
								<button @click="toggleMobileLanguageMenu" class="mobile-language-btn">
									<div class="i-ic:baseline-g-translate"></div>
								</button>
								<Menu ref="mobileLanguageMenu" :model="languageOptions" :popup="true" />
							</div>
						</div>

						<!-- 中间：Logo -->
						<div class="mobile-center-logo">
							<RouterLink to="/" class="mobile-logo-link">
								<h1 class="mobile-logo-text">外贸商城</h1>
							</RouterLink>
						</div>

						<!-- 右侧：购物袋 -->
						<div class="mobile-right">
							<button class="mobile-cart-btn">
								<div class="i-ic:outline-shopping-cart"></div>
								<span class="mobile-cart-count">{{ cartCount }}</span>
							</button>
						</div>


						<!-- 登录/用户信息 -->
						<button @click="handleLogin" class="mobile-theme-btn " :title="isUserLoggedIn ? '用户中心' : '登录'">
							<div :class="isUserLoggedIn ? 'i-ic:baseline-person' : 'i-ic:baseline-login'" class="w-5 h-5 mr-2">
							</div>
							<span class="login-text">{{ isUserLoggedIn ? '用户中心' : '登录' }}</span>
						</button>
					</div>

					<!-- 第二行：搜索框 -->
					<div class="mobile-search-row">
						<InputGroup>
							<InputText v-model="searchQuery" placeholder="搜索商品..." @update:modelValue="handleSearch" />
							<InputGroupAddon>
								<Button icon="pi pi-search" severity="secondary" variant="text" @click="handleSearch" />
							</InputGroupAddon>
						</InputGroup>
					</div>

				</div>
			</div>


		</header>

		<!-- 分类导航 - 桌面版 -->
		<div class="hidden md:block min-h-[50px]">
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
			<router-view></router-view>
		</main>

		<!-- 网站底部 -->
		<footer class="site-footer">
			<div class="container">
				<!-- 加载状态 -->
				<div v-if="footerConfig.loading" class="footer-loading">
					<div class="text-center py-8">
						<i class="pi pi-spin pi-spinner text-2xl"></i>
						<p class="mt-2 text-gray-500">加载中...</p>
					</div>
				</div>

				<!-- 底部内容 -->
				<div v-else class="footer-content">
					<div v-for="section in footerConfig.sections" :key="section.title" class="footer-section">
						<h4>{{ section.title }}</h4>
						<ul v-if="section.links && section.links.length > 0">
							<li v-for="link in section.links" :key="link.text">
								<a :href="link.url || '#'" :target="link.url && link.url.startsWith('http') ? '_blank' : '_self'"
									:rel="link.url && link.url.startsWith('http') ? 'noopener noreferrer' : ''">
									{{ link.text }}
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div v-if="!footerConfig.loading" class="footer-bottom">
					<p>{{ footerConfig.copyright || '© 2024 WWW.APPARELCITY.COM.CN All Rights Reserved' }}</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<style scoped>
/* 顶部信息栏样式 */
.shipping-info {
	@apply text-sm text-gray-600;
}




/* 桌面端头部布局 */
.desktop-header {
	@apply justify-between;
}

.header-left {
	@apply flex items-center space-x-3;
}

.language-btn {
	@apply flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.language-btn div {
	@apply w-4 h-4;
}

.language-btn span {
	@apply text-sm font-medium;
}

.theme-btn {
	@apply relative flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.login-btn {
	@apply flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.theme-btn div {
	@apply w-5 h-5;
}

/* 语言菜单样式 */
.language-menu {
	@apply mt-2;
}

/* 深色模式下的样式调整 */
.dark .language-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .theme-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .header-main {
	@apply bg-gray-900 border-gray-700;
}

.dark .search-input {
	@apply bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400;
}

.dark .search-btn {
	@apply bg-gray-700 hover:bg-gray-600 text-gray-300;
}

.dark .action-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

.dark .cart-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

/* 移动端深色模式样式 */
.dark .mobile-header {
	@apply bg-gray-900;
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
	@apply bg-gray-700 hover:bg-gray-600 text-gray-300;
}

.dark .mobile-cart-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}

/* 中间Logo区域 */

.logo-link {
	@apply text-decoration-none;
}

.logo-text {
	@apply text-2xl font-bold text-blue-600 m-0;
}

/* 右侧功能区域 */
.function-area .search-box {
	@apply flex items-center;
}

.search-input {
	@apply px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.search-btn {
	@apply px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200;
}

.search-btn div {
	@apply w-4 h-4;
}

.action-buttons {
	@apply flex items-center space-x-2;
}

.action-btn {
	@apply p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.action-btn div {
	@apply w-5 h-5;
}

.cart-btn {
	@apply relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.cart-btn div {
	@apply w-5 h-5;
}

.cart-count {
	@apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center;
}

/* 移动端头部布局 */
.mobile-header {
	@apply py-2 space-y-2;
}

.mobile-top-row {
	@apply items-center justify-between;
}

.mobile-left {
	@apply flex items-center;
}

.mobile-menu-btn {
	@apply p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.mobile-menu-btn div {
	@apply w-5 h-5;
}

.mobile-theme-btn {
	@apply p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer;
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
	@apply text-xl font-bold text-blue-600 m-0;
}

.mobile-search-row {
	@apply px-4;
}

.mobile-search-box {
	@apply flex items-center w-full;
}

.mobile-search-input {
	@apply flex-1 px-3 py-1.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm;
}

.mobile-search-btn {
	@apply px-3 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200;
}

.mobile-search-btn div {
	@apply w-4 h-4;
}

.mobile-right {
	@apply flex items-center space-x-2;
}

.mobile-language-btn {
	@apply p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.mobile-language-btn div {
	@apply w-5 h-5;
}

.mobile-language-menu {
	@apply mt-2;
}

.mobile-cart-btn {
	@apply relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.mobile-cart-btn div {
	@apply w-5 h-5;
}

.mobile-cart-count {
	@apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center;
}

/* 主要内容区域 */
.main-content {
	@apply flex-1 min-h-screen;
}

.loading-container {
	@apply flex items-center justify-center min-h-96;
}

.loading-spinner {
	@apply flex flex-col items-center space-y-2 text-gray-600;
}

/* 底部样式 */
.site-footer {
	@apply bg-gray-800 text-white py-12;
}

.footer-content {
	@apply grid grid-cols-1 md:grid-cols-3 gap-8;
}

.footer-section h4 {
	@apply text-lg font-semibold mb-4;
}

.footer-section ul {
	@apply list-none p-0 m-0;
}

.footer-section li {
	@apply mb-2;
}

.footer-section a {
	@apply text-gray-300 hover:text-white transition-colors duration-200 text-decoration-none;
}

.footer-bottom {
	@apply mt-8 pt-8 border-t border-gray-700 text-center text-gray-400;
}
</style>