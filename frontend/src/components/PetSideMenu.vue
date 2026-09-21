<script setup>

import {fruitStreak, gameData, PlayCount} from "@/scripts/useGameStore.js";
</script>

<template>
  <div class="absolute top-10 left-2 z-150 flex flex-col gap-1">

    <!-- Первая иконка (Fat) -->
    <div v-show="gameData.isFat" class="relative transition-transform duration-50 animate-pulse">
      <img class="absolute left-5 top-4  w-7 z-10" src="/gamePlay/click_icon.webp" alt="">
      <img class="relative w-10" src="/gamePlay/fat_icon.webp" alt="">
      <p class="absolute left-10 text-shadow-xs text-shadow-amber-50  top-6 font-bold text-[15px] z-20">{{ 30 - PlayCount }}</p>
    </div>

    <!-- Вторая иконка (Sick) -->
    <div v-show="gameData.sick" class="relative animate-pulse ">
      <img class="absolute left-6 top-4 font-bold  w-6 z-10" src="/food/kiwi.webp" alt="">
      <img class="relative w-10" src="/gamePlay/sick_icon.webp" alt="">
      <p class="absolute left-10 text-shadow-xs text-shadow-amber-50  top-6 font-bold text-[15px] z-20">{{ 10 - fruitStreak }}</p>
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