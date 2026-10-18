<script setup>
import { computed } from "vue";
import {
  claimReward,
  getTaskPercent,
  getTaskProgress,
  isTaskClaimed,
  isTaskCompleted,
  loadingKey,
  TASKS_CONFIG
} from "@/scripts/dealyTasks.js";

// Создаем отсортированный список заданий по приоритету:
// 1. Сначала те, которые можно забрать (выполнены, но не забраны)
// 2. Затем те, что в процессе выполнения
// 3. В самом конце те, которые уже получены
const sortedTasks = computed(() => {
  return Object.entries(TASKS_CONFIG).sort(([keyA], [keyB]) => {
    const aCompleted = isTaskCompleted(keyA, TASKS_CONFIG[keyA].target) && !isTaskClaimed(keyA);
    const bCompleted = isTaskCompleted(keyB, TASKS_CONFIG[keyB].target) && !isTaskClaimed(keyB);

    const aClaimed = isTaskClaimed(keyA);
    const bClaimed = isTaskClaimed(keyB);

    // Приоритет 1: Готовые к получению — выше
    if (aCompleted && !bCompleted) return -1;
    if (!aCompleted && bCompleted) return 1;

    // Приоритет 2: Полученные — ниже всего
    if (aClaimed && !bClaimed) return 1;
    if (!aClaimed && bClaimed) return -1;

    return 0;
  });
});
</script>

<template>
  <div class="p-4 max-w-md w-full mx-auto">
    <!-- Шапка -->
    <div class="flex justify-center items-center mb-4">
      <span class="text-md font-bold">Ежедневные задания</span>
    </div>

    <!-- Список заданий -->
    <div class="space-y-2">
      <div
          v-for="([key, config]) in sortedTasks"
          :key="key"
          class="p-3.5 relative rounded-xl border border-[#f7c9a5]/40 flex flex-col gap-2 transition-all"
          :class="{
            'bg-green-200': isTaskCompleted(key, config.target) && !isTaskClaimed(key),
            'bg-gray-400 opacity-50': isTaskClaimed(key),
            'bg-[#f7c9a5]': !isTaskCompleted(key, config.target) && !isTaskClaimed(key)
          }"
      >
        <div class="flex justify-center items-start">
          <div class="font-bold text-md text-gray-800">{{ config.title }}</div>
        </div>

        <!-- Прогресс-бар -->
        <div class="w-full relative bg-gray-700/70 h-10 rounded-xl overflow-hidden">
          <div class="absolute flex justify-center items-center inset-0 text-md text-yellow-100 mt-0.5">
            {{ getTaskProgress(key) }} / {{ config.target }}
          </div>
          <div
              class="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300 rounded-xl"
              :style="{ width: `${getTaskPercent(key, config.target)}%` }"
          ></div>
        </div>

        <!-- Кнопка статуса / получения -->
        <div class="flex items-end justify-between gap-2 mt-1">
          <!-- Награда -->
          <div class="flex items-center  flex-col">
            <span class="text-xs text-gray-700">Награда</span>
            <div
                class="flex flex-col items-center justify-center gap-0.5  text-xs font-bold bg-yellow-100 px-3 py-1 rounded-lg border border-yellow-400/20">
              <div  class="flex items-center justify-center gap-0.5">
                <img class="w-5 drop-shadow-[0_2px_1px_rgba(0,0,5,0.8)]" src="/gamePlay/coin.webp" alt="">
                <span class="text-shadow-sm text-yellow-500 text-shadow-black">{{ config.reward }}</span>
              </div>
              <div  class="flex items-center justify-center gap-0.5">
                <img class="w-5 drop-shadow-[0_2px_1px_rgba(0,0,5,0.8)]" src="/gamePlay/exp.webp" alt="">
                <span class="text-shadow-sm text-blue-400 text-shadow-black">{{ config.exp }}</span>
              </div>

            </div>
          </div>

          <!-- Задание выполнено, но награда не забрана -->
          <button
              v-if="isTaskCompleted(key, config.target) && !isTaskClaimed(key)"
              @click="claimReward(key)"
              :disabled="loadingKey === key"
              class="text-xs px-2 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 animate-pulse text-white font-bold shadow-md flex items-center gap-1"
          >
            <span v-show="loadingKey !== key">Забрать награду</span>
          </button>

          <!-- Награда уже зафиксирована -->
          <span
              v-else-if="isTaskClaimed(key)"
              class="text-xs px-2.5 py-1 text-green-400 font-bold text-shadow-2xs text-shadow-black flex items-center gap-1  rounded-lg "
          >
            ✓ Получено
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.05) translateY(0px);
  }
}

.animate-pulse {
  animation: pulse 1s ease-in-out infinite;
}
</style>