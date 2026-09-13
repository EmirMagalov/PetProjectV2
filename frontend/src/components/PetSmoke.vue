<script setup>
const props = defineProps({
  statusSmoke: Boolean,
})
</script>

<template>
  <div v-if="props.statusSmoke" class="absolute inset-0 flex justify-center items-center pointer-events-none z-15">
    <div class="relative w-24 h-32 flex items-center justify-center">

      <!-- Каждому шарику задана своя задержка (animation-delay), чтобы они шли ровной чередой, а не толпой -->
      <div class="smoke-particle absolute bottom-0 w-12 h-12 bg-gray-400 opacity-0 rounded-full blur-[6px]" style="animation-delay: 0s; --x-offset: -20px;"></div>
      <div class="smoke-particle absolute bottom-0 w-14 h-14 bg-gray-500 opacity-0 rounded-full blur-[7px]" style="animation-delay: 0.8s; --x-offset: 25px;"></div>
      <div class="smoke-particle absolute bottom-0 w-10 h-10 bg-gray-400 opacity-0 rounded-full blur-[5px]" style="animation-delay: 1.6s; --x-offset: -10px;"></div>
      <div class="smoke-particle absolute bottom-0 w-16 h-16 bg-gray-600 opacity-0 rounded-full blur-[9px]" style="animation-delay: 2.4s; --x-offset: 15px;"></div>
      <div class="smoke-particle absolute bottom-0 w-12 h-12 bg-gray-400 opacity-0 rounded-full blur-[6px]" style="animation-delay: 3.2s; --x-offset: -30px;"></div>
      <div class="smoke-particle absolute bottom-0 w-15 h-15 bg-gray-500 opacity-0 rounded-full blur-[8px]" style="animation-delay: 4.0s; --x-offset: 5px;"></div>

    </div>
  </div>
</template>

<style scoped>
@keyframes longRiseAndSpread {
  0% {
    transform: translateY(0px) translateX(0) scale(0.4);
    opacity: 0;
  }
  20% {
    opacity: 0.6; /* Плавное появление */
  }
  80% {
    opacity: 0.4; /* Долго держится на средней высоте */
  }
  100% {
    /* Растянули длину подъема до -220px и увеличили масштаб до 3х */
    transform: translateY(-220px) translateX(var(--x-offset)) scale(3);
    opacity: 0; /* Полное растворение в самом верху */
  }
}

.smoke-particle {
  /* Увеличили время жизни частицы до 5 секунд, чтобы шлейф был длинным */
  animation: longRiseAndSpread 5s linear infinite;
}
</style>