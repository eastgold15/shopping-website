// 统一的主题配置，使用 PrimeVue definePreset + UnoCSS

// 基础颜色定义 (HSL 格式)
export const colors = {
  // 主色调 - 蓝色系
  primary: {
    50: '240 4.8% 95.9%',
    100: '240 4.8% 95.9%',
    200: '240 4.8% 95.9%',
    300: '240 4.8% 95.9%',
    400: '240 5.9% 10%',
    500: '240 5.9% 10%',
    600: '240 5.9% 10%',
    700: '240 5.9% 10%',
    800: '240 5.9% 10%',
    900: '240 5.9% 10%',
    950: '240 10% 3.9%',
  },
  // 辅助色
  accent: {
    50: '240 4.8% 95.9%',
    100: '240 4.8% 95.9%',
    200: '240 4.8% 95.9%',
    300: '240 4.8% 95.9%',
    400: '240 4.8% 95.9%',
    500: '240 4.8% 95.9%',
    600: '240 4.8% 95.9%',
    700: '240 4.8% 95.9%',
    800: '240 4.8% 95.9%',
    900: '240 4.8% 95.9%',
    950: '240 4.8% 95.9%',
  },
  // 危险色
  destructive: {
    50: '0 84.2% 60.2%',
    100: '0 84.2% 60.2%',
    200: '0 84.2% 60.2%',
    300: '0 84.2% 60.2%',
    400: '0 84.2% 60.2%',
    500: '0 84.2% 60.2%',
    600: '0 84.2% 60.2%',
    700: '0 84.2% 60.2%',
    800: '0 84.2% 60.2%',
    900: '0 84.2% 60.2%',
    950: '0 84.2% 60.2%',
  },
  // 柔和色
  muted: {
    50: '240 4.8% 95.9%',
    100: '240 4.8% 95.9%',
    200: '240 4.8% 95.9%',
    300: '240 4.8% 95.9%',
    400: '240 4.8% 95.9%',
    500: '240 4.8% 95.9%',
    600: '240 3.8% 46.1%',
    700: '240 3.8% 46.1%',
    800: '240 3.8% 46.1%',
    900: '240 3.8% 46.1%',
    950: '240 3.8% 46.1%',
  },
}

// UnoCSS CSS 变量 (用于 shadcn/ui 和自定义组件)
export const lightTheme = {
  "color-scheme": "light",
  
  // shadcn/ui CSS 变量
  "--background": "0 0% 100%",
  "--foreground": "240 10% 3.9%",
  "--card": "0 0% 100%",
  "--card-foreground": "240 10% 3.9%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "240 10% 3.9%",
  "--primary": "240 5.9% 10%",
  "--primary-foreground": "0 0% 98%",
  "--secondary": "240 4.8% 95.9%",
  "--secondary-foreground": "240 5.9% 10%",
  "--muted": "240 4.8% 95.9%",
  "--muted-foreground": "240 3.8% 46.1%",
  "--accent": "240 4.8% 95.9%",
  "--accent-foreground": "240 5.9% 10%",
  "--destructive": "0 84.2% 60.2%",
  "--destructive-foreground": "0 0% 98%",
  "--border": "240 5.9% 90%",
  "--input": "240 5.9% 90%",
  "--ring": "240 5.9% 10%",
  "--radius": "0.5rem",
  
  // 自定义布局变量
  "--g-main-area-bg": "hsl(0 0% 95%)",
  "--g-header-bg": "hsl(var(--background))",
  "--g-header-color": "hsl(var(--foreground))",
  "--g-header-menu-color": "hsl(var(--accent-foreground))",
  "--g-header-menu-hover-bg": "hsl(var(--accent))",
  "--g-header-menu-hover-color": "hsl(var(--accent-foreground))",
  "--g-header-menu-active-bg": "hsl(var(--primary))",
  "--g-header-menu-active-color": "hsl(var(--primary-foreground))",
  
  "--g-main-sidebar-bg": "hsl(var(--background))",
  "--g-main-sidebar-menu-color": "hsl(var(--accent-foreground))",
  "--g-main-sidebar-menu-hover-bg": "hsl(var(--accent))",
  "--g-main-sidebar-menu-hover-color": "hsl(var(--accent-foreground))",
  "--g-main-sidebar-menu-active-bg": "hsl(var(--primary))",
  "--g-main-sidebar-menu-active-color": "hsl(var(--primary-foreground))",
  
  "--g-sub-sidebar-bg": "hsl(var(--background))",
  "--g-sub-sidebar-menu-color": "hsl(var(--accent-foreground))",
  "--g-sub-sidebar-menu-hover-bg": "hsl(var(--accent))",
  "--g-sub-sidebar-menu-hover-color": "hsl(var(--accent-foreground))",
  "--g-sub-sidebar-menu-active-bg": "hsl(var(--primary))",
  "--g-sub-sidebar-menu-active-color": "hsl(var(--primary-foreground))",
  
  "--g-tabbar-bg": "var(--g-main-area-bg)",
  "--g-tabbar-dividers-bg": "hsl(var(--accent-foreground) / 50%)",
  "--g-tabbar-tab-color": "hsl(var(--accent-foreground) / 50%)",
  "--g-tabbar-tab-hover-bg": "hsl(var(--border))",
  "--g-tabbar-tab-hover-color": "hsl(var(--accent-foreground) / 50%)",
  "--g-tabbar-tab-active-bg": "hsl(var(--background))",
  "--g-tabbar-tab-active-color": "hsl(var(--foreground))",
  
  "--g-toolbar-bg": "hsl(var(--background))",
}

