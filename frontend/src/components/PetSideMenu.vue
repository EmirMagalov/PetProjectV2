<script setup>
import {
  gameData,
  FatPlayCount, showHunger, lowEnergy,
} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
</script>

<template>
  <div v-show="!gameData.isGameOver" class="absolute top-28 left-0 z-40 flex flex-col gap-1.5 pointer-events-none">

    <!-- (Sick) -->
    <div v-if="gameData.sick" class="relative flex items-center animate-pulse pointer-events-auto">
      <img class="relative w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow" :src="`/gamePlay/sick_icon.webp?v=${APP_VERSION}`" alt="">
    </div>

    <!-- (Hunger) -->
    <div v-else-if="!gameData.sick && showHunger" class="relative flex items-center animate-pulse pointer-events-auto">
      <img class="relative w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow" :src="`/gamePlay/hunger_icon.webp?v=${APP_VERSION}`" alt="">
    </div>

    <!-- (Tired) -->
    <div v-else-if="!gameData.sick && lowEnergy && !gameData.sleep" class="relative flex items-center animate-pulse pointer-events-auto">
      <img class="relative w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow" :src="`/gamePlay/tired_icon.webp?v=${APP_VERSION}`" alt="">
    </div>

    <!-- (Fat) -->
    <div v-show="gameData.isFat" class="relative flex items-center transition-transform duration-50 animate-pulse pointer-events-auto">
      <img class="absolute left-4 w-6 h-6 object-contain z-10" src="/gamePlay/click_icon.webp" alt="">
      <img class="relative w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow" :src="`/gamePlay/fat_icon.webp?v=${APP_VERSION}`" alt="">
      <p class="absolute left-5 text-shadow-xs text-shadow-amber-50 top-5 font-bold text-xs z-20 text-white">{{ gameData.fatCount - FatPlayCount }}</p>
    </div>

  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.03) translateY(1px);
  }
}

.animate-pulse {
  animation: pulse 0.5s ease-in-out infinite;
}
</style>