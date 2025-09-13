<script setup lang="ts">
import type { PartnerModel } from "@backend/modules/partner";
import { useFrontApi } from "@frontend/utils/handleApi";

import { nextTick, onUnmounted, ref } from "vue";

// 合作伙伴数据
const partners = ref<PartnerModel[]>([]);

// 当前界面配置数据
const viewConfig = ref<ViewConfig>({});
// 默认介绍段落
const defaultIntroParagraphs = [
  "我们通过化妆品牌，现在，我们正在工作7个不同的品牌的客户，具有各种性质",
  "和对成功的大胆愿景。",
  "正如科学中的催化剂能够不断改变汽车上工作一样，作为一个团队，我们大胆的方法",
  "作为，我们的客\"催化剂\"区域了我们加速制造和制造的能力307万。",
  "我们团队为美国各地的客户带来市场系统，专业知识和化妆品\"公司改进力\"",
]


const api = useFrontApi();
// 加载合作伙伴数据
const loadPartners = async () => {
  try {

    const { code, data, message } = await api.partner.all()
    if (code == 200 && data) {
      partners.value = data
      console.log("合作伙伴数据:", data);
    }
  } catch (error) {
    console.error("获取合作伙伴数据失败:", error);
  }
};

interface ViewConfig {
  partners_intro_paragraphs: string[];
  footer_copyright: string;
}

// 加载当前界面配置数据
const loadViewConfig = async () => {
  try {
    const { code, data, message } = await api.siteConfigs.getByCategory("footer");
    if (code == 200) {

      console.log("配置数据", data)
      // 将配置数组转换为对象，便于模板使用
      const configObj: Record<string, any> = {};
      if (!data) {
        return
      }
      data.forEach((config) => {
        configObj[config.key] = config.value || '空'
      });

      console.log("配置对象", configObj.partners_intro_paragraphs)
      const grapgh = configObj.partners_intro_paragraphs


      const graphArr: string[] = Array.from(grapgh.split('//'))

      console.log("graphArr", graphArr)
      viewConfig.value = {
        ...configObj,
        footer_copyright: configObj.footer_copyright.replaceAll('\n', ''),
        partners_intro_paragraphs: graphArr,
      };

      console.log("当前界面配置对象:", viewConfig.value);
    }
  } catch (error) {
    console.error("获取当前界面配置失败:", error);
  }
};

// 滚动吸附功能
const initScrollSnap = () => {
  let currentSectionIndex = 0;
  const sections = document.querySelectorAll('section');
  let isScrolling = false;

  const scrollToSection = (index: number) => {
    if (index >= 0 && index < sections.length) {
      isScrolling = true;
      sections[index].scrollIntoView({ behavior: 'smooth' });
      currentSectionIndex = index;
      setTimeout(() => {
        isScrolling = false;
      }, 800);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (isScrolling) {
      e.preventDefault();
      return;
    }

    e.preventDefault();

    if (e.deltaY > 0) {
      // 向下滚动
      if (currentSectionIndex < sections.length - 1) {
        scrollToSection(currentSectionIndex + 1);
      }
    } else {
      // 向上滚动
      if (currentSectionIndex > 0) {
        scrollToSection(currentSectionIndex - 1);
      }
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (isScrolling) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        if (currentSectionIndex < sections.length - 1) {
          scrollToSection(currentSectionIndex + 1);
        }
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        if (currentSectionIndex > 0) {
          scrollToSection(currentSectionIndex - 1);
        }
        break;
    }
  };

  // 添加事件监听器
  document.addEventListener('wheel', handleWheel, { passive: false });
  document.addEventListener('keydown', handleKeydown);

  // 返回清理函数
  return () => {
    document.removeEventListener('wheel', handleWheel);
    document.removeEventListener('keydown', handleKeydown);
  };
};

// 页面加载时的初始化
onMounted(async () => {
  console.log("首页已加载");
  await Promise.all([loadPartners(), loadViewConfig()]);

  // 等待DOM渲染完成后初始化滚动吸附
  nextTick(() => {
    // 延迟初始化，确保动态数据已加载
    setTimeout(() => {
      initScrollSnap();
    }, 1000);
  });
});

// 组件卸载时清理
onUnmounted(() => {
  // 清理事件监听器会在initScrollSnap返回的函数中处理
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 overflow-y-scroll scroll-smooth snap-y mandatory">
    <!-- 顶部导航栏 -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-sm border-b border-white/20">
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
      <section class="relative h-screen text-center px-4 flex flex-col justify-center snap-start snap-always pt-4rem">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-5xl font-bold text-white mb-6">Introducing</h2>
          <div class="text-6xl font-bold text-white mb-8">
            <span class="text-red-600">Catalyst</span>
            <span class="text-yellow-400">Brands</span>
          </div>

          <div class="text-white text-lg leading-relaxed space-y-4 mb-12">
            <p v-for="(paragraph, index) in viewConfig.partners_intro_paragraphs || defaultIntroParagraphs" :key="index"
              :class="index === viewConfig.partners_intro_paragraphs?.length - 1 ? 'font-semibold text-yellow-300' : ''">
              {{ paragraph }}</p>
          </div>
        </div>
        <!-- 合作伙伴展示区域 -->
        <h2
          class="position-absolute bottom-0 left-1/2 translate-center text-5xl  font-bold text-white mb-6  text-center pb-4">
          Brands
        </h2>
      </section>


      <!-- 合作伙伴展示区域 -->
      <section v-for="(partner, index) in partners" :key="partner.id"
        class="h-screen hover:shadow-xl transition-all duration-300 snap-start snap-always"
        style="scroll-snap-align: start; scroll-snap-stop: always;">
        <div class="flex flex-col lg:flex-row" :class="index % 2 === 1 ? 'lg:flex-row-reverse' : ''">
          <!-- 图片区域 -->
          <div class="lg:w-1/2">
            <img :src="partner.image" :alt="partner.name" class="w-full h-screen lg:h-screen object-cover">
          </div>
          <!-- 内容区域 -->
          <div
            class="lg:w-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex flex-col justify-center p-12 lg:p-16">
            <div class="max-w-lg" :class="index % 2 === 1 ? 'lg:ml-auto' : ''">
              <h3 class="text-4xl lg:text-5xl font-bold mb-6">{{ partner.name }}</h3>
              <p class="text-lg lg:text-xl opacity-90 mb-8 leading-relaxed">{{ partner.description }}</p>
              <a :href="partner.url" target="_blank" rel="noopener noreferrer"
                class="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 text-lg">
                访问官网
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚版权信息区域 -->
    <section
      class="h-screen bg-black/80 backdrop-blur-sm text-white flex items-center justify-center snap-start snap-always"
      style="scroll-snap-align: start; scroll-snap-stop: always;">
      <div class="text-center">
        <div class="mb-8">
          <h2 class="text-4xl font-bold text-white mb-4">感谢您的关注</h2>
          <p class="text-xl text-gray-300">期待与您的合作</p>
        </div>
        <div class="border-t border-gray-600 pt-6">
          <p class="text-gray-400">
            {{ viewConfig.footer_copyright || '© 2024 Catalyst Brands. All rights reserved.' }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>



<style scoped>
/* 隐藏滚动条 */
:global(html) {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

:global(html::-webkit-scrollbar) {
  display: none;
  /* Chrome, Safari and Opera */
}

.translate-center {
  translate: -50% -50%;
}

:global(body) {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

:global(body::-webkit-scrollbar) {
  display: none;
  /* Chrome, Safari and Opera */
}

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