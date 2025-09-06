<script setup>
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Menu from 'primevue/menu';
import PanelMenu from 'primevue/panelmenu';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const sidebarVisible = ref(false);
const userMenuVisible = ref(false);
const currentUser = ref({
	name: '管理员',
	avatar: '',
	role: 'Administrator'
});

// 当前页面标题
const currentPageTitle = computed(() => {
	const path = route.path;
	if (path.includes('/dashboard')) return '仪表盘';
	if (path.includes('/partners')) return '合作伙伴管理';
	if (path.includes('/categories')) return '商品分类管理';
	if (path.includes('/products/add')) return '添加商品';
	if (path.includes('/products')) return '商品管理';
	if (path.includes('/orders')) return '订单管理';
	if (path.includes('/refunds')) return '退款管理';
	if (path.includes('/users')) return '用户管理';
	if (path.includes('/admins')) return '管理员管理';
	if (path.includes('/settings')) return '网站设置';
	if (path.includes('/header-config')) return '顶部配置管理';
	if (path.includes('/footer-config')) return '底部配置管理';
	if (path.includes('/advertisements')) return '广告管理';
	if (path.includes('/images')) return '图片管理';
	if (path.includes('/payment-settings')) return '支付设置';
	if (path.includes('/shipping-settings')) return '物流设置';
	if (path.includes('/sales-reports')) return '销售统计';
	if (path.includes('/users-reports')) return '用户统计';
	if (path.includes('/reports')) return '统计报表';
	return '仪表盘';
});

const menuItems = ref([
	{
		label: '仪表盘',
		icon: 'pi pi-home',
		command: () => router.push('/admin/dashboard')
	},
	{
		label: '合作伙伴管理',
		icon: 'pi pi-briefcase',
		command: () => router.push('/admin/partners')
	},
	{
		label: '商品管理',
		icon: 'pi pi-box',
		items: [
			{
				label: '商品列表',
				icon: 'pi pi-list',
				command: () => router.push('/admin/products')
			},
			{
				label: '添加商品',
				icon: 'pi pi-plus',
				command: () => router.push('/admin/products/add')
			},
			{
				label: '商品分类',
				icon: 'pi pi-sitemap',
				command: () => router.push('/admin/categories')
			}
		]
	},
	{
		label: '订单管理',
		icon: 'pi pi-shopping-cart',
		items: [
			{
				label: '订单列表',
				icon: 'pi pi-list',
				command: () => router.push('/admin/orders')
			},
			{
				label: '退款管理',
				icon: 'pi pi-money-bill',
				command: () => router.push('/admin/refunds')
			}
		]
	},
	{
		label: '用户管理',
		icon: 'pi pi-users',
		items: [
			{
				label: '用户列表',
				icon: 'pi pi-list',
				command: () => router.push('/admin/users')
			},
			{
				label: '管理员',
				icon: 'pi pi-user-edit',
				command: () => router.push('/admin/admins')
			}
		]
	},
	{
		label: '网站设置',
		icon: 'pi pi-cog',
		items: [
			{
				label: '基本设置',
				icon: 'pi pi-info-circle',
				command: () => router.push('/admin/settings')
			},

			{
				label: '广告管理',
				icon: 'pi pi-image',
				command: () => router.push('/admin/advertisements')
			},
			{
				label: '图片管理',
				icon: 'pi pi-images',
				command: () => router.push('/admin/images')
			},
			{
				label: '资源管理',
				icon: 'pi pi-images',
				command: () => router.push('/admin/media')
			},
			{
				label: '支付设置',
				icon: 'pi pi-credit-card',
				command: () => router.push('/admin/payment-settings')
			},
			{
				label: '物流设置',
				icon: 'pi pi-truck',
				command: () => router.push('/admin/shipping-settings')
			}
		]
	},
	{
		label: '统计报表',
		icon: 'pi pi-chart-bar',
		items: [
			{
				label: '销售统计',
				icon: 'pi pi-chart-line',
				command: () => router.push('/admin/sales-reports')
			},
			{
				label: '用户统计',
				icon: 'pi pi-chart-pie',
				command: () => router.push('/admin/users-reports')
			}
		]
	}
]);

const userMenuItems = ref([
	{
		label: '个人资料',
		icon: 'pi pi-user',
		command: () => {
			// 跳转到个人资料页面
		}
	},
	{
		label: '修改密码',
		icon: 'pi pi-key',
		command: () => {
			// 跳转到修改密码页面
		}
	},
	{
		label: '退出登录',
		icon: 'pi pi-sign-out',
		command: () => {
			// 执行退出登录
			console.log('退出登录');
		}
	}
]);

const toggleSidebar = () => {
	sidebarVisible.value = !sidebarVisible.value;
};


