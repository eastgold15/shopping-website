<template>
  <div class="site-config-page">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">网站配置</h1>
        <p class="text-gray-600 mt-1">管理网站的基本信息、导航、顶部和底部配置</p>
      </div>
      <div class="flex gap-2">
        <Button label="重置" icon="pi pi-refresh" severity="secondary" @click="resetConfigs" />
        <Button label="保存" icon="pi pi-save" @click="saveConfigs" :loading="saving" />
      </div>
    </div>

    <!-- 配置分类标签 -->
    <TabView v-model:activeIndex="activeTab" class="config-tabs">
      <!-- 基本设置 -->
      <TabPanel header="基本设置" value="1">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="field">
              <label for="site_name" class="block text-sm font-medium text-gray-700 mb-2">
                网站名称 <span class="text-red-500">*</span>
              </label>
              <InputText id="site_name" v-model="configs.site_name" placeholder="请输入网站名称" class="w-full"
                :class="{ 'p-invalid': errors.site_name }" />
              <small v-if="errors.site_name" class="p-error">{{ errors.site_name }}</small>
            </div>

            <div class="field">
              <label for="site_logo" class="block text-sm font-medium text-gray-700 mb-2">
                网站Logo
              </label>
              <InputText id="site_logo" v-model="configs.site_logo" placeholder="https://example.com/logo.png"
                class="w-full" />
              <small class="text-gray-500">请输入Logo图片的完整URL地址</small>
            </div>

            <div class="field">
              <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">
                货币单位
              </label>
              <Select id="currency" v-model="configs.currency" :options="currencyOptions" optionLabel="label"
                optionValue="value" placeholder="选择货币单位" class="w-full" />
            </div>
          </div>

          <div class="space-y-4">
          </div>

        </div>
      </TabPanel>

      <!-- SEO设置 -->
      <TabPanel header="SEO设置" value="2">
        <div class="space-y-6">
          <div class="field">
            <label for="site_keywords" class="block text-sm font-medium text-gray-700 mb-2">
              SEO关键词
            </label>
            <InputText id="site_keywords" v-model="configs.site_keywords" placeholder="外贸,服装,时尚,购物" class="w-full" />
            <small class="text-gray-500">多个关键词用逗号分隔</small>
          </div>

          <div class="field">
            <label for="site_description" class="block text-sm font-medium text-gray-700 mb-2">
              网站描述
            </label>
            <Textarea id="site_description" v-model="configs.site_description" placeholder="专业的外贸服装购物平台" rows="4"
              class="w-full" />
            <small class="text-gray-500">网站SEO描述，显示在搜索结果中</small>
          </div>
        </div>
      </TabPanel>


      <!-- 导航页配置 -->
      <TabPanel header="导航页配置" value="4">
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  导航菜单显示设置
                </label>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <Checkbox id="nav_home" v-model="configs.nav_home_enabled" :binary="true" />
                    <label for="nav_home" class="ml-2">显示首页导航</label>
                  </div>
                  <div class="flex items-center">
                    <Checkbox id="nav_products" v-model="configs.nav_products_enabled" :binary="true" />
                    <label for="nav_products" class="ml-2">显示产品导航</label>
                  </div>
                  <div class="flex items-center">
                    <Checkbox id="nav_categories" v-model="configs.nav_categories_enabled" :binary="true" />
                    <label for="nav_categories" class="ml-2">显示分类导航</label>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <div class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  其他导航设置
                </label>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <Checkbox id="nav_about" v-model="configs.nav_about_enabled" :binary="true" />
                    <label for="nav_about" class="ml-2">显示关于我们导航</label>
                  </div>
                  <div class="flex items-center">
                    <Checkbox id="nav_contact" v-model="configs.nav_contact_enabled" :binary="true" />
                    <label for="nav_contact" class="ml-2">显示联系我们导航</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- 网站顶部配置 -->
      <TabPanel header="网站顶部配置" value="5">
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="field">
                <label for="header_banner_text" class="block text-sm font-medium text-gray-700 mb-2">
                  顶部横幅文本
                </label>
                <InputText id="header_banner_text" v-model="configs.header_banner_text"
                  placeholder="FREE SHIPPING on orders over $59* details" class="w-full" />
                <small class="text-gray-500">显示在网站顶部的横幅信息</small>
              </div>


              <div class="field">
                <label for="free_shipping_threshold" class="block text-sm font-medium text-gray-700 mb-2">
                  免费配送门槛
                </label>
                <InputNumber id="free_shipping_threshold" v-model="configs.free_shipping_threshold" placeholder="59"
                  :min="0" :max="9999" class="w-full" />
                <small class="text-gray-500">订单金额超过此数值免费配送</small>
              </div>

              <div class="field">
                <label for="header_banner_link" class="block text-sm font-medium text-gray-700 mb-2">
                  横幅链接
                </label>
                <InputText id="header_banner_link" v-model="configs.header_banner_link" placeholder="/shipping-info"
                  class="w-full" />
                <small class="text-gray-500">点击横幅时跳转的链接地址</small>
              </div>

              <div class="field">
                <label for="header_track_order_text" class="block text-sm font-medium text-gray-700 mb-2">
                  追踪订单文本
                </label>
                <InputText id="header_track_order_text" v-model="configs.header_track_order_text"
                  placeholder="Track Order" class="w-full" />
              </div>

              <div class="field">
                <label for="header_track_order_link" class="block text-sm font-medium text-gray-700 mb-2">
                  追踪订单链接
                </label>
                <InputText id="header_track_order_link" v-model="configs.header_track_order_link"
                  placeholder="/track-order" class="w-full" />
              </div>
            </div>

            <div class="space-y-4">
              <div class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  帮助链接
                </label>
                <div class="space-y-3">
                  <div v-for="(link, index) in configs.header_help_links" :key="index" class="flex gap-2">
                    <InputText v-model="link.text" placeholder="链接文本" class="flex-1" />
                    <InputText v-model="link.url" placeholder="链接地址" class="flex-1" />
                    <Button type="button" icon="pi pi-trash" severity="danger" outlined
                      @click="removeHeaderHelpLink(index)" :disabled="configs.header_help_links.length <= 1" />
                  </div>
                  <Button type="button" icon="pi pi-plus" label="添加帮助链接" outlined @click="addHeaderHelpLink"
                    class="w-full" />
                </div>
              </div>

              <div class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  顶部功能设置
                </label>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <Checkbox id="header_search" v-model="configs.header_search_enabled" :binary="true" />
                    <label for="header_search" class="ml-2">显示搜索框</label>
                  </div>
                  <div class="flex items-center">
                    <Checkbox id="header_cart" v-model="configs.header_cart_enabled" :binary="true" />
                    <label for="header_cart" class="ml-2">显示购物车图标</label>
                  </div>
                  <div class="flex items-center">
                    <Checkbox id="header_user_menu" v-model="configs.header_user_menu_enabled" :binary="true" />
                    <label for="header_user_menu" class="ml-2">显示用户菜单</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- 底部配置 -->
      <TabPanel header="底部配置" value="6">
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">

              <div class="field">
                <label for="icp_number" class="block text-sm font-medium text-gray-700 mb-2">
                  ICP备案号
                </label>
                <InputText id="icp_number" v-model="configs.icp_number" placeholder="京ICP备12345678号" class="w-full" />
              </div>



              <div class="field">
                <label for="footer_copyright" class="block text-sm font-medium text-gray-700 mb-2">
                  版权信息
                </label>
                <Textarea id="footer_copyright" v-model="configs.footer_copyright"
                  placeholder="© 2024 WWW.APPARELCITY.COM.CN All Rights Reserved" rows="3" class="w-full" />
                <small class="text-gray-500">显示在网站底部的版权信息</small>
              </div>

              <div class="field">
                <label for="footer_back_to_top_text" class="block text-sm font-medium text-gray-700 mb-2">
                  返回顶部文本
                </label>
                <InputText id="footer_back_to_top_text" v-model="configs.footer_back_to_top_text"
                  placeholder="Back to top" class="w-full" />
              </div>


            </div>

            <div class="space-y-4">
              <div class="field">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  底部栏目
                </label>
                <div class="space-y-4">
                  <div v-for="(section, sectionIndex) in configs.footer_sections" :key="sectionIndex"
                    class="border rounded-lg p-4">
                    <div class="flex justify-between items-center mb-3">
                      <h4 class="font-medium text-gray-800">栏目 {{ sectionIndex + 1 }}</h4>
                      <Button type="button" icon="pi pi-trash" severity="danger" outlined size="small"
                        @click="removeFooterSection(sectionIndex)" :disabled="configs.footer_sections.length <= 1" />
                    </div>

                    <div class="mb-3">
                      <label class="block text-sm font-medium text-gray-600 mb-1">栏目标题</label>
                      <InputText v-model="section.title" placeholder="例如：For You" class="w-full" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-600 mb-2">栏目链接</label>
                      <div class="space-y-2">
                        <div v-for="(link, linkIndex) in section.links" :key="linkIndex" class="flex gap-2">
                          <InputText v-model="link.text" placeholder="链接文本" class="flex-1" />
                          <InputText v-model="link.url" placeholder="链接地址" class="flex-1" />
                          <Button type="button" icon="pi pi-trash" severity="danger" outlined size="small"
                            @click="removeFooterLink(sectionIndex, linkIndex)" :disabled="section.links.length <= 1" />
                        </div>
                        <Button type="button" icon="pi pi-plus" label="添加链接" outlined size="small"
                          @click="addFooterLink(sectionIndex)" class="w-full" />
                      </div>
                    </div>
                  </div>

                  <Button type="button" icon="pi pi-plus" label="添加栏目" outlined @click="addFooterSection"
                    class="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import TabPanel from 'primevue/tabpanel'
