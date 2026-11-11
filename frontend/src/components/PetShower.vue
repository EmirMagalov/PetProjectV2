<script setup>
defineProps({
  statusShower: Boolean,
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  }
})
</script>

<template>
  <!-- Позиционируем струю воды по координатам перетаскивания (смещаем чуть ниже курсора/душа) -->
  <div
      v-show="statusShower"
      class="absolute pointer-events-none z-20 transition-all duration-75 ease-out"
      :style="{ left: `${x-30}px`, top: `${y-65}px` }"
  >
    <div class="relative w-10 h-10 flex justify-center">
      <!-- Струйки воды (тонкие линии с анимацией падения) -->
      <div class="absolute top-0 left-0 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall"></div>
      <div class="absolute top-0 left-3 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.3s;"></div>
      <div class="absolute top-0 left-6 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.15s;"></div>
      <div class="absolute top-0 left-9 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>
      <div class="absolute top-0 left-12 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>

      <div class="absolute top-15 left-0 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall"></div>
      <div class="absolute top-15 left-3 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.3s;"></div>
      <div class="absolute top-15 left-6 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.15s;"></div>
      <div class="absolute top-15 left-9 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>
      <div class="absolute top-15 left-12 w-[2px] h-4 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes waterFall {
  0% {
    transform: translateY(-10px);
    opacity: 0;
  }
  30% {
    opacity: 0.9;
  }
  80% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(50px);
    opacity: 0;
  }
}

.animate-water-fall {
  animation: waterFall 0.25s linear infinite;
}
</style>