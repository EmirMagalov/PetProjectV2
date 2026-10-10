<script setup>
import {gameData, isBadMood} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
</script>

<template>
  <!-- Обычное облако (при хорошем настроении) -->
  <Transition name="cloud-fade">
    <div v-show="!isBadMood" class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div class="absolute top-2 w-16 cloud-drift-container blur-[2px]">
        <div class="animate-cloud-sway-1">
          <img :src="`/gamePlay/cloud.webp?v=${APP_VERSION}`" alt="">
        </div>
      </div>
    </div>
  </Transition>

  <!-- Штормовые тучи (при плохом настроении) -->
  <Transition name="cloud-fade">
    <div
        v-show="isBadMood"
        class="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <!-- Левое штормовое облако -->
      <div class="absolute -top-2 left-0 w-24 animate-storm-drift-left blur-[2px]">
        <div class="animate-cloud-sway-2">
          <img :src="`/gamePlay/storm_cloud.webp?v=${APP_VERSION}`" alt="">
        </div>
      </div>

      <!-- Среднее штормовое облако -->
      <div class="absolute top-4 left-5 w-11 animate-storm-drift-middle blur-[2px]">
        <div class="animate-cloud-sway-1">
          <img :src="`/gamePlay/storm_cloud.webp?v=${APP_VERSION}`" alt="">
        </div>
      </div>

      <!-- Правое штормовое облако -->
      <div class="absolute top-5 left-5 w-15 animate-storm-drift-right blur-[2px]">
        <div class="animate-cloud-sway-1">
          <img :src="`/gamePlay/storm_cloud.webp?v=${APP_VERSION}`" alt="">
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Плавное появление и исчезновение всего блока */
.cloud-fade-enter-active {
  transition: opacity 1s ease;
}
.cloud-fade-leave-active {
  transition: opacity 0.8s ease;
}

.cloud-fade-enter-from,
.cloud-fade-leave-to {
  opacity: 0;
}

/* 1. Обычное облако */
.cloud-drift-container {
  animation: driftCloud 50s linear infinite;
  animation-delay: -15s;
  will-change: transform, opacity;
}

@keyframes driftCloud {
  0% { transform: translateX(180px); opacity: 0; }
  10% { opacity: 0.7; }
  90% { opacity: 0.7; }
  100% { transform: translateX(-100px); opacity: 0; }
}

/* 2. Правое штормовое облако (55 сек) */
.animate-storm-drift-right {
  animation: driftStormRight 55s linear infinite;
  animation-delay: 0s; /* Стартует сразу */
  will-change: transform, opacity;
}

@keyframes driftStormRight {
  0% { transform: translateX(380px); opacity: 0; }
  5% { opacity: 0.7; }
  95% { opacity: 0.7; }
  100% { transform: translateX(-100px); opacity: 0; }
}

/* 3. Среднее штормовое облако (60 сек, сдвинуто ровно на треть цикла) */
.animate-storm-drift-middle {
  animation: driftStormMiddle 60s linear infinite;
  animation-delay: -20s;
  will-change: transform, opacity;
}

@keyframes driftStormMiddle {
  0% { transform: translateX(380px); opacity: 0; }
  5% { opacity: 0.7; }
  95% { opacity: 0.7; }
  100% { transform: translateX(-100px); opacity: 0; }
}

/* 4. Левое штормовое облако (60 сек, сдвинуто на две трети цикла) */
.animate-storm-drift-left {
  animation: driftStormLeft 60s linear infinite;
  animation-delay: -40s;
  will-change: transform, opacity;
}

@keyframes driftStormLeft {
  0% { transform: translateX(380px); opacity: 0; }
  5% { opacity: 0.7; }
  95% { opacity: 0.7; }
  100% { transform: translateX(-100px); opacity: 0; }
}

/* Бесконечное покачивание */


@keyframes gentleSway {
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(8px); }
}
</style>