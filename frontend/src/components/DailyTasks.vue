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
  <div class="p-4  max-w-md w-full mx-auto  ">
    <!-- Шапка -->
    <div class="flex justify-center  items-center mb-4">

        <span class="text-md">Ежедневные задания</span>

     
    </div>

    <!-- Список заданий -->
    <div class="space-y-2">
      <div
          v-for="(config, key) in TASKS_CONFIG"
          :key="key"
          class="bg-white/60 p-3.5  rounded-xl border border-[#f7c9a5]/40 flex flex-col gap-2 transition-all"
      >
        <div class="flex justify-center  items-start">
          <div>
            <div class="font-medium text-sm text-gray-800">{{ config.title }}</div>

          </div>
          <!-- Награда -->

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
        <div class="flex justify-between mt-1">
          <div
              class="flex items-center gap-0.5 text-yellow-500 text-xs font-bold bg-yellow-100 px-3 py-1 rounded-lg border border-yellow-400/20">
            <img class="w-5" src="/gamePlay/coin.webp" alt="">
            <span class="text-shadow-sm text-shadow-black">{{ config.reward }} </span>
          </div>
          <!-- Задание выполнено, но награда не забрана -->
          <button
              v-if="isTaskCompleted(key, config.target) && !isTaskClaimed(key)"
              @click="claimReward(key)"
              :disabled="loadingKey === key"
              class="text-xs px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold shadow-md active:scale-95 transition-all flex items-center gap-1"
          >
            <span v-if="loadingKey === key">...</span>
            <span v-else>Забрать</span>
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