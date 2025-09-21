<script setup lang="ts">
import type { PartnersListVo } from "@backend/types";
import { useFrontApi } from "@frontend/utils/handleApi";
import { animate, stagger, text } from "animejs";
import { nextTick, onMounted, onUnmounted, ref } from "vue";

// Refs for animation elements
const titleElement = ref<HTMLElement>();
const subtitleElement = ref<HTMLElement>();
const dividerElement = ref<HTMLElement>();
const taglineElement = ref<HTMLElement>();
const decoration1 = ref<HTMLElement>();
const decoration2 = ref<HTMLElement>();
const decoration3 = ref<HTMLElement>();
const scrollIndicator = ref<HTMLElement>();

// 合作伙伴数据
const partners = ref<PartnersListVo[]>([
  {
    id: 1,
    name: "Partner 1",
    images: [
      {
        id: 1,
        fileName: "partner1.jpg",
        imageUrl: "https://via.placeholder.com/150",
        category: "partner",
        isMain: false,
      },
    ],
    description: "This is a partner description.",
    url: "https://example.com",
    sortOrder: 0,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
]);

interface ViewConfig {
  partners_intro_paragraphs: string[];
  footer_copyright: string;
}

// 当前界面配置数据
const viewConfig = ref<ViewConfig>({
  partners_intro_paragraphs: [
    "We are a group with five ethical manufacturing facilities across Asia. Each facility specializes in one specific product category per year, allowing us to focus deeply on quality, efficiency, and innovation.",
    "We are committed to delivering the best-in-class OEM service to global clients — including renowned brands such as: Gap, Disney, Lucasfilm, JCPenney, and Fashion Nova.",
    "We strictly adhere to the principles of ethical and social responsibility, with full respect for the dignity, rights, and well-being of our staff.",
    "For our VIP clients, we also offer trend-driven design proposals — curated according to the latest global fashion trends — to support your product development and selection.",
  ],
  footer_copyright: "Copyright © 2023 Your Company. All rights reserved.",
});

const api = useFrontApi();
// 加载合作伙伴数据
const loadPartners = async () => {
  try {
    const { code, data, message } = await api.partner.all();
    if (code == 200 && data) {
      partners.value = data;
      console.log("合作伙伴数据:", message);
    }
  } catch (error) {
    console.error("获取合作伙伴数据失败:", error);
  }
};

// 加载当前界面配置数据
const loadViewConfig = async () => {
  try {
    const { code, data, message } =
      await api.siteConfigs.getByCategory("footer");
    if (code === 200) {
      console.log("配置数据", data);
      // 将配置数组转换为对象，便于模板使用
      const configObj: Record<string, any> = {};
      if (!data) {
        return;
      }
      data.forEach((config) => {
        configObj[config.key] = config.value || "空";
      });

      console.log("配置对象", configObj.partners_intro_paragraphs);
      const grapgh = configObj.partners_intro_paragraphs;

      const graphArr: string[] = Array.from(grapgh.split("//"));

      console.log("graphArr", graphArr);
      viewConfig.value = {
        ...configObj,
        footer_copyright: configObj.footer_copyright.replaceAll("\n", ""),
        partners_intro_paragraphs: graphArr,
      };
      console.log("当前界面配置对象:", viewConfig.value);
    }
  } catch (error) {
    console.error("获取当前界面配置失败:", error);
  }
};

// 使用 animejs 的滚动吸附功能
const initAnimeScrollSnap = () => {
  const container = document.querySelector(".h-screen") as HTMLElement;
  const sections = document.querySelectorAll("section, footer");
  let isScrolling = false;
  let currentSection = 0;

  const scrollToSection = (
    index: number,
    _direction: "up" | "down" = "down",
  ) => {
    if (index < 0 || index >= sections.length || isScrolling) return;

    isScrolling = true;
    currentSection = index;

    const targetElement = sections[index] as HTMLElement;
    const targetScroll = targetElement.offsetTop;

    animate(container, {
      scrollTop: targetScroll,
      duration: 800,
      easing: "easeInOutQuad",
      complete: () => {
        isScrolling = false;
      },
    });
  };

  let scrollTimeout: NodeJS.Timeout;
  let accumulatedDelta = 0;

  const handleWheel = (e: WheelEvent) => {
    if (isScrolling) {
      e.preventDefault();
      return;
    }

    accumulatedDelta += e.deltaY;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (Math.abs(accumulatedDelta) > 50) {
        if (accumulatedDelta > 0 && currentSection < sections.length - 1) {
          scrollToSection(currentSection + 1, "down");
        } else if (accumulatedDelta < 0 && currentSection > 0) {
          scrollToSection(currentSection - 1, "up");
        }
      }
      accumulatedDelta = 0;
    }, 50);

    e.preventDefault();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (isScrolling) return;

    switch (e.key) {
      case "ArrowDown":
      case "PageDown":
        e.preventDefault();
        if (currentSection < sections.length - 1) {
          scrollToSection(currentSection + 1, "down");
        }
        break;
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        if (currentSection > 0) {
          scrollToSection(currentSection - 1, "up");
        }
        break;
    }
  };

  // 添加事件监听器
  container.addEventListener("wheel", handleWheel, { passive: false });
  document.addEventListener("keydown", handleKeydown);

  // 返回清理函数
  return () => {
    container.removeEventListener("wheel", handleWheel);
    document.removeEventListener("keydown", handleKeydown);
    clearTimeout(scrollTimeout);
  };
};

