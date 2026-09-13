<script setup>
const props=defineProps({
  statusFoam:Boolean,
})
</script>

<template>
  <div v-if="props.statusFoam" class="absolute inset-0 flex justify-center items-center pointer-events-none z-15">
    <div class="relative w-10 h-10 flex items-center justify-center">

      <!-- Пузыри слева -->
      <div class="absolute top-2 left-10 w-6 h-6 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>
      <div class="absolute top-20 left-2 w-8 h-8 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>

      <!-- Пузыри справа -->
      <div class="absolute top-2 left-0 w-8 h-8 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>
      <div class="absolute top-18 left-10 w-9 h-9 bg-white/70 rounded-full shadow-inner  animate-bounce" style="animation-duration: 10s;"></div>

      <!-- Шарики на макушке (шапка пены) -->
      <div class="absolute top-10 left-5 w-8 h-8 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>
      <div class="absolute top-15 -left-8 w-10 h-10 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>
      <div class="absolute top-5 -left-5 w-8 h-8 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>
      <div class="absolute top-12 left-2 w-6 h-6 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>
      <div class="absolute top-21 left-0 w-8 h-8 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>
      <div class="absolute top-22 left-0 w-6 h-6 bg-white/70 rounded-full shadow-inner animate-bounce" style="animation-duration: 10s;"></div>

    </div>
  </div>
</template>

<style scoped>

</style>