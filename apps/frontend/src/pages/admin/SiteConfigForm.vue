<script setup lang="ts">

import type { SelectSiteConfigVo } from "@backend/types";
import { useCmsApi } from "@frontend/utils/handleApi";
import { Form } from '@primevue/forms';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { nextTick, onMounted, ref } from 'vue';
import { z } from 'zod';

// 组合式API
const toast = useToast();
const formRef = ref();

// 响应式数据
const activeTab = ref(0);
const saving = ref(false);
const loading = ref(false);

// 货币选项
const currencyOptions = [
  { label: "美元 (USD)", value: "USD" },
  { label: "人民币 (CNY)", value: "CNY" },
  { label: "欧元 (EUR)", value: "EUR" },
  { label: "英镑 (GBP)", value: "GBP" },
];

// 帮助链接和底部栏目的响应式数据
const headerHelpLinks = ref([{ text: "Help", url: "/help" }]);
export interface footerLink {
  title: string,
  links: {
    text: string,
    url: string
  }[]
}
const footerSections = ref<footerLink[]>([
  {
    title: "For You",
    links: [{ text: "Favorites", url: "/favorites" }],
  },
]);

// 表单初始值
const initialValues = ref({
  // 基本设置
  site_name: "",
  site_logo: "",
  currency: "USD",

  // SEO设置
  site_keywords: "",
  site_description: "",

  // 导航页配置
  nav_home_enabled: true,
  nav_products_enabled: true,
  nav_categories_enabled: true,
  nav_about_enabled: true,
  nav_contact_enabled: true,

  // 网站顶部配置
  header_banner_text: "",
  header_banner_link: "",
  header_track_order_text: "",
  header_track_order_link: "",
  free_shipping_threshold: 59,
  header_search_enabled: true,
  header_cart_enabled: true,
  header_user_menu_enabled: true,

  // 底部配置
  icp_number: "",
  footer_copyright: "",
  footer_back_to_top_text: "",

  // 伙伴介绍
  partners_intro_paragraphs: ""
});

// 表单验证规则
const resolver = zodResolver(
  z.object({
    // 基本设置验证
    site_name: z.string().optional(),
    site_logo: z.string().optional(),
    currency: z.string().min(1, { message: '请选择货币单位' }),

    // SEO设置验证
    site_keywords: z.string().optional(),
    site_description: z.string().optional(),

    // 导航页配置验证
    nav_home_enabled: z.boolean().optional(),
    nav_products_enabled: z.boolean().optional(),
    nav_categories_enabled: z.boolean().optional(),
    nav_about_enabled: z.boolean().optional(),
    nav_contact_enabled: z.boolean().optional(),

    // 网站顶部配置验证
    header_banner_text: z.string().optional(),
    header_banner_link: z.string().optional(),
    header_track_order_text: z.string().optional(),
    header_track_order_link: z.string().optional(),
    free_shipping_threshold: z.number().min(0, { message: '免费配送门槛不能小于0' }).optional(),
    header_search_enabled: z.boolean().optional(),
    header_cart_enabled: z.boolean().optional(),
    header_user_menu_enabled: z.boolean().optional(),

    // 底部配置验证
    icp_number: z.string().optional(),
    footer_copyright: z.string().optional(),
    footer_back_to_top_text: z.string().optional(),

    // 伙伴介绍验证
    partners_intro_paragraphs: z.string().optional(),
  })
);

// 添加顶部帮助链接
const addHeaderHelpLink = () => {
  headerHelpLinks.value.push({ text: "", url: "" });
};

// 删除顶部帮助链接
const removeHeaderHelpLink = (index: number) => {
  if (headerHelpLinks.value.length > 1) {
    headerHelpLinks.value.splice(index, 1);
  }
};

// 添加底部栏目
const addFooterSection = () => {
  footerSections.value.push({
    title: "",
    links: [{ text: "", url: "" }],
  });
};

