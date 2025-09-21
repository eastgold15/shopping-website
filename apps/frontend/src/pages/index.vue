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
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-white"> FASHION HUAXIN</h1>
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
      </section>
      <!-- 品牌介绍区域 -->
      <section class="relative h-screen text-center px-4 flex flex-col justify-center snap-start snap-always pt-4rem">
        <div class="max-w-4xl mx-auto">
          <!-- <h2 class="text-5xl font-bold text-white mb-6">Introducing</h2> -->
          <div class="text-6xl font-bold text-white mb-8">
            <span class="text-red-600"> APPARELCITY</span>
            <!-- <span class="text-yellow-400">Brands</span> -->
          </div>

          <div class="text-white text-lg leading-relaxed space-y-6 mb-12 max-w-3xl mx-auto">
            <p v-for="(paragraph, index) in viewConfig.partners_intro_paragraphs" :key="index" :class="[
              'text-justify',
              'indent-8',
              'px-4',
              index === viewConfig.partners_intro_paragraphs?.length - 1
                ? 'font-semibold text-yellow-300 text-xl'
                : 'font-normal'
            ]">
              {{ paragraph }}</p>
          </div>
        </div>
        <!-- 合作伙伴展示区域 -->
        <h2
          class="position-absolute bottom-0 left-1/2 translate-center text-5xl  font-bold text-white mb-6  text-center pb-4">
          City of Clothes
        </h2>
      </section>


      <!-- 合作伙伴展示区域 -->
      <section v-for="(partner, index) in partners" :key="partner.id"
        class="h-screen hover:shadow-xl transition-all duration-300 snap-start snap-always relative"
        style="scroll-snap-align: start; scroll-snap-stop: always;">
        <!-- 桌面端布局 - 两列布局，文字左右交替出现 -->
        <div class="hidden md:flex flex-row relative h-full">
          <!-- 奇数索引：文字在左侧，偶数索引：文字在右侧 -->
          <template v-if="index % 2 === 0">
            <!-- 左侧图片区域 - 带浮空文字 -->
            <div class="w-1/2 relative bg-gray-100">
              <img :src="partner.images[0]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Left`"
                class="w-full h-screen object-contain">
              <!-- 浮空的文字内容 -->
              <div class="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center p-12">
                <div class="text-white max-w-lg">
                  <h3 class="text-4xl lg:text-5xl font-bold mb-6">{{ partner.name }}</h3>
                  <p class="text-lg lg:text-xl opacity-90 mb-8 leading-relaxed">{{ partner.description }}</p>
                  <a :href="partner.url" target="_blank" rel="noopener noreferrer"
                    class="inline-block bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 text-lg">
                    Visit the official website
                  </a>
                </div>
              </div>
            </div>

            <!-- 右侧图片区域 -->
            <div class="w-1/2 bg-gray-100">
              <img :src="partner.images[1]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Right`"
                class="w-full h-screen object-contain">
            </div>
          </template>

          <template v-else>
            <!-- 左侧图片区域 -->
            <div class="w-1/2 bg-gray-100">
              <img :src="partner.images[0]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Left`"
                class="w-full h-screen object-contain">
            </div>

            <!-- 右侧图片区域 - 带浮空文字 -->
            <div class="w-1/2 relative bg-gray-100">
              <img :src="partner.images[1]?.imageUrl ?? 'http://example.com'" :alt="`${partner.name} - Right`"
                class="w-full h-screen object-contain">
              <!-- 浮空的文字内容 -->
              <div class="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center p-12">
                <div class="text-white max-w-lg ml-auto">
                  <h3 class="text-4xl lg:text-5xl font-bold mb-6">{{ partner.name }}</h3>
                  <p class="text-lg lg:text-xl opacity-90 mb-8 leading-relaxed">{{ partner.description }}</p>
                  <a :href="partner.url" target="_blank" rel="noopener noreferrer"
                    class="inline-block bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 text-lg">
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