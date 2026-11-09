<script setup>
import {computed, ref, watch} from "vue";
import {
  clickLimit,
  gameData,
  isBothStatsZero,
  isCoinPopping,
  isExpPopping,
  isPopping, maxLives, tutorialStep,
  ZeroPlayCount
} from "@/scripts/useGameStore.js";
import ProgressBar from "@/components/ProgressBar.vue";
import {expPercentage} from "@/scripts/level.js";
import {comboClicks} from "@/scripts/actions.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import DailyTasksModal from "@/components/DailyTasks.vue";
import {hasAvailableRewards} from "@/scripts/dealyTasks.js";
import i18n from "@/scripts/locales/i18n.js";
import {syncToBackend} from "@/scripts/api.js";

// Локальный сглаженный счетчик для плавной анимации спада
const animatedComboClicks = ref(0);
let drainInterval = null;

// Импульс при тапе
const isClicking = ref(false);
let clickTimeout = null;

// 🎯 Делаем вкладку "Задания" первой по умолчанию
const activeTab = ref('tasks');

// 🌐 Функция переключения языка
const changeLanguage = async (lang) => {
  i18n.global.locale.value = lang;
  localStorage.setItem('user_language', lang);
  if (gameData) {
    gameData.language = lang;
  }
  await syncToBackend()
};

watch(comboClicks, (newVal) => {
  if (newVal > animatedComboClicks.value) {
    if (drainInterval) clearInterval(drainInterval);
    animatedComboClicks.value = newVal;

    isClicking.value = true;
    if (clickTimeout) clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      isClicking.value = false;
    }, 100);
  } else if (newVal === 0 && animatedComboClicks.value > 0) {
    if (drainInterval) clearInterval(drainInterval);

    drainInterval = setInterval(() => {
      if (animatedComboClicks.value > 0) {
        const step = Math.max(1, Math.ceil(animatedComboClicks.value / 15));
        animatedComboClicks.value = Math.max(0, animatedComboClicks.value - step);
      } else {
        clearInterval(drainInterval);
      }
    }, 15);
  }
});

function formatNumber(num) {
  if (num === undefined || num === null) return '0';

  if (num >= 1_000_000) {
    const formatted = (Math.floor((num / 1_000_000) * 10) / 10).toString();
    return formatted + 'M';
  }
  if (num >= 10_000) {
    const formatted = (Math.floor((num / 1_000) * 10) / 10).toString();
    return formatted + 'K';
  }
  return num.toString();
}

function formatFullNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('ru-RU');
}

const showStatsModal = ref(false);

const calculateProgress = (current, min, max) => {
  if (current <= min) return 0;
  if (current >= max) return 100;
  return ((current - min) / (max - min)) * 100;
};

const progressX2 = computed(() => calculateProgress(animatedComboClicks.value, 0, 50));
const progressX3 = computed(() => calculateProgress(animatedComboClicks.value, 50, 100));
const progressX5 = computed(() => calculateProgress(animatedComboClicks.value, 100, 150));

const getClipInset = (progress) => {
  const maxFill = 15;
  const insetValue = 100 - (progress * (100 - maxFill) / 100);
  return `${insetValue}% 0 0 0`;
};
</script>

