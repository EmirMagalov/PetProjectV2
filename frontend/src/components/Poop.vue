<script setup>
import { ref } from 'vue'
import {gameData} from "@/scripts/useGameStore.js";
import {addCoin} from "@/scripts/actions.js";
import {addExp} from "@/scripts/level.js";

// Генерируем случайные координаты ОДИН РАЗ при создании, чтобы какашка не прыгала
const randomLeft = ref(Math.floor(Math.random() * 71) + 10)
const randomBottom = ref(Math.floor(Math.random() * 15))

const Clean = ()=>{
  gameData.isPooped = false
  addCoin(10)
  addExp(20)
}

</script>

<template>
  <div @click="Clean()" class="absolute flex justify-center items-center bottom-4 right-15  z-8 w-8"
       >

    <!-- Основная картинка -->
    <img src="/gamePlay/poop.webp" alt="poop" class="w-full h-full object-contain">

    <!-- Летающая муха №1 -->
    <span class="absolute top-3 right-5 text-[7px] fly-anim-1">🪰</span>

    <!-- Летающая муха №2 (с задержкой анимации для естественности) -->
    <span class="absolute -top-1 right-0 text-[7px] fly-anim-2">🪰</span>
  </div>
</template>

<style scoped>
@keyframes fly1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-6px, -8px) scale(1.1); }
  66% { transform: translate(4px, -12px) scale(0.9); }
}

@keyframes fly2 {
  0%, 100% { transform: translate(0, 0) scale(0.9); }
  40% { transform: translate(8px, -10px) scale(1.1); }
  80% { transform: translate(-4px, -6px) scale(1); }
}

.fly-anim-1 {
  animation: fly1 1.6s infinite ease-in-out;
}

.fly-anim-2 {
  animation: fly2 1.3s infinite ease-in-out;
  animation-delay: 0.4s;
}
</style>