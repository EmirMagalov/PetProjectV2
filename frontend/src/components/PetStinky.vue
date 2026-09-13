<script setup>

import {gameData} from "@/scripts/useGameStore.js";
</script>

<template>
  <div v-show="gameData.stinky"  class="absolute inset-0 flex justify-center items-center pointer-events-none z-15">
    <div class="relative w-24 h-24 flex justify-center items-center">

      <!-- Облачко тумана 1 (левое) -->
      <div class="absolute bottom-0 -left-2 w-16 h-12 bg-lime-400/50 rounded-[40%] blur-[6px] animate-toxic-fog"></div>

      <!-- Облачко тумана 2 (правое) -->
      <div class="absolute bottom-2 -right-4 w-14 h-10 bg-emerald-500/40 rounded-full blur-[5px] animate-toxic-fog" style="animation-delay: 0.8s;"></div>

      <!-- Облачко тумана 3 (центральное) -->
      <div class="absolute -bottom-4 left-4 w-20 h-14 bg-lime-500/40 rounded-[50%] blur-[7px] animate-toxic-fog" style="animation-delay: 1.6s;"></div>

      <!-- Облачко тумана 4 (маленькое, быстрое) -->
      <div class="absolute bottom-6 left-2 w-10 h-8 bg-emerald-400/50 rounded-full blur-[4px] animate-toxic-fog-fast" style="animation-delay: 0.4s;"></div>

      <div class="absolute top-30 left-2 w-6 h-8 bg-emerald-400/50 rounded-full blur-[4px] animate-toxic-fog-fast" style="animation-delay: 0.4s;"></div>

    </div>
  </div>
</template>

<style scoped>
/* Анимация медленных больших облаков тумана */
@keyframes toxicFog {
  0% {
    transform: translateY(10px) scale(0.8);
    opacity: 0;
  }
  25% {
    opacity: 0.7; /* Появляется густой туман */
  }
  75% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-40px) scale(1.6); /* Расширяется и поднимается */
    opacity: 0; /* Растворяется в воздухе */
  }
}

/* Анимация быстрых маленьких облачков тумана */
@keyframes toxicFogFast {
  0% {
    transform: translateY(5px) scale(0.5);
    opacity: 0;
  }
  30% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-50px) scale(1.2);
    opacity: 0;
  }
}

.animate-toxic-fog {
  animation: toxicFog 3s ease-in-out infinite;
}

.animate-toxic-fog-fast {
  animation: toxicFogFast 2s ease-in-out infinite;
}
</style>