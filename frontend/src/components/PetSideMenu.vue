<script setup>

import {
  gameData,
  isGameOver,
  FatPlayCount,
  ZeroPlayCount,
  isBothStatsZero,
  clickLimit
} from "@/scripts/useGameStore.js";
</script>

<template>
  <div v-show="!isGameOver"  class="absolute top-10 left-2 z-150 flex flex-col gap-1">

    <!-- Первая иконка (Fat) -->
    <div v-show="gameData.isFat" class="relative transition-transform duration-50 animate-pulse">
      <img class="absolute left-5 top-4  w-7 z-10" src="/gamePlay/click_icon.webp" alt="">
      <img class="relative w-10" src="/gamePlay/fat_icon.webp" alt="">
      <p class="absolute left-10 text-shadow-xs text-shadow-amber-50  top-6 font-bold text-sm z-20">{{ gameData.fatCount - FatPlayCount }}</p>
    </div>

    <!-- Вторая иконка (Sick) -->
    <div v-show="gameData.sick" class="relative animate-pulse ">
      <img class="absolute left-6 top-1 font-bold  w-8 z-10" src="/Laboratory/serums/health_serum.webp" alt="">
      <img class="relative w-10" src="/gamePlay/sick_icon.webp" alt="">
<!--      <p class="absolute left-10 text-shadow-xs text-shadow-amber-50  top-6 font-bold text-[15px] z-20">{{ 10 - fruitStreak }}</p>-->
    </div>
<!--    <div v-show="isBothStatsZero" class="relative animate-pulse ">-->
<!--      <img class="w-8" src="/gamePlay/heart_broken.webp" alt="">-->
<!--      <img class="absolute w-6 left-5 top-0" src="/gamePlay/warning_icons.webp" alt="">-->
<!--      <p class="absolute text-shadow-xs text-shadow-amber-50  top-4 left-5 font-bold text-sm z-20">{{clickLimit -  ZeroPlayCount}}</p>-->
<!--    </div>-->
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