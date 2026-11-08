<script setup>

import {
  gameData,
  FatPlayCount, showHunger, lowEnergy,
} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
</script>

<template>
  <div v-show="!gameData.isGameOver" class="absolute top-10  left-2 z-40 flex flex-col  gap-1">
    <!-- (Hunger) -->
<!--    <div v-show="showHunger" class="relative flex items-center transition-transform duration-50 animate-pulse">-->
<!--      <img  :src="`/gamePlay/hunger_icon.webp?v=${APP_VERSION}`" class="relative w-18" alt="hunger">-->
<!--    </div>-->
<!--    &lt;!&ndash; (Tired) &ndash;&gt;-->
<!--    <div v-show="lowEnergy" class="relative flex items-center transition-transform duration-50 animate-pulse">-->
<!--      <img  :src="`/gamePlay/tired_icon.webp?v=${APP_VERSION}`" class="relative w-18" alt="hunger">-->
<!--    </div>-->
    <!-- (Sick) -->
    <div v-if="gameData.sick" class="relative  flex items-center animate-pulse">
      <img class="relative w-10" src="/gamePlay/sick_icon.webp" alt="">
    </div>
    <div v-else-if="!gameData.sick && showHunger" class="relative  flex items-center animate-pulse">
      <img class="relative w-10" src="/gamePlay/hunger_icon.webp" alt="">
    </div>
    <div v-else-if="!gameData.sick && lowEnergy && !gameData.sleep" class="relative  flex items-center animate-pulse">
      <img class="relative w-10" src="/gamePlay/tired_icon.webp" alt="">
    </div>
    <!-- (Fat) -->
    <div v-show="gameData.isFat" class="relative flex items-center transition-transform duration-50 animate-pulse">
      <img class="absolute left-5 w-7 z-10" src="/gamePlay/click_icon.webp" alt="">
      <img class="relative w-10" src="/gamePlay/fat_icon.webp" alt="">
      <p class="absolute left-6 text-shadow-xs text-shadow-amber-50 top-6 font-bold text-sm z-20">{{ gameData.fatCount - FatPlayCount }}</p>
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