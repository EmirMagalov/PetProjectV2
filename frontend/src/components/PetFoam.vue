<script setup>
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
    <div class="relative w-10 h-10 flex items-center justify-center">

      <!-- Пузыри слева -->
      <div :class="bgColor" class="absolute top-2 left-10 w-6 h-6 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-20 left-2 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-15 left-5 w-6 h-6 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>

      <!-- Пузыри справа -->
      <div :class="bgColor" class="absolute top-2 left-0 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-18 left-10 w-9 h-9 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-11 left-10 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-11 -left-5 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>

      <!-- Шарики на макушке (шапка пены) -->
      <div :class="bgColor" class="absolute top-10 left-5 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-15 -left-8 w-10 h-10 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-5 -left-5 w-8 h-8 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>
      <div :class="bgColor" class="absolute top-12 left-2 w-6 h-6 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>

      <div :class="bgColor" class="absolute top-22 left-0 w-6 h-6 rounded-full animate-bounce bubble-glossy" style="animation-duration: 10s;"></div>

    </div>
  </div>
</template>

<style scoped>
.bubble-glossy {
  /*
    Используем несколько слоев фона:
    1. Сверху: радиальный градиент с белым бликом и тенью по краям (дает объем).
    2. Снизу: фоновый цвет, переданный через класс (например, bg-[#34bc39]/50).
    blend-mode позволяет цвету красиво просвечивать сквозь глянцевую пленку.
  */
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