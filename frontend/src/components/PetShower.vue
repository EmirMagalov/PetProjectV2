<script setup>
const props=defineProps({
  statusShower:Boolean,
})
</script>

<template>
  <div v-show="props.statusShower" class="absolute inset-0 flex justify-center items-center pointer-events-none z-15">
    <div class="relative w-10 h-10 flex justify-center">

      <!-- Струйки воды (несколько тонких линий с анимацией падения) -->
      <div class="absolute top-0 left-0 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall"></div>
      <div class="absolute top-0 left-3 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.3s;"></div>
      <div class="absolute top-0 left-6 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.15s;"></div>
      <div class="absolute top-0 left-9 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>
      <div class="absolute top-0 left-12 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>

      <div class="absolute top-15 left-0 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall"></div>
      <div class="absolute top-15 left-3 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.3s;"></div>
      <div class="absolute top-15 left-6 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.15s;"></div>
      <div class="absolute top-15 left-9 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>
      <div class="absolute top-15 left-12 w-[2px] h-6 bg-gradient-to-b from-cyan-200/0 via-cyan-300 to-cyan-400 animate-water-fall" style="animation-delay: 0.25s;"></div>




    </div>
  </div>
</template>

<style scoped>
/* Анимация струек воды */
@keyframes waterFall {
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  30% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(40px);
    opacity: 0;
  }
}

.animate-water-fall {
  animation: waterFall 0.3s linear infinite;
}
</style>