// 全局变量用于跟踪当前section
let currentSection = 0;

// 简单的滚动到下一个section
const scrollToNext = () => {
  // 获取正确的滚动容器 - 具有 overflow-y-scroll 的 div
  const container = document.querySelector(".h-screen.overflow-y-scroll") as HTMLElement;
  if (!container) {
    console.error('滚动容器未找到');
    return;
  }

  const sections = container.querySelectorAll("section, footer");
  if (sections.length === 0) {
    console.error('未找到可滚动的section');
    return;
  }

  // 找到当前滚动位置对应的section
  const currentScrollTop = container.scrollTop;
  let currentIndex = 0;

  for (let i = 0;i < sections.length;i++) {
    const section = sections[i] as HTMLElement;
    const sectionTop = section.offsetTop;
    if (Math.abs(currentScrollTop - sectionTop) < 100) {
      currentIndex = i;
      break;
    }
  }

  // 滚动到下一个section
  if (currentIndex < sections.length - 1) {
    const nextSection = sections[currentIndex + 1] as HTMLElement;
    const targetScroll = nextSection.offsetTop;

    console.log(`滚动从 ${currentScrollTop} 到 ${targetScroll}`);

    animate(container, {
      scrollTop: targetScroll,
      duration: 800,
      easing: "easeInOutQuad",
    });
  } else {
    console.log('已经是最后一个section');
  }
};

