<script setup>

import {gameData, isBadMood} from "@/scripts/useGameStore.js";
</script>

<template>
  <div>
    <div
        :class="[
         'relative brightness-130 w-15 h-15 rounded-full shadow-sun pointer-events-none  transition-all duration-1000 ease-in-out',
         isBadMood?'bg-yellow-200':'bg-yellow-400 ',
         gameData.sleep ? '-top-20 left-[-50px] opacity-0 scale-50' : 'top-0 left-0 opacity-100 scale-100'
       ]">

    </div>

    <!-- Луна -->
    <div
        :class="[
             'absolute shadow-moon w-15 h-15 bg-[#f4f6f0] rounded-full pointer-events-none  transition-all duration-1000 ease-in-out',
             gameData.sleep ? 'top-0 left-0 opacity-100 scale-100' : '-top-20 left-[-50px] opacity-0 scale-50'
            ]">
      <div class="absolute top-3 left-2.5 w-4 h-4 rounded-full bg-[#d1d5db] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] opacity-70"></div>

      <!-- Кратер 2 (средний) -->
      <div class="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#9ca3af] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.3)] opacity-60"></div>

      <!-- Кратер 3 (маленький) -->
      <div class="absolute bottom-2 left-5 w-2 h-2 rounded-full bg-[#cbd5e1] shadow-[inset_1px_1px_1px_rgba(0,0,0,0.2)] opacity-80"></div>
    </div>
  </div>
</template>

<style scoped>
.shadow-moon {
  box-shadow:
      0 0 10px 3px rgba(255, 255, 255, 0.9),   /* Белоснежное ядро вокруг луны */
      0 0 25px 8px rgba(186, 224, 255, 0.6),   /* Мягкий голубоватый ореол */
      0 0 45px 15px rgba(147, 197, 253, 0.35); /* Дальний синеватый свет */
}
.shadow-sun {
  /* Мы используем несколько теней разного размера и размытия */
  box-shadow:
      0 0 10px 5px rgba(255, 230, 100, 0.8), /* Яркое ядро */
      0 0 25px 10px rgba(255, 210, 50, 0.6),  /* Широкий теплый ореол */
      0 0 50px 20px rgba(255, 180, 0, 0.3);  /* Очень мягкий, дальний свет */
}
</style>