<template>
  <div class="relative px-2 mb-1 pt-1" :class="tutorialStep === 1 ? 'z-205' : 'z-200'">
    <!-- Клик по любому месту плашки откроет подробную статистику -->
    <div

        @click="showStatsModal = true"
        :class="tutorialStep === 1 ? '' : 'backdrop-blur-md shadow-2xl bg-white/20'"
        class="relative h-20  rounded-2xl  cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div v-if="gameData.level<=1">
        <div
            :class="tutorialStep === 1 ? 'z-205' : ''"
            class="absolute  top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5  overflow-hidden flex items-center justify-center shadow-md bg-white/10 backdrop-blur-md w-70 py-1 rounded-xl border border-white/10"

        >
          <div
              class="absolute left-0 top-0 bottom-0 bg-[#b0d9de] transition-all duration-500 pointer-events-none z-0"
              :style="{ width: expPercentage + '%' }"
          ></div>
        </div>
      </div>
      <div v-else>
        <div v-show="hasAvailableRewards"
             class="absolute rounded-full animate-pulse p-0.5 w-8 h-8 left-0 -bottom-6 ">
          <img class="relative" src="/gamePlay/calendar.webp" alt="">
        </div>

        <div class="flex justify-between gap-2 p-2">
          <div class="flex flex-col gap-1">
            <ProgressBar :class="gameData.foodLevel<=0?'animate-custom-pulse ':''"
                         :image="`/gamePlay/hunger.webp?v=${APP_VERSION}`" name="Сытость" :value="gameData.foodLevel"
                         color="#FFF700"/>
            <ProgressBar :class="gameData.energy<=0?'animate-custom-pulse ':''"
                         :image="`/gamePlay/energy.webp?v=${APP_VERSION}`" name="Энергия" :value="gameData.energy"
                         color="#50A2FF"/>
          </div>

          <div class="grid grid-cols-2 gap-1 left-0.5">
            <!-- Уровень -->
            <div
                class="relative h-8 overflow-hidden flex items-center justify-center shadow-md bg-white/10 backdrop-blur-md w-15 max-w-15 py-1 rounded-xl border border-white/10"
                :class="isExpPopping? 'animate-pop' : ''"
            >
              <div
                  class="absolute left-0 top-0 bottom-0 bg-[#b0d9de]/80 transition-all duration-500 pointer-events-none z-0"
                  :style="{ width: expPercentage + '%' }"
              ></div>
              <span class="text-xs font-semibold text-gray-700 relative z-10">Ур.</span>
              <span class="text-xs font-bold text-shadow-xs text-shadow-amber-50 text-gray-900 relative z-10">
              {{ gameData.level }}
            </span>
            </div>

            <!-- Монетки -->
            <div
                class="flex relative h-8 justify-center items-center shadow-md bg-white/10 backdrop-blur-md whitespace-nowrap w-15 py-1 rounded-xl border border-white/10"
                :class="isCoinPopping ? 'animate-pop' : ''"
            >
              <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="Монеты" width="15" class="shrink-0">
              <span class="text-xs font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
              {{ formatNumber(gameData.coins) }}
            </span>
            </div>

            <!-- Клики -->
            <div
                class="flex relative h-8 justify-center items-center shadow-md bg-white/10 backdrop-blur-md w-15 max-w-15 py-1 rounded-xl border whitespace-nowrap border-white/10"
                :class="isPopping ? 'animate-pop' : ''"
            >
              <img :src="`/gamePlay/click_icon.webp?v=${APP_VERSION}`" alt="Клики" width="20" class="shrink-0">
              <span class="text-xs font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
              {{ formatNumber(gameData.clickCounter) }}
            </span>
              <div v-show="isBothStatsZero && (clickLimit - ZeroPlayCount)<=10"
                   class="absolute animate-pulse opacity-80 w-8">
                <img :src="`/gamePlay/warning_icons.webp?v=${APP_VERSION}`" alt="" class="shrink-0">
              </div>
            </div>
            <!-- Смерти -->
            <div
                class="flex relative h-8 justify-center items-center shadow-md bg-white/10 backdrop-blur-md w-15 max-w-15 py-1 rounded-xl border whitespace-nowrap border-white/10"
            >
              <img :src="`/gamePlay/hunting_trophy.webp?v=${APP_VERSION}`" alt="Смерти" width="25" class="shrink-0">
              <span class="text-xs font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
              {{ formatNumber(gameData.deathsCount) }}
            </span>
            </div>
          </div>
        </div>

        <div class="absolute bottom-0 left-5 flex items-center gap-2 w-full">
          <div class="flex justify-center items-center gap-1.5 pb-1">
            <img
                v-for="i in maxLives"
                :key="i"
                :src="i <= gameData.lives ? `/gamePlay/heart.webp?v=${APP_VERSION}` : `/gamePlay/heart_empty.webp?v=${APP_VERSION}`"
                :class="i <= gameData.lives && gameData.lives<=1 ? 'animate-pulse' : ''"
                alt="Жизнь"
                width="18"
            >
          </div>
        </div>

        <div class="absolute bottom-1 left-1/2 -translate-x-15 w-max flex items-end gap-1">
          <!-- Иконка X2 -->
          <div
              class="relative w-5 h-5 transition-transform duration-100"
              :class="{
              'animate-combo-active z-10': progressX2 >= 100,
              'scale-115': isClicking && progressX2 > 0 && progressX2 < 100
            }"
          >
            <img :src="`/gamePlay/x2_combo_icons.webp?v=${APP_VERSION}`"
                 class="absolute inset-0 w-full h-full brightness-45" alt="x2"/>
            <img
                src="/gamePlay/x2_combo_icons.webp"
                class="absolute inset-0 w-full h-full transition-all duration-75 ease-linear"
                :class="{ 'brightness-125': progressX2 >= 100, 'brightness-100': progressX2 < 100 }"
                :style="{ clipPath: `inset(${getClipInset(progressX2)})` }"
                alt="x2"
            />
          </div>

          <!-- Иконка X3 -->
          <div
              class="relative w-6 h-6 transition-transform duration-100"
              :class="{
              'animate-combo-active z-10': progressX3 >= 100,
              'scale-115': isClicking && progressX3 > 0 && progressX3 < 100
            }"
          >
            <img :src="`/gamePlay/x3_combo_icons.webp?v=${APP_VERSION}`"
                 class="absolute inset-0 w-full h-full brightness-45" alt="x3"/>
            <img
                src="/gamePlay/x3_combo_icons.webp"
                class="absolute inset-0 w-full h-full transition-all duration-75 ease-linear"
                :class="{'brightness-125': progressX3 >= 100, 'brightness-100': progressX3 < 100 }"
                :style="{ clipPath: `inset(${getClipInset(progressX3)})` }"
                alt="x3"
            />
          </div>

          <!-- Иконка X5 -->
          <div
              class="relative w-7 h-7 transition-transform duration-100"
              :class="{
              'animate-combo-active z-10': progressX5 >= 100 && !isBothStatsZero,
              'scale-115': isClicking && progressX5 > 0 && progressX5 < 100 && !isBothStatsZero
            }"
          >
            <img :src="`/gamePlay/x5_combo_icons.webp?v=${APP_VERSION}`"
                 class="absolute inset-0 w-full h-full brightness-45" alt="x5"/>
            <img
                src="/gamePlay/x5_combo_icons.webp"
                class="absolute inset-0 w-full h-full transition-all duration-75 ease-linear"
                :class="{ ' brightness-125': progressX5 >= 100 && !isBothStatsZero, 'brightness-100': progressX5 < 100 && !isBothStatsZero }"
                :style="{ clipPath: `inset(${isBothStatsZero ? '100%' : getClipInset(progressX5)})` }"
                alt="x5"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно со скроллом и вкладками -->
    <Transition name="fade">
      <div
          v-if="showStatsModal"
          class="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showStatsModal = false"
      >
        <div
            class="bg-[#fff6ef] border-2 border-[#3399FF] rounded-3xl p-5 w-full max-w-xs h-130 shadow-2xl relative flex flex-col justify-between">

          <!-- Шапка: Переключатель вкладок + Кнопки смены языка -->
          <div class="flex flex-col gap-2 shrink-0">
            <div class="flex justify-end items-center px-1">
              <div class="flex gap-1">
                <button
                    @click="changeLanguage('en')"
                    class="px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all"
                    :class="$i18n.locale === 'en' ? 'bg-[#3399FF] text-white border-[#3399FF]' : 'bg-white/60 text-gray-600 border-gray-300'"
                >
                  EN
                </button>
                <button
                    @click="changeLanguage('ru')"
                    class="px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all"
                    :class="$i18n.locale === 'ru' ? 'bg-[#3399FF] text-white border-[#3399FF]' : 'bg-white/60 text-gray-600 border-gray-300'"
                >
                  RU
                </button>

              </div>
            </div>

            <!-- Переключатель вкладок -->
            <div class="flex bg-[#98E5FE]/60 p-1 rounded-2xl border border-[#3399FF]">
              <button
                  @click="activeTab = 'tasks'"
                  class="flex-1 py-1.5 text-xs font-bold rounded-xl transition-all"
                  :class="activeTab === 'tasks' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'"
              >
                <span class="flex items-center justify-center gap-1">
                  <img src="/gamePlay/calendar.webp" class="w-4" alt="">
                  {{ $t(`tasks`) }}
                </span>
              </button>
              <button
                  @click="activeTab = 'stats'"
                  class="flex-1 py-1.5 text-xs font-bold rounded-xl transition-all"
                  :class="activeTab === 'stats' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'"
              >
                <span class="flex items-center justify-center gap-1">
                  <img src="/gamePlay/statistics.webp" class="w-4" alt="">
                  {{ $t(`intelligence`) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Центральный блок с контентом и скроллом -->
          <div class="flex-1 overflow-y-auto my-2 pr-1 custom-scroll">
            <!-- Вкладка "Задания" -->
            <div v-if="activeTab === 'tasks'">
              <DailyTasksModal/>
            </div>

            <!-- Вкладка "Сведения" -->
            <div v-else-if="activeTab === 'stats'" class="flex flex-col gap-2 text-sm mt-2">
              <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
                <span class="font-semibold text-gray-600">{{ $t(`level`) }}:</span>
                <span class="font-bold text-gray-800">{{ gameData.level }} ({{
                    $t(`exp`)
                  }}: {{ Math.floor(gameData.exp) }}/{{ Number(gameData.level) * 100 }})</span>
              </div>

              <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
                <div class="flex items-center gap-1.5">
                  <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="Монеты" width="18">
                  <span class="font-semibold text-gray-600">{{ $t(`coins`) }}</span>
                </div>
                <span class="font-bold text-amber-600">{{ formatFullNumber(gameData.coins) }}</span>
              </div>

              <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
                <div class="flex items-center gap-1.5">
                  <img :src="`/gamePlay/click_icon.webp?v=${APP_VERSION}`" alt="Клики" width="20">
                  <span class="font-semibold text-gray-600">{{ $t(`total_clicks`) }}</span>
                </div>
                <span class="font-bold text-gray-800">{{ formatFullNumber(gameData.clickCounter) }}</span>
              </div>

              <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
                <div class="flex items-center gap-1.5">
                  <img :src="`/gamePlay/hunting_trophy.webp?v=${APP_VERSION}`" alt="Смерти" width="20">
                  <span class="font-semibold text-gray-600">{{ $t(`total_deaths`) }}:</span>
                </div>
                <span class="font-bold text-gray-800">{{ formatFullNumber(gameData.deathsCount) }}</span>
              </div>

              <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
                <div class="flex items-center gap-1.5">
                  <img :src="`/gamePlay/hunger.webp?v=${APP_VERSION}`" alt="Сытость" width="18">
                  <span class="font-semibold text-gray-600">{{ $t(`satiety`) }}</span>
                </div>
                <span class="font-bold text-gray-800">{{ Math.trunc(gameData.foodLevel) }}%</span>
              </div>

              <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
                <div class="flex items-center gap-1.5">
                  <img :src="`/gamePlay/energy.webp?v=${APP_VERSION}`" alt="Энергия" width="18">
                  <span class="font-semibold text-gray-600">{{ $t(`energy`) }}</span>
                </div>
                <span class="font-bold text-gray-800">{{ Math.trunc(gameData.energy) }}%</span>
              </div>
            </div>
          </div>

          <!-- Нижняя кнопка «Закрыть» -->
          <button
              @click="showStatsModal = false"
              class="w-full bg-[#98E5FE] hover:bg-[#f3b584] text-gray-800 font-bold py-2 rounded-2xl border border-[#3399FF] transition-colors active:scale-95 shrink-0"
          >
            {{ $t(`close`) }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(247, 201, 165, 0.8);
  border-radius: 4px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.2) translateY(0px);
  }
}

.animate-pulse {
  animation: pulse 0.7s ease-in-out infinite;
}

@keyframes customPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.01);
    opacity: 1;
  }
}

.animate-custom-pulse {
  animation: customPulse 0.8s ease-in-out infinite;
}

@keyframes comboActivePulse {
  0%, 100% {
    transform: scale(1.2) rotate(-5deg);
  }
  50% {
    transform: scale(1.3) rotate(5deg);
  }
}

.animate-combo-active {
  animation: comboActivePulse 0.6s ease-in-out infinite;
}

@keyframes popCharacter {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-pop {
  animation: popCharacter 0.2s ease-out;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>