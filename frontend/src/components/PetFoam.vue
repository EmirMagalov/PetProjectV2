<script setup>
import {foamOffset, gameData} from "@/scripts/useGameStore.js";

defineProps({
  statusFoam: Boolean,
  bgColor: {
    default: "bg-white/70",
    type: String,
  },
})
</script>

<template>
  <div v-if="statusFoam" class="absolute inset-0 flex justify-center items-center pointer-events-none z-15">
    <!-- Общий контейнер пены со сдвигом и растворением -->
    <div
        class="relative w-10 h-10 flex items-center justify-center transition-transform duration-100 ease-out"
        :style="{
        transform: `translateY(${foamOffset}px)`,
        opacity: Math.max(0.6, 1 - (foamOffset / 60))
      }"
    >

      <!-- Уровень 1: Рогатые пузыри (исчезают первыми, когда foamOffset > 15) -->
      <div v-show="gameData.level >= 10 && foamOffset < 40">
        <div :class="bgColor" class="absolute top-2 left-10 w-6 h-6 rounded-full animate-bounce bubble-glossy transition-all duration-300" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-2 left-0 w-8 h-8 rounded-full animate-bounce bubble-glossy transition-all duration-300" style="animation-duration: 10s;"></div>
      </div>
      <div v-show="foamOffset < 30" :class="bgColor" class="absolute top-5 -left-5 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>

      <!-- Уровень 2: Основная масса пузырей (уменьшаются в размере по мере смыва) -->
      <div
          class="absolute inset-0 flex items-center justify-center transition-all duration-200"
          :style="{ transform: `scale(${Math.max(0.6, 1 - (foamOffset / 55))})` }"
      >
        <div :class="bgColor" class="absolute top-18 -left-8 w-9 h-9 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-20 left-2 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-15 left-5 w-6 h-6 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-18 left-10 w-9 h-9 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-11 left-10 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-11 -left-5 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      </div>

      <!-- Уровень 3: Нижние и самые стойкие пузыри (держатся дольше всего) -->
      <div v-show="foamOffset < 50">
        <div :class="bgColor" class="absolute top-10 left-5 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-12 left-2 w-6 h-6 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
        <div :class="bgColor" class="absolute top-22 left-0 w-6 h-6 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.bubble-glossy {
  background-image:
      radial-gradient(circle at 32% 32%,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(255, 255, 255, 0.3) 25%,
      rgba(255, 255, 255, 0.02) 50%,
      rgba(0, 0, 0, 0.25) 85%,
      rgba(255, 255, 255, 0.2) 100%
      );
  background-blend-mode: overlay;
  box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.9),
      inset -3px -3px 6px rgba(0, 0, 0, 0.25),
      0 2px 5px rgba(0, 0, 0, 0.15);
}
</style>