<script setup>
import { computed, ref, watch } from "vue";
import {gameData, isCoinPopping, isExpPopping, isPopping} from "@/scripts/useGameStore.js";
import ProgressBar from "@/components/ProgressBar.vue";
import { expPercentage } from "@/scripts/level.js";
import { comboClicks } from "@/scripts/actions.js";
import {APP_VERSION} from "@/scripts/constants.js";

// Локальный сглаженный счетчик для плавной анимации спада
const animatedComboClicks = ref(0);
let drainInterval = null;

// Импульс при тапе
const isClicking = ref(false);
let clickTimeout = null;

watch(comboClicks, (newVal) => {
  if (newVal > animatedComboClicks.value) {
    // При кликах мгновенно подтягиваем шкалу вверх
    if (drainInterval) clearInterval(drainInterval);
    animatedComboClicks.value = newVal;

    isClicking.value = true;
    if (clickTimeout) clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      isClicking.value = false;
    }, 100);
  } else if (newVal === 0 && animatedComboClicks.value > 0) {
    // КОГДА КОМБО СБРОСИЛОСЬ: плавно уменьшаем значение по шагам до 0
    if (drainInterval) clearInterval(drainInterval);

    drainInterval = setInterval(() => {
      if (animatedComboClicks.value > 0) {
        // Скорость сброса: за каждый шаг отнимаем 2% или 1 клик
        const step = Math.max(1, Math.ceil(animatedComboClicks.value / 15));
        animatedComboClicks.value = Math.max(0, animatedComboClicks.value - step);
      } else {
        clearInterval(drainInterval);
      }
    }, 15); // Обновление каждые 30мс даст идеально плавную анимацию стекания
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

// Прогресс теперь считается от СГЛАЖЕННОГО локального значения animatedComboClicks
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
  <div class="p-2">
    <!-- Клик по любому месту плашки откроет подробную статистику -->
    <div
        @click="showStatsModal = true"
        class="relative shadow-2xl  rounded-2xl bg-white/20 backdrop-blur-md cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div class="flex justify-between gap-2 p-2">
        <div class="flex flex-col gap-1">
          <ProgressBar :image="`/gamePlay/hunger.webp?v=${APP_VERSION}`" name="Сытость" :value="gameData.foodLevel" color="#FFF700"/>
          <ProgressBar :image="`/gamePlay/energy.webp?v=${APP_VERSION}`" name="Энергия" :value="gameData.energy" color="#50A2FF"/>
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
          </div>
          <!-- Смерти -->
          <div
              class="flex relative h-8 justify-center items-center shadow-md bg-white/10 backdrop-blur-md w-15 max-w-15 py-1 rounded-xl border whitespace-nowrap border-white/10"

          >
            <img :src="`/gamePlay/scull_icon.webp?v=${APP_VERSION}`" alt="Клики" width="20" class="shrink-0">
            <span class="text-xs font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
              {{ formatNumber(gameData.deathsCount) }}
            </span>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 left-5 flex items-center gap-2 w-full">
        <div class="flex justify-center items-center gap-1.5 pb-1">
          <img
              v-for="i in 3"
              :key="i"
              :src="i <= gameData.lives ? `/gamePlay/heart.webp?v=${APP_VERSION}` : `/gamePlay/heart_empty.webp?v=${APP_VERSION}`"
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
          <img :src="`/gamePlay/x2_combo_icons.webp?v=${APP_VERSION}`" class="absolute inset-0 w-full h-full brightness-45" alt="x2" />
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
          <img :src="`/gamePlay/x3_combo_icons.webp?v=${APP_VERSION}`" class="absolute inset-0 w-full h-full brightness-45" alt="x3" />
          <img
              src="/gamePlay/x3_combo_icons.webp"
              class="absolute inset-0 w-full h-full transition-all duration-75 ease-linear"
              :class="{ ' brightness-125': progressX3 >= 100, 'brightness-100': progressX3 < 100 }"
              :style="{ clipPath: `inset(${getClipInset(progressX3)})` }"
              alt="x3"
          />
        </div>

        <!-- Иконка X5 -->
        <div
            class="relative w-7 h-7 transition-transform duration-100"
            :class="{
              'animate-combo-active z-10': progressX5 >= 100,
              'scale-115': isClicking && progressX5 > 0 && progressX5 < 100
            }"
        >
          <img :src="`/gamePlay/x5_combo_icons.webp?v=${APP_VERSION}`" class="absolute inset-0 w-full h-full brightness-45" alt="x5" />
          <img
              src="/gamePlay/x5_combo_icons.webp"
              class="absolute inset-0 w-full h-full transition-all duration-75 ease-linear"
              :class="{ ' brightness-125': progressX5 >= 100, 'brightness-100': progressX5 < 100 }"
              :style="{ clipPath: `inset(${getClipInset(progressX5)})` }"
              alt="x5"
          />
        </div>

      </div>
    </div>

    <!-- Модальное окно с подробной статистикой -->
    <Transition name="fade">
      <div
          v-if="showStatsModal"

          class="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showStatsModal = false"
      >
        <div class="bg-[#fff6ef] border-2 border-[#f7c9a5] rounded-3xl p-5 w-full max-w-xs shadow-2xl relative flex flex-col gap-3">

          <h3 class="text-lg font-bold text-center text-gray-800">Сведения</h3>

          <div class="flex flex-col gap-2 text-sm">
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <span class="font-semibold text-gray-600">Уровень:</span>
              <span class="font-bold text-gray-800">{{ gameData.level }} (Опыт: {{gameData.exp}}/{{Number(gameData.level) * 100}})</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="Монеты" width="18">
                <span class="font-semibold text-gray-600">Монеты:</span>
              </div>
              <span class="font-bold text-amber-600">{{ formatFullNumber(gameData.coins) }}</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/click_icon.webp?v=${APP_VERSION}`" alt="Клики" width="20">
                <span class="font-semibold text-gray-600">Всего кликов:</span>
              </div>
              <span class="font-bold text-gray-800">{{ formatFullNumber(gameData.clickCounter) }}</span>
            </div>
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/scull_icon.webp?v=${APP_VERSION}`" alt="Клики" width="20">
                <span class="font-semibold text-gray-600">Всего смертей:</span>
              </div>
              <span class="font-bold text-gray-800">{{ formatFullNumber(gameData.deathsCount) }}</span>
            </div>
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/hunger.webp?v=${APP_VERSION}`" alt="Сытость" width="18">
                <span class="font-semibold text-gray-600">Сытость:</span>
              </div>
              <span class="font-bold text-gray-800">{{ Math.trunc(gameData.foodLevel) }}%</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/energy.webp?v=${APP_VERSION}`" alt="Энергия" width="18">
                <span class="font-semibold text-gray-600">Энергия:</span>
              </div>
              <span class="font-bold text-gray-800">{{ Math.trunc(gameData.energy) }}%</span>
            </div>
          </div>

          <button
              @click="showStatsModal = false"
              class="mt-1 bg-[#f7c9a5] hover:bg-[#f3b584] text-gray-800 font-bold py-2 rounded-2xl border border-[#e2a87a] transition-colors active:scale-95"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
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