const toggleUserMenu = (event) => {
	userMenuVisible.value = !userMenuVisible.value;
};
const isDarkMode = ref(false);
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
	<div class="admin-layout">
		<!-- 顶部导航栏 -->
		<header class="admin-header">
			<div class="header-left">
				<!-- 侧边栏切换按钮 -->
				<Button icon="pi pi-bars" @click="toggleSidebar" class="sidebar-toggle" text />
				<!-- Logo -->
				<div class="admin-logo">
					<RouterLink to="/admin/dashboard" class="logo-link">
						<h2 class="logo-text">管理后台</h2>
					</RouterLink>
				</div>
			</div>

			<div class="header-right">
				<!-- 通知 -->
				<Button icon="pi pi-bell" class="notification-btn" text>
					<i class="pi pi-bell"></i>
					<Badge value="3" severity="danger" class="notification-badge" />
				</Button>
				<!-- 主题切换按钮 -->
				<button @click="toggleTheme" class="theme-btn" :title="isDarkMode ? '切换到白天模式' : '切换到夜间模式'">
					<div :class="isDarkMode ? 'i-ic:baseline-light-mode' : 'i-ic:baseline-dark-mode'"></div>
				</button>

				<!-- 用户菜单 -->
				<div class="user-menu">
					<Button @click="toggleUserMenu" class="user-btn" text>
						<Avatar :label="currentUser.name.charAt(0)" class="user-avatar" shape="circle" />
						<span class="user-name">{{ currentUser.name }}</span>
						<i class="pi pi-chevron-down"></i>
					</Button>
					<Menu ref="userMenu" :model="userMenuItems" :popup="true" v-model:visible="userMenuVisible" />
				</div>
			</div>
		</header>

		<!-- 侧边栏 -->
		<Drawer v-model:visible="sidebarVisible" class="admin-sidebar" position="left">
			<template #header>
				<div class="sidebar-header">
					<h3>导航菜单</h3>
				</div>
			</template>

			<div class="sidebar-content">
				<PanelMenu :model="menuItems" class="admin-panel-menu" />
			</div>
		</Drawer>

		<!-- 主要内容区域 -->
		<main class="admin-main" :class="{ 'sidebar-open': sidebarVisible }">
			<!-- 面包屑导航 -->
			<div class="breadcrumb-container">
				<nav class="breadcrumb">
					<RouterLink to="/admin/dashboard" class="breadcrumb-item">
						<i class="pi pi-home"></i>
						首页
					</RouterLink>
					<span class="breadcrumb-separator">/</span>
					<span class="breadcrumb-current">{{ currentPageTitle }}</span>
				</nav>
			</div>

			<!-- 页面内容 -->
			<div class="page-content">
				<RouterView />
			</div>
		</main>
	</div>
</template>

<style scoped>
.admin-layout {
	@apply min-h-screen bg-gray-50;
}

/* 顶部导航栏 */
.admin-header {
	@apply fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4;
}

.header-left {
	@apply flex items-center space-x-4;
}

.sidebar-toggle {
	@apply text-gray-600 hover:text-blue-600;
}

.admin-logo .logo-link {
	@apply text-decoration-none;
}

.admin-logo .logo-text {
	@apply text-xl font-bold text-blue-600 m-0;
}

.header-right {
	@apply flex items-center space-x-4;
}

.notification-btn {
	@apply relative text-gray-600 hover:text-blue-600;
}

.notification-badge {
	@apply absolute -top-1 -right-1;
}

.user-menu {
	@apply relative;
}

.user-btn {
	@apply flex items-center space-x-2 text-gray-700 hover:text-blue-600;
}

.user-avatar {
	@apply bg-blue-600 text-white;
}

.user-name {
	@apply font-medium;
}

/* 侧边栏 */
.admin-sidebar {
	@apply w-64;
}

.sidebar-header {
	@apply p-4 border-b border-gray-200;
}

.sidebar-header h3 {
	@apply text-lg font-semibold text-gray-800 m-0;
}

.sidebar-content {
	@apply p-4;
}

/* PanelMenu 样式定制 */
.admin-panel-menu {
	@apply w-full;
}

.admin-panel-menu :deep(.p-panelmenu-panel) {
	@apply mb-2;
}

.admin-panel-menu :deep(.p-panelmenu-header) {
	@apply rounded-lg;
}

.admin-panel-menu :deep(.p-panelmenu-header-content) {
	@apply px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200;
}

.admin-panel-menu :deep(.p-panelmenu-content) {
	@apply border-none;
}

.admin-panel-menu :deep(.p-menuitem-link) {
	@apply px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 ml-4;
}

.admin-panel-menu :deep(.p-menuitem-icon) {
	@apply mr-3;
}

.admin-panel-menu :deep(.p-submenu-icon) {
	@apply ml-auto;
}

/* 主要内容区域 */
.admin-main {
	@apply pt-16 min-h-screen transition-all duration-300;
}

.admin-main.sidebar-open {
	@apply ml-64;
}

.breadcrumb-container {
	@apply bg-white border-b border-gray-200 px-6 py-4;
}

.breadcrumb {
	@apply flex items-center space-x-2 text-sm;
}

.breadcrumb-item {
	@apply text-blue-600 hover:text-blue-800 text-decoration-none flex items-center space-x-1;
}

.breadcrumb-separator {
	@apply text-gray-400;
}

.breadcrumb-current {
	@apply text-gray-600 font-medium;
}

.page-content {
	@apply p-6;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.admin-header {
		@apply px-2;
	}

	.header-left {
		@apply space-x-2;
	}

	.user-name {
		@apply hidden;
	}

	.admin-main {
		@apply ml-0;
	}

	.admin-main.sidebar-open {
		@apply ml-0;
	}

	.page-content {
		@apply p-4;
	}
}

.theme-btn {
	@apply flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200 bg-transparent border-none cursor-pointer;
}

.theme-btn div {
	@apply w-5 h-5;
}

.dark .theme-btn {
	@apply text-gray-300 hover:text-blue-400 hover:bg-gray-800;
}
</style>