// 删除底部栏目
const removeFooterSection = (index: number) => {
  if (footerSections.value.length > 1) {
    footerSections.value.splice(index, 1);
  }
};

// 添加底部链接
const addFooterLink = (sectionIndex: number) => {
  footerSections?.value[sectionIndex]?.links.push({ text: "", url: "" });
};

// 删除底部链接
const removeFooterLink = (sectionIndex: number, linkIndex: number) => {
  const section = footerSections.value[sectionIndex];
  if (section?.links?.length > 1) {
    section.links.splice(linkIndex, 1);
  }
};

// 配置处理策略映射表
const configProcessors = {
  // 数字类型处理器
  number: (value: string, defaultValue: number = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  },

  // 布尔类型处理器
  boolean: (value: string, defaultValue: boolean = false) => {
    return value === "true" || (value === "" && defaultValue);
  },

  // JSON数组类型处理器
  jsonArray: (value: string, defaultValue: any[] = []) => {
    try {
      return JSON.parse(value || JSON.stringify(defaultValue));
    } catch {
      return defaultValue;
    }
  },

  // 字符串类型处理器
  string: (value: string, defaultValue: string = "") => {
    return value || defaultValue;
  }
};


const configTypeMap: Record<string, {
  type: keyof typeof configProcessors;
  defaultValue?: any;
  target?: 'form' | 'ref'; // 指定数据存储位置
  refName?: string; // 如果target是ref，指定ref的名称
}> = {
  // 数字类型配置
  free_shipping_threshold: { type: 'number', defaultValue: 59 },

  // 布尔类型配置（所有_enabled结尾的字段）
  nav_home_enabled: { type: 'boolean', defaultValue: true },
  nav_products_enabled: { type: 'boolean', defaultValue: true },
  nav_categories_enabled: { type: 'boolean', defaultValue: true },
  nav_about_enabled: { type: 'boolean', defaultValue: true },
  nav_contact_enabled: { type: 'boolean', defaultValue: true },
  header_search_enabled: { type: 'boolean', defaultValue: true },
  header_cart_enabled: { type: 'boolean', defaultValue: true },
  header_user_menu_enabled: { type: 'boolean', defaultValue: true },

  // JSON数组类型配置（存储到ref中）
  header_help_links: {
    type: 'jsonArray',
    defaultValue: [{ text: "Help", url: "/help" }],
    target: 'ref',
    refName: 'headerHelpLinks'
  },
  footer_sections: {
    type: 'jsonArray',
    defaultValue: [{
      title: "For You",
      links: [{ text: "Favorites", url: "/favorites" }]
    }],
    target: 'ref',
    refName: 'footerSections'
  }
};

// 通用配置处理函数
const processConfigValue = (key: string, value: string) => {
  const config = configTypeMap[key];

  if (!config) {
    // 默认按字符串处理
    return configProcessors.string(value);
  }

  const processor = configProcessors[config.type];
  return processor(value, config.defaultValue);
};