export const darkTheme = {
  "color-scheme": "dark",
  
  // shadcn/ui CSS 变量
  "--background": "240 10% 3.9%",
  "--foreground": "0 0% 98%",
  "--card": "240 10% 3.9%",
  "--card-foreground": "0 0% 98%",
  "--popover": "240 10% 3.9%",
  "--popover-foreground": "0 0% 98%",
  "--primary": "0 0% 98%",
  "--primary-foreground": "240 5.9% 10%",
  "--secondary": "240 3.7% 15.9%",
  "--secondary-foreground": "0 0% 98%",
  "--muted": "240 3.7% 15.9%",
  "--muted-foreground": "240 5% 64.9%",
  "--accent": "240 3.7% 15.9%",
  "--accent-foreground": "0 0% 98%",
  "--destructive": "0 62.8% 30.6%",
  "--destructive-foreground": "0 0% 98%",
  "--border": "240 3.7% 15.9%",
  "--input": "240 3.7% 15.9%",
  "--ring": "240 4.9% 83.9%",
  "--radius": "0.5rem",
  
  // 自定义布局变量
  "--g-main-area-bg": "hsl(var(--background))",
  "--g-header-bg": "hsl(var(--background))",
  "--g-header-color": "hsl(var(--foreground))",
  "--g-header-menu-color": "hsl(var(--muted-foreground))",
  "--g-header-menu-hover-bg": "hsl(var(--muted))",
  "--g-header-menu-hover-color": "hsl(var(--muted-foreground))",
  "--g-header-menu-active-bg": "hsl(var(--accent))",
  "--g-header-menu-active-color": "hsl(var(--accent-foreground))",
  
  "--g-main-sidebar-bg": "hsl(var(--background))",
  "--g-main-sidebar-menu-color": "hsl(var(--muted-foreground))",
  "--g-main-sidebar-menu-hover-bg": "hsl(var(--muted))",
  "--g-main-sidebar-menu-hover-color": "hsl(var(--muted-foreground))",
  "--g-main-sidebar-menu-active-bg": "hsl(var(--accent))",
  "--g-main-sidebar-menu-active-color": "hsl(var(--accent-foreground))",
  
  "--g-sub-sidebar-bg": "hsl(var(--background))",
  "--g-sub-sidebar-menu-color": "hsl(var(--muted-foreground))",
  "--g-sub-sidebar-menu-hover-bg": "hsl(var(--muted))",
  "--g-sub-sidebar-menu-hover-color": "hsl(var(--muted-foreground))",
  "--g-sub-sidebar-menu-active-bg": "hsl(var(--accent))",
  "--g-sub-sidebar-menu-active-color": "hsl(var(--accent-foreground))",
  
  "--g-tabbar-bg": "var(--g-main-area-bg)",
  "--g-tabbar-dividers-bg": "hsl(var(--accent-foreground) / 50%)",
  "--g-tabbar-tab-color": "hsl(var(--accent-foreground) / 50%)",
  "--g-tabbar-tab-hover-bg": "hsl(var(--accent) / 50%)",
  "--g-tabbar-tab-hover-color": "hsl(var(--accent-foreground) / 50%)",
  "--g-tabbar-tab-active-bg": "hsl(var(--secondary))",
  "--g-tabbar-tab-active-color": "hsl(var(--foreground))",
  
  "--g-toolbar-bg": "hsl(var(--background))",
}

// 主题切换函数
export function applyTheme(theme: 'light' | 'dark') {
  const themeConfig = theme === 'light' ? lightTheme : darkTheme;
  const root = document.documentElement;
  
  // 应用所有 CSS 变量
  Object.entries(themeConfig).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // 应用 dark 类到 html 元素
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
