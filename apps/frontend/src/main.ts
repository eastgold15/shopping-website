import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import 'primeicons/primeicons.css'
import 'virtual:uno.css'

import App from '@frontend/App.vue'
import router from '@frontend/router'
import { applyTheme } from '@frontend/themes'
import { getCurrentPreset } from '@frontend/themes/primevue'

const app = createApp(App)

// 应用主题
const currentTheme = localStorage.getItem('theme') || 'light'
applyTheme(currentTheme as 'light' | 'dark')

app.use(PrimeVue, {
  theme: {
    preset: getCurrentPreset(currentTheme as 'light' | 'dark'),
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false,
    }
  },
  ripple: true,
  inputStyle: 'outlined',
  zIndex: {
    modal: 1100,
    overlay: 1000,
    menu: 1000,
    tooltip: 1100
  }
})
app.use(ConfirmationService)
app.use(ToastService)
app.directive('tooltip', Tooltip)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Button', Button)
app.use(router)

app.mount('#app')

// 监听主题变化
window.addEventListener('storage', (e) => {
  if (e.key === 'theme') {
    const newTheme = e.newValue || 'light'
    applyTheme(newTheme as 'light' | 'dark')
  }
})

// 提供主题切换函数到全局
app.config.globalProperties.$toggleTheme = () => {
  const currentTheme = localStorage.getItem('theme') || 'light'
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', newTheme)
  applyTheme(newTheme as 'light' | 'dark')
  
  // 触发主题变化事件
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'theme',
    newValue: newTheme,
    oldValue: currentTheme,
    storageArea: localStorage
  }))
}