// 加载配置数据
const loadConfigs = async () => {
  try {
    loading.value = true;

    const api = useCmsApi();
    const { code, message, data } = await api.siteConfigs.all({ category: 'site' });
    if (code === 200) {
      // 将配置数组转换为对象并更新初始值
      const configData: any = {};

      data.forEach((config: SelectSiteConfigVo) => {
        // 检查配置是否在initialValues中或者在configTypeMap中定义
        if (config.key in initialValues.value || config.key in configTypeMap) {
          const configMeta = configTypeMap[config.key];
          const processedValue = processConfigValue(config.key, config.value);

          // 根据配置决定存储位置
          if (configMeta?.target === 'ref' && configMeta.refName) {
            // 存储到指定的ref中
            const targetRef = configMeta.refName === 'headerHelpLinks' ? headerHelpLinks : footerSections;
            targetRef.value = processedValue;
          } else {
            // 存储到表单数据中
            configData[config.key] = processedValue;
          }
        }
      });

      // 更新初始值
      Object.assign(initialValues.value, configData);

      // 强制重置表单以应用新的初始值
      nextTick(() => {
        if (formRef.value) {
          formRef.value.reset();
        }
      });
    } else {
      console.error("API返回的数据格式错误:", { code, message, data });
      toast.add({
        severity: "error",
        summary: "错误",
        detail: "配置数据格式错误",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("加载配置失败:", error);
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "加载配置失败",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// 配置序列化策略映射表
const configSerializers = {
  // 数字类型序列化器
  number: (value: number) => String(value),

  // 布尔类型序列化器
  boolean: (value: boolean) => value ? "true" : "false",

  // JSON数组类型序列化器
  jsonArray: (value: any[]) => JSON.stringify(value),

  // 字符串类型序列化器
  string: (value: string) => value
};

// 通用配置序列化函数
const serializeConfigValue = (key: string, value: any) => {
  const config = configTypeMap[key];

  if (!config) {
    // 默认按字符串处理
    return configSerializers.string(String(value));
  }

  const serializer = configSerializers[config.type];
  return serializer(value);
};

// 表单提交处理
const onFormSubmit = async (formData: any) => {
  if (formData.valid) {
    try {
      saving.value = true;

      // 准备批量更新数据 - 合并表单数据和初始值
      const allFormData = { ...initialValues.value, ...formData.values };
      const updateData = Object.entries(allFormData).map(([key, value]) => ({
        key,
        value: serializeConfigValue(key, value)
      }));

      console.log('提交的表单数据:', allFormData);
      console.log('序列化后的更新数据:', updateData);

      // 添加ref中的配置数据
      const refConfigs = [
        { key: "header_help_links", value: headerHelpLinks.value },
        { key: "footer_sections", value: footerSections.value }
      ];

      refConfigs.forEach(({ key, value }) => {
        updateData.push({
          key,
          value: serializeConfigValue(key, value)
        });
      });

      const api = useCmsApi();
      const { code, data, message } = await api.siteConfigs.batchUpdate(updateData);

      if (code === 200) {
        // 保存成功后重新加载配置数据，确保表单显示最新值
        await loadConfigs();
        toast.add({
          severity: "success",
          summary: "成功",
          detail: "配置保存成功",
          life: 3000,
        });
      } else {
        throw new Error(message || "保存失败");
      }
    } catch (error) {
      console.error("保存配置失败:", error);
      toast.add({
        severity: "error",
        summary: "错误",
        detail: "保存配置失败",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  }
};

// 使用表单实例提交
const submitForm = () => {
  if (formRef.value) {
    formRef.value.submit();
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.reset();
    // 重置额外的响应式数据
    headerHelpLinks.value = [{ text: "Help", url: "/help" }];
    footerSections.value = [
      {
        title: "For You",
        links: [{ text: "Favorites", url: "/favorites" }],
      },
    ];

    toast.add({
      severity: "info",
      summary: "提示",
      detail: "表单已重置",
      life: 3000,
    });
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadConfigs();
});
</script>

<template>
  <div class="site-config-page">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">网站配置</h1>
        <p class="text-gray-600 mt-1">管理网站的基本信息、导航、顶部和底部配置</p>
      </div>
      <div class="flex gap-2">
        <Button label="重置" icon="pi pi-refresh" severity="secondary" @click="resetForm" :disabled="loading || saving" />
        <Button label="保存" icon="pi pi-save" @click="submitForm" :loading="saving" :disabled="loading" />
      </div>
    </div>

    <!-- Toast消息 -->
    <Toast />

    <!-- 表单容器 -->
    <Form ref="formRef" v-slot="$form" :initialValues="initialValues" :resolver="resolver" class="w-full"
      @submit="onFormSubmit">
      <!-- 配置分类标签 -->
      <TabView v-model:activeIndex="activeTab" class="config-tabs">
        <!-- 基本设置 -->
        <TabPanel header="基本设置" value="1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="flex flex-col gap-1">
                <label for="site_name" class="block text-sm font-medium text-gray-700 mb-2">
                  网站名称 <span class="text-red-500">*</span>
                </label>
                <InputText name="site_name" placeholder="请输入网站名称" fluid />
                <Message v-if="$form.site_name?.invalid" severity="error" size="small" variant="simple">
                  {{ $form.site_name.error.message }}
                </Message>
              </div>

              <div class="flex flex-col gap-1">
                <label for="site_logo" class="block text-sm font-medium text-gray-700 mb-2">
                  网站Logo
                </label>
                <InputText name="site_logo" placeholder="https://example.com/logo.png" fluid />
                <small class="text-gray-500">请输入Logo图片的完整URL地址</small>
              </div>

              <div class="flex flex-col gap-1">
                <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">
                  货币单位
                </label>
                <Select name="currency" :options="currencyOptions" optionLabel="label" optionValue="value"
                  placeholder="选择货币单位" fluid />
              </div>
            </div>
            <div class="space-y-4">
              <!-- 预留空间 -->
            </div>
          </div>
        </TabPanel>

        <!-- SEO设置 -->
        <TabPanel header="SEO设置" value="2">
          <div class="space-y-6">
            <div class="flex flex-col gap-1">
              <label for="site_keywords" class="block text-sm font-medium text-gray-700 mb-2">
                SEO关键词
              </label>
              <InputText name="site_keywords" placeholder="外贸,服装,时尚,购物" fluid />
              <small class="text-gray-500">多个关键词用逗号分隔</small>
            </div>

            <div class="flex flex-col gap-1">
              <label for="site_description" class="block text-sm font-medium text-gray-700 mb-2">
                网站描述
              </label>
              <Textarea name="site_description" placeholder="专业的外贸服装购物平台" rows="4" fluid />
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
                      <Checkbox name="nav_home_enabled" :binary="true" />
                      <label class="ml-2">显示首页导航</label>
                    </div>
                    <div class="flex items-center">
                      <Checkbox name="nav_products_enabled" :binary="true" />
                      <label class="ml-2">显示产品导航</label>
                    </div>
                    <div class="flex items-center">
                      <Checkbox name="nav_categories_enabled" :binary="true" />
                      <label class="ml-2">显示分类导航</label>
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
                      <Checkbox name="nav_about_enabled" :binary="true" />
                      <label class="ml-2">显示关于我们导航</label>
                    </div>
                    <div class="flex items-center">
                      <Checkbox name="nav_contact_enabled" :binary="true" />
                      <label class="ml-2">显示联系我们导航</label>
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
                <div class="flex flex-col gap-1">
                  <label for="header_banner_text" class="block text-sm font-medium text-gray-700 mb-2">
                    顶部横幅文本
                  </label>
                  <InputText name="header_banner_text" placeholder="FREE SHIPPING on orders over $59* details" fluid />
                  <small class="text-gray-500">显示在网站顶部的横幅信息</small>
                </div>

                <div class="flex flex-col gap-1">
                  <label for="free_shipping_threshold" class="block text-sm font-medium text-gray-700 mb-2">
                    免费配送门槛
                  </label>
                  <InputNumber name="free_shipping_threshold" placeholder="59" :min="0" :max="9999" fluid />
                  <small class="text-gray-500">订单金额超过此数值免费配送</small>
                </div>

                <div class="flex flex-col gap-1">
                  <label for="header_banner_link" class="block text-sm font-medium text-gray-700 mb-2">
                    横幅链接
                  </label>
                  <InputText name="header_banner_link" placeholder="/shipping-info" fluid />
                  <small class="text-gray-500">点击横幅时跳转的链接地址</small>
                </div>

                <div class="flex flex-col gap-1">
                  <label for="header_track_order_text" class="block text-sm font-medium text-gray-700 mb-2">
                    追踪订单文本
                  </label>
                  <InputText name="header_track_order_text" placeholder="Track Order" fluid />
                </div>

                <div class="flex flex-col gap-1">
                  <label for="header_track_order_link" class="block text-sm font-medium text-gray-700 mb-2">
                    追踪订单链接
                  </label>
                  <InputText name="header_track_order_link" placeholder="/track-order" fluid />
                </div>
              </div>

              <div class="space-y-4">
                <div class="field">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    帮助链接
                  </label>
                  <div class="space-y-3">
                    <div v-for="(link, index) in headerHelpLinks" :key="index" class="flex gap-2">
                      <InputText v-model="link.text" placeholder="链接文本" class="flex-1" />
                      <InputText v-model="link.url" placeholder="链接地址" class="flex-1" />
                      <Button type="button" icon="pi pi-trash" severity="danger" outlined
                        @click="removeHeaderHelpLink(index)" :disabled="headerHelpLinks.length <= 1" />
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
                      <Checkbox name="header_search_enabled" :binary="true" />
                      <label class="ml-2">显示搜索框</label>
                    </div>
                    <div class="flex items-center">
                      <Checkbox name="header_cart_enabled" :binary="true" />
                      <label class="ml-2">显示购物车图标</label>
                    </div>
                    <div class="flex items-center">
                      <Checkbox name="header_user_menu_enabled" :binary="true" />
                      <label class="ml-2">显示用户菜单</label>
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
                <div class="flex flex-col gap-1">
                  <label for="icp_number" class="block text-sm font-medium text-gray-700 mb-2">
                    ICP备案号
                  </label>
                  <InputText name="icp_number" placeholder="京ICP备12345678号" fluid />
                </div>

                <div class="flex flex-col gap-1">
                  <label for="footer_copyright" class="block text-sm font-medium text-gray-700 mb-2">
                    版权信息
                  </label>
                  <Textarea name="footer_copyright" placeholder="© 2024 WWW.APPARELCITY.COM.CN All Rights Reserved"
                    rows="3" fluid />
                  <small class="text-gray-500">显示在网站底部的版权信息</small>
                </div>

                <div class="flex flex-col gap-1">
                  <label for="footer_back_to_top_text" class="block text-sm font-medium text-gray-700 mb-2">
                    返回顶部文本
                  </label>
                  <InputText name="footer_back_to_top_text" placeholder="Back to top" fluid />
                </div>
              </div>

              <div class="space-y-4">
                <div class="field">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    底部栏目
                  </label>
                  <div class="space-y-4">
                    <div v-for="(section, sectionIndex) in footerSections" :key="sectionIndex"
                      class="border rounded-lg p-4">
                      <div class="flex justify-between items-center mb-3">
                        <h4 class="font-medium text-gray-800">栏目 {{ sectionIndex + 1 }}</h4>
                        <Button type="button" icon="pi pi-trash" severity="danger" outlined size="small"
                          @click="removeFooterSection(sectionIndex)" :disabled="footerSections.length <= 1" />
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
                              @click="removeFooterLink(sectionIndex, linkIndex)"
                              :disabled="section.links.length <= 1" />
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
        <!-- 伙伴介绍 -->
        <TabPanel header="伙伴介绍" value="7">
          <div class="space-y-6">
            <div class="flex flex-col gap-1">
              <label for="partners_intro_paragraphs" class="block text-sm font-medium text-gray-700 mb-2">
                伙伴介绍内容
              </label>
              <Textarea name="partners_intro_paragraphs" placeholder="请输入伙伴介绍的详细内容..." rows="8" fluid />
              <small class="text-gray-500">支持多段落文本，用于展示合作伙伴的介绍信息</small>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </Form>
  </div>
</template>



<style scoped>
.site-config-page {
  padding: 1rem;
}

.config-tabs {
  margin-top: 1rem;
}

.field {
  margin-bottom: 1rem;
}

.p-error {
  color: #e24c4c;
  font-size: 0.875rem;
}

.p-invalid {
  border-color: #e24c4c;
}
</style>