import TabView from 'primevue/tabview'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { onMounted, reactive, ref } from 'vue'
import { client } from '@/share/useTreaty'

// 组合式API
const toast = useToast()

// 响应式数据
const activeTab = ref(0)
const saving = ref(false)
const loading = ref(false)

// 配置数据
const configs = reactive({
  // 基本设置
  site_name: '',
  site_logo: '',
  site_keywords: '',
  site_description: '',


  icp_number: '',
  copyright: '',
  header_notice: '',
  free_shipping_threshold: 59,
  currency: 'USD',

  // 导航页配置
  nav_home_enabled: true,
  nav_products_enabled: true,
  nav_categories_enabled: true,
  nav_about_enabled: true,
  nav_contact_enabled: true,

  // 网站顶部配置
  header_banner_text: '',
  header_banner_link: '',
  header_track_order_text: '',
  header_track_order_link: '',
  header_help_links: [{ text: 'Help', url: '/help' }],
  header_search_enabled: true,
  header_cart_enabled: true,
  header_user_menu_enabled: true,

  // 底部配置
  footer_copyright: '',
  footer_back_to_top_text: '',
  footer_sections: [
    {
      title: 'For You',
      links: [{ text: 'Favorites', url: '/favorites' }]
    }
  ],
})

// 原始配置数据（用于重置）
const originalConfigs = reactive({ ...configs })

