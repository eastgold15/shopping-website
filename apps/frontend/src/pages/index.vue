<template>
    <div class="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400">
        <!-- 顶部导航栏 -->
        <nav class="sticky top-0 z-50 bg-white/10 backdrop-blur-sm border-b border-white/20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-white">Catalyst Brands</h1>
                    </div>
                    <div class="hidden md:block">
                        <div class="ml-10 flex items-baseline space-x-4">
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- 主要内容区域 -->
        <main class="relative">
            <!-- 品牌介绍区域 -->
            <section class="text-center py-20 px-4">
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-5xl font-bold text-white mb-6">Introducing</h2>
                    <div class="text-6xl font-bold text-white mb-8">
                        <span class="text-red-600">Catalyst</span>
                        <span class="text-yellow-400">Brands</span>
                    </div>

                    <div class="text-white text-lg leading-relaxed space-y-4 mb-12">
                        <p v-for="(paragraph, index) in viewConfig.partners_intro_paragraphs || defaultIntroParagraphs"
                            :key="index"
                            :class="index === viewConfig.partners_intro_paragraphs?.length - 1 ? 'font-semibold text-yellow-300' : ''">
                            {{ paragraph }}</p>
                    </div>
                </div>
            </section>
            <!-- 合作伙伴展示区域 -->
            <h2 class="text-5xl font-bold text-white mb-6  text-center">Brands</h2>
            <section class="py-16">
                <div class="w-full">
                    <div class="space-y-0">
                        <div v-for="(partner, index) in partners" :key="partner.id"
                            class="w-full hover:shadow-xl transition-all duration-300">
                            <div class="flex flex-col lg:flex-row"
                                :class="index % 2 === 1 ? 'lg:flex-row-reverse' : ''">
                                <!-- 图片区域 -->
                                <div class="lg:w-1/2">
                                    <img :src="partner.image" :alt="partner.name"
                                        class="w-full h-64 lg:h-96 object-cover">
                                </div>
                                <!-- 内容区域 -->
                                <div
                                    class="lg:w-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex flex-col justify-center p-12 lg:p-16">
                                    <div class="max-w-lg" :class="index % 2 === 1 ? 'lg:ml-auto' : ''">
                                        <h3 class="text-4xl lg:text-5xl font-bold mb-6">{{ partner.name }}</h3>
                                        <p class="text-lg lg:text-xl opacity-90 mb-8 leading-relaxed">{{
                                            partner.description }}</p>
                                        <a :href="partner.url" target="_blank" rel="noopener noreferrer"
                                            class="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 text-lg">
                                            访问官网
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- 页脚 -->
        <footer class="bg-black/20 backdrop-blur-sm text-white ">
            <div class="border-t border-gray-600 py-6 text-center ">
                <p class="text-gray-300 pt-4">
                    {{ viewConfig.partners_copyright || ' 备案号' }}
                </p>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { $fetch } from 'ofetch'
import { client } from '@frontend/utils/useTreaty'

// 合作伙伴数据
const partners = ref([])

// 当前界面配置数据
const viewConfig = ref({})



// 默认介绍段落
const defaultIntroParagraphs = [
    '我们通过化妆品牌，现在，我们正在工作7个不同的品牌的客户，具有各种性质',
    '和对成功的大胆愿景。',
    '正如科学中的催化剂能够不断改变汽车上工作一样，作为一个团队，我们大胆的方法',
    '作为，我们的客户"催化剂"区域了我们加速制造和制造的能力307万。',
    '我们团队为美国各地的客户带来市场系统，专业知识和化妆品"公司改进力"',
]

console.log(JSON.stringify(defaultIntroParagraphs))
// 加载合作伙伴数据
const loadPartners = async () => {
    try {
        const { data: response } = await client.api.partners.list.get()
        if (response.code == 200 && response.data) {
            partners.value = response.data
            console.log('合作伙伴数据:', response.data)
        }
    } catch (error) {
        console.error('获取合作伙伴数据失败:', error)
    }
}

// 加载当前界面配置数据
const loadViewConfig = async () => {
    try {
        const { data: response } = await client.api['site-configs'].category({ category: 'partners' }).get()
        if (response.code == 200 && response.data) {
            // 将配置数组转换为对象，便于模板使用
            const configObj = {}
            response.data.forEach(config => {
                configObj[config.key] = config.value
            })

            viewConfig.value = {
                ...configObj,
                partners_intro_paragraphs: JSON.parse(configObj.partners_intro_paragraphs)
            }
            console.log('当前界面配置对象:', viewConfig.value)
        }
    } catch (error) {
        console.error('获取当前界面配置失败:', error)
    }
}



// 页面加载时的初始化
onMounted(async () => {
    console.log('首页已加载')
    await Promise.all([
        loadPartners(),
        loadViewConfig(),
    ])
})
</script>

<style scoped>
/* 自定义样式 */
.backdrop-blur-sm {
    backdrop-filter: blur(4px);
}

/* 渐变动画 */
@keyframes gradient {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

.bg-gradient-to-br {
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
}
</style>