// 初始化标题动画
const initTitleAnimation = () => {
  if (
    !titleElement.value ||
    !subtitleElement.value ||
    !dividerElement.value ||
    !taglineElement.value
  )
    return;

  // 设置初始状态
  dividerElement.value.style.opacity = "0";
  dividerElement.value.style.transform = "scaleX(0)";

  // 分割主标题文字
  text.split(titleElement.value, {
    chars: { class: "fashion-char" },
  });

  // 分割副标题文字
  text.split(subtitleElement.value, {
    chars: { class: "huaxin-char" },
  });

  // 分割标语文字
  text.split(taglineElement.value, {
    words: { class: "tagline-word" },
  });

  // 主标题字符动画 - 优雅的字母依次出现 + 持续大幅度动画
  animate(".fashion-char", {
    opacity: [0, 1],
    y: ["2rem", "0rem"],
    duration: 3000,
    delay: stagger(80),
    easing: "easeOutExpo",
  });

  // 副标题字符动画 - 延迟出现
  animate(".huaxin-char", {
    opacity: [0, 1],
    y: ["1.5rem", "0rem"],
    duration: 600,
    delay: stagger(60, { start: 1000 }),
    easing: "easeOutExpo",
  });

  // 分割线动画 - 缩放出现
  animate(dividerElement.value, {
    opacity: [0, 1],
    scaleX: [0, 1],
    duration: 600,
    delay: 1800,
    easing: "easeOutExpo",
  });

  // 标语单词动画 - 依次淡入 + 持续呼吸效果
  animate(".tagline-word", {
    opacity: [0, 1],
    y: ["1rem", "0rem"],
    duration: 500,
    delay: stagger(150, { start: 2200 }),
    easing: "easeOutExpo",
    complete: () => {
      // 初始动画完成后，添加持续的呼吸效果
      animate(".tagline-word", {
        y: ["0rem", "-1rem", "0rem"],
        opacity: [1, 0.6, 1],
        duration: 2000,
        delay: stagger(100),
        easing: "easeInOutSine",
        loop: true,
        direction: "alternate",
      });
    },
  });

  // 装饰元素动画
  if (decoration1.value) {
    animate(decoration1.value, {
      opacity: [0, 0.3],
      scale: [0.8, 1],
      rotate: [0, 360],
      duration: 2000,
      delay: 1200,
      easing: "easeOutExpo",
      loop: true,
      direction: "alternate",
    });
  }

  if (decoration2.value) {
    animate(decoration2.value, {
      opacity: [0, 0.2],
      scale: [1.2, 1],
      rotate: [0, -360],
      duration: 2500,
      delay: 1400,
      easing: "easeOutExpo",
      loop: true,
      direction: "alternate",
    });
  }

  if (decoration3.value) {
    animate(decoration3.value, {
      opacity: [0, 0.4],
      rotate: [0, 180],
      duration: 3000,
      delay: 1600,
      easing: "easeInOutSine",
      loop: true,
      direction: "alternate",
    });
  }

  // 波动背景动画
  initWaveBackground();

  // 初始化滚动指示器动画
  initScrollIndicator();
};