// 表单验证错误
const errors = reactive({
  site_name: '',

})

// 货币选项
const currencyOptions = [
  { label: '美元 (USD)', value: 'USD' },
  { label: '人民币 (CNY)', value: 'CNY' },
  { label: '欧元 (EUR)', value: 'EUR' },
  { label: '英镑 (GBP)', value: 'GBP' }
]

// 添加顶部帮助链接
const addHeaderHelpLink = () => {
  configs.header_help_links.push({ text: '', url: '' })
}

// 删除顶部帮助链接
const removeHeaderHelpLink = (index: number) => {
  if (configs.header_help_links.length > 1) {
    configs.header_help_links.splice(index, 1)
  }
}

// 添加底部栏目
const addFooterSection = () => {
  configs.footer_sections.push({
    title: '',
    links: [{ text: '', url: '' }]
  })
}

// 删除底部栏目
const removeFooterSection = (index: number) => {
  if (configs.footer_sections.length > 1) {
    configs.footer_sections.splice(index, 1)
  }
}

// 添加底部链接
const addFooterLink = (sectionIndex: number) => {
  configs.footer_sections[sectionIndex].links.push({ text: '', url: '' })
}

// 删除底部链接
const removeFooterLink = (sectionIndex: number, linkIndex: number) => {
  const section = configs.footer_sections[sectionIndex]
  if (section.links.length > 1) {
    section.links.splice(linkIndex, 1)
  }
}

