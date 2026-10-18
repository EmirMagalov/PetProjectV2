<script setup>

import {
  claimReward, getTaskPercent,
  getTaskProgress,
  isTaskClaimed,
  isTaskCompleted,
  loadingKey,
  TASKS_CONFIG
} from "@/scripts/dealyTasks.js";
</script>

<template>
  <div class="p-4  max-w-md w-full mx-auto ">
    <!-- Шапка -->
    <div class="flex justify-center  items-center mb-4">

        <span class="text-md">Ежедневные задания</span>

     
    </div>

    <!-- Список заданий -->
    <div class="space-y-2">
      <div
          v-for="(config, key) in TASKS_CONFIG"
          :key="key"
          class=" p-3.5 relative rounded-xl border border-[#f7c9a5]/40 flex flex-col gap-2 transition-all"
          :class="isTaskCompleted(key, config.target) && !isTaskClaimed(key)? 'bg-green-200':'bg-[#f7c9a5]',isTaskClaimed(key)?'bg-gray-500':'bg-[#f7c9a5]'"
      >
        <div class="flex justify-center  items-start">

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
        <div class="flex items-end justify-center gap-2 mt-1">
          <!-- Награда -->
          <div class="flex flex-col ">
            <span>Награда</span>
            <div
                class="flex items-center gap-0.5 text-yellow-500 text-xs font-bold bg-yellow-100 px-3 py-1 rounded-lg border border-yellow-400/20">
              <img class="w-5 drop-shadow-[0_2px_1px_rgba(0,0,5,0.8)]" src="/gamePlay/coin.webp" alt="">
              <span class="text-shadow-sm text-shadow-black">{{ config.reward }} </span>
            </div>
          </div>

          <!-- Задание выполнено, но награда не забрана -->
          <button
              v-if="isTaskCompleted(key, config.target) && !isTaskClaimed(key)"
              @click="claimReward(key)"
              :disabled="loadingKey === key"
              class="text-xs px-2 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold shadow-md active:scale-95 transition-all flex items-center gap-1"
          >

            <span  v-show="loadingKey !== key">Забрать награду</span>
          </button>

          <!-- Награда уже зафиксирована -->
          <span
              v-else-if="isTaskClaimed(key)"
              class="text-xs px-2.5 py-1 text-green-400 font-semibold flex items-center gap-1 bg-green-500/10 rounded-lg border border-green-500/20"
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
    transform: scale(1.2) translateY(0px);
  }
}

.animate-pulse {
  animation: pulse 0.7s ease-in-out infinite;
}
</style>
