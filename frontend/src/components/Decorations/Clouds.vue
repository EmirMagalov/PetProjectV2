<script setup>
import {gameData, isBadMood} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
</script>

<template>
  <!-- Vue Transition управляет плавной aparición и исчезновением -->
  <Transition name="cloud-fade">
    <div
        v-show="isBadMood"
        class="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <!-- Первое облако (справа) -->
      <div class="absolute top-1 right-30 w-15 animate-cloud-appear-right  blur-[2px]">
        <div class="animate-cloud-sway-1">
          <img :src="`/gamePlay/cloud.webp?v=${APP_VERSION}`" alt="">
        </div>
      </div>

      <!-- Второе облако (слева) -->
      <div class="absolute -top-3 left-0 w-28 animate-cloud-appear-left blur-[2px]">
        <div class="animate-cloud-sway-2">
          <img :src="`/gamePlay/cloud.webp?v=${APP_VERSION}`" alt="">
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
  transition: opacity 0.8s ease; /* Время исчезновения */
}

.cloud-fade-enter-from,
.cloud-fade-leave-to {
  opacity: 0;
}

/* Анимация входа (появления) */
.animate-cloud-appear-right {
  animation: appearFromRight 1.5s ease-out forwards;
  will-change: transform, opacity;
}

.animate-cloud-appear-left {
  animation: appearFromLeft 1.5s ease-out forwards;
  animation-delay: 0.3s;
  will-change: transform, opacity;
}

@keyframes appearFromRight {
  0% {
    opacity: 0;
    transform: translateX(100px);
  }
  100% {
    opacity: 0.8;
    transform: translateX(0);
  }
}

@keyframes appearFromLeft {
  0% {
    opacity: 0;
    transform: translateX(-100px);
  }
  100% {
    opacity: 0.8;
    transform: translateX(-35px);
  }
}

/* Бесконечное покачивание */
.animate-cloud-sway-1 {
  animation: gentleSway 6s ease-in-out infinite;
  will-change: transform;
}

.animate-cloud-sway-2 {
  animation: gentleSway 8s ease-in-out infinite;
  animation-delay: -3s;
  will-change: transform;
}

@keyframes gentleSway {
  0%, 100% {
    transform: translateX(0px);
  }
  50% {
    transform: translateX(8px);
  }
}
</style>