// 波动背景效果
const initWaveBackground = () => {
  const container = document.querySelector(".h-screen") as HTMLElement;

  // 创建波动元素
  const createWaveElement = (delay: number, duration: number, size: number) => {
    const wave = document.createElement("div");
    wave.className = "absolute rounded-full bg-white/10 pointer-events-none";
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${Math.random() * 100}%`;
    wave.style.top = `${Math.random() * 100}%`;
    wave.style.transform = "translate(-50%, -50%)";
    wave.style.zIndex = "1";

    container.appendChild(wave);

    // 动画
    animate(wave, {
      scale: [0, 1.5, 0],
      opacity: [0, 0.3, 0],
      duration: duration,
      delay: delay,
      easing: "easeInOutSine",
      loop: true,
      direction: "normal",
    });

    return wave;
  };

  // 创建多个波动元素
  const waves = [];
  for (let i = 0;i < 8;i++) {
    const delay = i * 2000;
    const duration = 4000 + Math.random() * 2000;
    const size = 100 + Math.random() * 200;
    waves.push(createWaveElement(delay, duration, size));
  }

  // 移动的波动光点
  const createFloatingOrb = (delay: number) => {
    const orb = document.createElement("div");
    orb.className =
      "absolute rounded-full bg-gradient-to-r from-yellow-300/20 to-pink-300/20 pointer-events-none blur-sm";
    orb.style.width = `${30 + Math.random() * 40}px`;
    orb.style.height = orb.style.width;
    orb.style.zIndex = "2";

    container.appendChild(orb);

    // 随机路径动画
    const animateOrb = () => {
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      const endX = Math.random() * 100;
      const endY = Math.random() * 100;

      orb.style.left = `${startX}%`;
      orb.style.top = `${startY}%`;

      animate(orb, {
        left: [`${startX}%`, `${endX}%`],
        top: [`${startY}%`, `${endY}%`],
        scale: [0.8, 1.2, 0.8],
        opacity: [0.2, 0.4, 0.2],
        duration: 8000 + Math.random() * 4000,
        delay: delay,
        easing: "easeInOutSine",
        loop: true,
        direction: "alternate",
      });
    };

    animateOrb();
    return orb;
  };

  // 创建浮动光点
  for (let i = 0;i < 5;i++) {
    createFloatingOrb(i * 1600);
  }
};

// 滚动指示器动画
const initScrollIndicator = () => {
  if (!scrollIndicator.value) return;

  // 整体轻微浮动动画
  animate(scrollIndicator.value, {
    y: ["0px", "6px", "0px"],
    duration: 3000,
    easing: "easeInOutSine",
    loop: true,
    direction: "alternate",
  });

  // 为每个箭头创建优雅的闪动效果
  const arrows = scrollIndicator.value?.querySelectorAll('.arrow-wave');
  if (!arrows) return;

  // 设置初始状态
  arrows.forEach((arrow, index) => {
    const arrowIcon = arrow.querySelector('i');
    if (arrowIcon) {
      arrowIcon.style.opacity = "0.3";
      arrowIcon.style.transform = "translateY(0px) scale(1)";
    }
  });

  // 创建从上往下的闪动动画序列
  const createArrowSequence = () => {
    // 从第一个箭头开始（从上往下）
    arrows.forEach((arrow, index) => {
      const arrowIcon = arrow.querySelector('i');
      if (!arrowIcon) return;

      // 闪动出现动画 - 从上往下依次触发
      animate(arrowIcon, {
        opacity: [0.3, 1, 0.6 + ((2 - index) * 0.1)], // 上面的箭头更亮
        translateY: ["0px", "-5px", "0px"],
        scale: [1, 1.3, 1],
        duration: 400,
        delay: index * 120, // 从上往下依次延迟
        easing: "easeOutBack",
      });

      // 持续的轻微呼吸效果
      setTimeout(() => {
        animate(arrowIcon, {
          scale: [1, 1.1, 1],
          duration: 1200,
          delay: index * 80,
          easing: "easeInOutSine",
          loop: true,
          direction: "alternate",
        });
      }, 600 + index * 120);
    });
  };

  // 立即执行第一次动画
  createArrowSequence();

  // 每隔2.5秒重复动画序列
  setInterval(createArrowSequence, 2500);

  // 创建优雅的光晕效果
  const createGlowEffect = () => {
    const glow = document.createElement("div");
    glow.className = "absolute inset-0 rounded-full bg-white/10 pointer-events-none blur-sm";
    glow.style.transform = "scale(0)";
    glow.style.opacity = "0";

    scrollIndicator.value?.appendChild(glow);

    // 光晕扩散动画
    animate(glow, {
      scale: [0, 1.8, 2.2],
      opacity: [0, 0.4, 0],
      duration: 2000,
      easing: "easeOutQuart",
      complete: () => {
        glow.remove();
      },
    });
  };

  // 每隔3秒创建光晕效果
  setInterval(createGlowEffect, 3000);

  // 立即创建第一个光晕
  setTimeout(createGlowEffect, 800);
};

// 页面加载时的初始化
onMounted(async () => {
  console.log("首页已加载");
  await Promise.all([loadPartners(), loadViewConfig()]);

  // 等待DOM渲染完成后初始化动画和滚动吸附
  nextTick(() => {
    // 初始化标题动画
    initTitleAnimation();

    // 延迟初始化滚动吸附，确保动态数据已加载
    setTimeout(() => {
      initAnimeScrollSnap();
    }, 1000);
  });
});

// 组件卸载时清理
onUnmounted(() => {
  // 清理事件监听器会在initScrollSnap返回的函数中处理
});
</script>

<template>
  <div class="h-screen bg-gradient-to-br from-red-500 via-orange-500 to-yellow-400 overflow-y-scroll">
    <!-- 顶部导航栏 -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 backdrop-blur-sm border-b border-orange-300/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-6">
            <!-- 公司名称 -->
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                  </path>
                </svg>
              </div>
              <h1 class="text-3xl font-bold text-white tracking-wide">APPARELCITY</h1>
            </div>

            <!-- 分隔线 -->
            <div class="w-px h-6 bg-white/30"></div>

            <!-- WhatsApp 联系方式 -->
            <div
              class="flex items-center space-x-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/30 hover:bg-green-500/30 transition-all duration-300">

              <span class="text-green-300 font-medium">WHATSAPP: +86 13650097010</span>
            </div>


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

      <section class="relative h-screen text-center px-4 flex flex-col justify-center snap-start snap-always pt-4rem">
        <!-- 品牌标题动画 -->
        <div class="relative z-10">
          <div class="mb-4">
            <h1 ref="titleElement" class="text-6xl md:text-8xl font-bold text-white font-serif">
              FASHION
            </h1>
          </div>
          <div class="mb-8">
            <h2 ref="subtitleElement" class="text-4xl md:text-6xl font-light text-yellow-300 font-serif">
              HUAXIN
            </h2>
          </div>
          <div class="my-8">
            <div ref="dividerElement"
              class="w-32 h-2 bg-gradient-to-r from-transparent via-yellow-300 to-transparent mx-auto animate-flow">
            </div>
          </div>
          <div>
            <p ref="taglineElement" class="text-xl md:text-2xl text-white/90 font-sans uppercase tracking-wider">
              Quality · Style · Innovation
            </p>
          </div>
        </div>

        <!-- 装饰性背景元素 -->
        <div class="absolute inset-0 pointer-events-none">
          <div ref="decoration1"
            class="absolute top-20 left-10 w-20 h-20 border-2 border-yellow-300/30 rounded-full opacity-0"></div>
          <div ref="decoration2"
            class="absolute bottom-20 right-10 w-32 h-32 border-2 border-white/30 rounded-full opacity-0"></div>
          <div ref="decoration3"
            class="absolute top-1/2 left-1/4 w-16 h-16 border border-yellow-300/20 rotate-45 opacity-0"></div>
        </div>

        <!-- 滚动指示器 -->
        <div ref="scrollIndicator"
          class="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 cursor-pointer hover:scale-110 transition-transform duration-300"
          @click="scrollToNext">
          <div class="flex flex-col items-center space-y-3">
            <!-- 主箭头组 -->
            <div class="flex flex-col items-center ">
              <!-- 第一个箭头图标 -->
              <div class="arrow-wave text-white/80 text-2xl">
                <i class="i-ic-keyboard-arrow-down"></i>
              </div>
              <!-- 第二个箭头图标 -->
              <div class="arrow-wave text-white/60 text-2xl">
                <i class="i-ic-keyboard-arrow-down"></i>
              </div>
              <!-- 第三个箭头图标 -->
              <div class="arrow-wave text-white/40 text-2xl">
                <i class="i-ic-keyboard-arrow-down"></i>
              </div>
            </div>
            <!-- 提示文字 -->
            <div class="text-white/60 text-sm font-medium tracking-wider animate-pulse">
              向下滑动
            </div>
          </div>
        </div>
      </section>
      <!-- 品牌介绍区域 -->
      <section class="relative h-screen text-center px-4 flex flex-col justify-center snap-start snap-always pt-4rem">
        <div class="max-w-4xl mx-auto">
          <!-- <h2 class="text-5xl font-bold text-white mb-6">Introducing</h2> -->
          <div class="text-6xl font-bold text-white mb-8">
            <span class="text-red-600"> APPARELCITY</span>
            <!-- <span class="text-yellow-400">Brands</span> -->
          </div>

          <div class=" font-semibold text-white/80 text-2xl leading-relaxed space-y-2 mb-12  mx-auto">
            <p v-for="(paragraph, index) in viewConfig.partners_intro_paragraphs" :key="index" :class="[
              'text-justify',
              'indent-8',
              // index === viewConfig.partners_intro_paragraphs?.length - 1
              //   ? 'font-semibold text-yellow-300 text-xl'
              //   : 'font-normal'
            ]">
              {{ paragraph }}</p>
          </div>
        </div>
        <!-- 合作伙伴展示区域 -->
        <h2 class="text-2xl position-absolute bottom-10% right-22%    font-bold text-red-600 mb-6  text-center ">
          Your best factory-direct supplier
        </h2>
      </section>


      <!-- 合作伙伴展示区域 -->
      <section v-for="(partner, index) in partners" :key="partner.id"
        class="h-screen hover:shadow-xl transition-all duration-300 snap-start snap-always relative"
        style="scroll-snap-align: start; scroll-snap-stop: always;">
        <!-- 桌面端布局 - 两列布局，文字左右交替出现 -->
        <div class="hidden md:flex flex-row relative h-full">
          <!-- 中央白色分隔框 -->
          <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-white/60 shadow-xl transform -translate-x-1/2 z-10"></div>

          <!-- 奇数索引：文字在左侧，偶数索引：文字在右侧 -->
          <template v-if="index % 2 === 0">
            <!-- 左侧图片区域 - 带浮空文字和边框 -->
            <div class="w-1/2 relative bg-gray-100 border-r-4 border-white shadow-lg">
              <img :src="partner.images[0]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Left`"
                class="w-full h-full object-cover">
              <!-- 浮空的文字内容 -->
              <div class="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center p-12">
                <div class="text-white max-w-lg">

                  <a :href="partner.url" target="_blank" rel="noopener noreferrer"
                    class="inline-block bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 text-lg shadow-lg">
                    Visit the official website
                  </a>
                  <p class="text-lg lg:text-xl opacity-90 mt-8 leading-relaxed drop-shadow-md">{{ partner.description }}
                  <h3 class="text-2xl lg:text-3xl font-bold mt-6 drop-shadow-lg">{{ partner.name }}</h3>
                  </p>
                </div>
              </div>
            </div>

            <!-- 右侧图片区域 -->
            <div class="w-1/2 bg-gray-100 border-l-4 border-white">
              <img :src="partner.images[1]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Right`"
                class="w-full h-full object-cover">
            </div>
          </template>

          <template v-else>
            <!-- 左侧图片区域 -->
            <div class="w-1/2 bg-gray-100 border-r-4 border-white">
              <img :src="partner.images[0]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Left`"
                class="w-full h-full object-cover">
            </div>

            <!-- 右侧图片区域 - 带浮空文字和边框 -->
            <div class="w-1/2 relative bg-gray-100 border-l-4 border-white shadow-lg">
              <img :src="partner.images[1]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Right`"
                class="w-full h-full object-cover">
              <!-- 浮空的文字内容 -->
              <div class="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center p-12">
                <div class="text-white max-w-lg ml-auto">
                  <h3 class="text-4xl lg:text-5xl font-bold mb-6 drop-shadow-lg">{{ partner.name }}</h3>
                  <p class="text-lg lg:text-xl opacity-90 mb-8 leading-relaxed drop-shadow-md">{{ partner.description }}
                  </p>
                  <a :href="partner.url" target="_blank" rel="noopener noreferrer"
                    class="inline-block bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 text-lg shadow-lg">
                    Visit the official website
                  </a>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>
    </main>

    <!-- 页脚版权信息区域 -->
    <footer
      class="h-16 bg-gradient-to-br from-orange-900/90 via-red-900/90 to-pink-900/90 backdrop-blur-sm text-white flex items-center justify-center snap-start snap-always"
      style="scroll-snap-align: start; scroll-snap-stop: always;">
      <div class="text-center">
        <p class="text-sm text-gray-300">
          {{ viewConfig.footer_copyright || '© 2024 Catalyst Brands. All rights reserved.' }}
        </p>
      </div>
    </footer>
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

/* 文字分割动画样式 */
.fashion-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(2rem);
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  font-family: inherit;
}

.huaxin-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(1.5rem);
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  font-family: inherit;
}

.tagline-word {
  display: inline-block;
  opacity: 0;
  transform: translateY(1rem);
  margin: 0 0.25rem;
  font-size: inherit;
  color: inherit;
  font-family: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
}

/* 高端字体样式 */
.font-serif {
  font-family: 'Times New Roman', Times, serif;
  letter-spacing: 0.05em;
}

.font-sans {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 文字阴影效果，增强可读性 */
h1,
h2 {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* 分割线流动动画 */
@keyframes flow {
  0% {
    background-position: 0% 50%;
    transform: scaleX(1);
    opacity: 1;
  }

  50% {
    background-position: 100% 50%;
    transform: scaleX(1.3);
    opacity: 0.6;
  }

  100% {
    background-position: 0% 50%;
    transform: scaleX(1);
    opacity: 1;
  }
}

.animate-flow {
  background-size: 200% 100%;
  animation: flow 2s ease-in-out infinite;
}
</style>