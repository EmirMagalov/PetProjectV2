<script setup>
import { ref, computed } from "vue";
import { fruitStreak, gameData, isGameOver, PlayCount } from "@/scripts/useGameStore.js";
import ProgressBar from "@/components/ProgressBar.vue";
import { expPercentage } from "@/scripts/level.js";
import { animKey } from "@/scripts/actions.js";

function formatNumber(num) {
  if (num === undefined || num === null) return '0';

  if (num >= 1_000_000) {
    // Отсекает хвост: 1 590 000 -> 1.5M (а не 1.6M)
    const formatted = (Math.floor((num / 1_000_000) * 10) / 10).toString();
    return formatted + 'M';
  }
  if (num >= 10_000) {
    // Отсекает хвост: 10 900 -> 10.9K
    const formatted = (Math.floor((num / 1_000) * 10) / 10).toString();
    return formatted + 'K';
  }
  return num.toString();
}

// Переменная состояния для управления всплывающим окном
const showStatsModal = ref(false);

// Вспомогательный форматировщик для отображения чисел с разделителями (например: 1 234 567)
function formatFullNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('ru-RU');
}
</script>

<template>
  <div class="p-2">
    <!-- Клик по любому месту плашки откроет подробную статистику -->
    <div
        @click="showStatsModal = true"
        class="relative shadow-2xl rounded-2xl bg-white/20 backdrop-blur-md cursor-pointer active:scale-[0.99] transition-transform"
    >
      <div class="flex justify-between gap-2 p-2">
        <div class="flex flex-col gap-1">
          <ProgressBar image="/gamePlay/hunger.webp" name="Сытость" :value="gameData.foodLevel" color="#FFF700"/>
          <ProgressBar image="/gamePlay/energy.webp" name="Энергия" :value="gameData.energy" color="#44B846"/>
        </div>

        <div class="grid grid-cols-2 gap-1 left-0.5">

          <!-- Уровень -->
          <div
              class="relative overflow-hidden flex items-center justify-center shadow-md bg-white/10 backdrop-blur-md w-15 max-w-15 py-1 rounded-xl border border-white/10">
            <div
                class="absolute left-0 top-0 bottom-0 bg-[#b0d9de]/80 transition-all duration-500 pointer-events-none z-0"
                :style="{ width: expPercentage + '%' }"
            ></div>
            <span class="text-xs font-semibold text-gray-700 relative z-10">Ур.</span>
            <span class="text-sm font-bold text-shadow-xs text-shadow-amber-50 text-gray-900 relative z-10">{{ gameData.level }}</span>
          </div>

          <!-- Монетки -->
          <div
              class="flex relative justify-center items-center shadow-md bg-white/10 backdrop-blur-md whitespace-nowrap w-15 py-1 rounded-xl border border-white/10 animate-pop">
            <img src="/gamePlay/coin.webp" alt="Монеты" width="15" class="shrink-0">
            <span class="text-sm font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
              {{ formatNumber(gameData.coins)}}
            </span>
          </div>

          <!-- Клики -->
          <div
              :key="animKey"
              class="flex relative items-center shadow-md bg-white/10 backdrop-blur-md w-15 max-w-15 py-1 rounded-xl border whitespace-nowrap border-white/10 animate-pop">
            <img src="/gamePlay/click_icon.webp" alt="Клики" width="20" class="shrink-0">
            <span class="text-sm font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
              {{ formatNumber(gameData.clickCounter) }}
            </span>
          </div>

        </div>
      </div>

      <div class="absolute bottom-0 left-5 flex items-center gap-2 w-full">
        <div class="flex justify-center items-center gap-1.5 pb-1">
          <img
              v-for="i in 3"
              :key="i"
              :src="i <= gameData.lives ? '/gamePlay/heart.webp' : '/gamePlay/heart_empty.webp'"
              alt="Жизнь"
              width="18"
          >
        </div>
      </div>
    </div>

    <!-- Модальное окно с подробной статистикой -->
    <Transition name="fade">
      <div
          v-if="showStatsModal"
          @touchmove.prevent
          class="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showStatsModal = false"
      >
        <div class="bg-[#fff6ef] border-2 border-[#f7c9a5] rounded-3xl p-5 w-full max-w-xs shadow-2xl relative flex flex-col gap-3">

          <h3 class="text-lg font-bold text-center text-gray-800">Статистика игрока</h3>

          <div class="flex flex-col gap-2 text-sm">
            <!-- Уровень и Опыт -->
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <span class="font-semibold text-gray-600">Уровень:</span>
              <span class="font-bold text-gray-800">{{ gameData.level }} ({{ Math.round(expPercentage) }}%)</span>
            </div>

            <!-- Монеты -->
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img src="/gamePlay/coin.webp" alt="Монеты" width="18">
                <span class="font-semibold text-gray-600">Монеты:</span>
              </div>
              <span class="font-bold text-amber-600">{{ formatFullNumber(gameData.coins) }}</span>
            </div>

            <!-- Всего кликов -->
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img src="/gamePlay/click_icon.webp" alt="Клики" width="20">
                <span class="font-semibold text-gray-600">Всего кликов:</span>
              </div>
              <span class="font-bold text-gray-800">{{ formatFullNumber(gameData.clickCounter) }}</span>
            </div>

            <!-- Сытость -->
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img src="/gamePlay/hunger.webp" alt="Сытость" width="18">
                <span class="font-semibold text-gray-600">Сытость:</span>
              </div>
              <span class="font-bold text-gray-800">{{ Math.trunc(gameData.foodLevel) }}%</span>
            </div>

            <!-- Энергия -->
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img src="/gamePlay/energy.webp" alt="Энергия" width="18">
                <span class="font-semibold text-gray-600">Энергия:</span>
              </div>
              <span class="font-bold text-gray-800">{{ Math.trunc(gameData.energy) }}%</span>
            </div>
          </div>

          <!-- Кнопка закрытия -->
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
@keyframes popCharacter {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.animate-pop {
  animation: popCharacter 0.2s ease-out;
}

/* Анимация появления модального окна */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>