// 加载配置数据
const loadConfigs = async () => {
  try {
    loading.value = true

    const response = await client.api.siteConfigs.get()
    if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
      // 将配置数组转换为对象
      response.data.data.forEach((config: any) => {
        if (config.key in configs) {
          // 处理特殊类型
          if (config.key === 'free_shipping_threshold') {
            configs[config.key as keyof typeof configs] = Number(config.value) || 59
          } else if (config.key === 'header_help_links' || config.key === 'footer_sections') {
            try {
              configs[config.key as keyof typeof configs] = JSON.parse(config.value || '[]')
            } catch {
              // 如果解析失败，使用默认值
              if (config.key === 'header_help_links') {
                configs.header_help_links = [{ text: 'Help', url: '/help' }]
              } else if (config.key === 'footer_sections') {
                configs.footer_sections = [{ title: 'For You', links: [{ text: 'Favorites', url: '/favorites' }] }]
              }
            }
          } else if (config.key.includes('_enabled')) {
            configs[config.key as keyof typeof configs] = config.value === 'true'
          } else {
            configs[config.key as keyof typeof configs] = config.value || ''
          }
        }
      })

      // 保存原始数据
      Object.assign(originalConfigs, configs)
    } else {
      console.error('API返回的数据格式错误:', response.data)
      toast.add({
        severity: 'error',
        summary: '错误',
        detail: '配置数据格式错误',
        life: 1000
      })
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '加载配置失败',
      life: 1000
    })
  } finally {
    loading.value = false
  }
}

// 验证表单
const validateForm = () => {
  let isValid = true

  // 清空错误
  errors.site_name = ''


  // 验证网站名称
  if (!configs.site_name.trim()) {
    errors.site_name = '网站名称不能为空'
    isValid = false
  }



  return isValid
}

// 保存配置
const saveConfigs = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: '验证失败',
      detail: '请检查表单中的错误',
      life: 1000
    })
    return
  }

  try {
    saving.value = true

    // 准备批量更新数据
    const updateData = Object.entries(configs).map(([key, value]) => {
      let stringValue = String(value)

      // 处理特殊类型
      if (key === 'header_help_links' || key === 'footer_sections') {
        stringValue = JSON.stringify(value)
      } else if (typeof value === 'boolean') {
        stringValue = value ? 'true' : 'false'
      }

      return {
        key,
        value: stringValue
      }
    })

    const response = await client.api.siteConfigs.batch.patch(updateData)

    if (response.data && response.data.code === 200) {
      toast.add({
        severity: 'success',
        summary: '成功',
        detail: '配置保存成功',
        life: 1000
      })

      // 更新原始数据
      Object.assign(originalConfigs, configs)
    } else {
      throw new Error(response.data?.message || '保存失败')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '保存配置失败',
      life: 1000
    })
  } finally {
    saving.value = false
  }
}

// 重置配置
const resetConfigs = () => {
  Object.assign(configs, originalConfigs)

  // 清空错误
  errors.site_name = ''


  toast.add({
    severity: 'info',
    summary: '提示',
    detail: '配置已重置',
    life: 1000
  })
}

// // 初始化默认配置
// const initializeConfigs = async () => {
//   try {
//     const response = await client.api['site-configs'].initialize.post()

//     if (response.data && response.data.code === 200) {
//       await loadConfigs()
//       toast.add({
//         severity: 'success',
//         summary: '成功',
//         detail: '默认配置初始化成功',
//         life: 1000
//       })
//     }
//   } catch (error) {
//     console.error('初始化配置失败:', error)
//   }
// }

// 组件挂载时加载数据
onMounted(async () => {
  await loadConfigs()

  // // 如果没有配置数据，初始化默认配置
  // if (!configs.site_name) {
  //   await initializeConfigs()
  // }
})
</script>

<style scoped>
.site-config-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.config-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.field {
  margin-bottom: 1rem;
}

.p-tabview-panels {
  padding: 2rem;
}

.p-error {
  color: #e24c4c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.p-invalid {
  border-color: #e24c4c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .site-config-page {
    padding: 16px;
  }

  .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .p-tabview-panels {
    padding: 1rem;
  }
}
</style>