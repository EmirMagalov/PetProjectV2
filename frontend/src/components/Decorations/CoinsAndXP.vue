<script setup>
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {activeCoins, activeExp} from "@/scripts/actions.js";
</script>

<template>
  <div class="absolute z-5 inset-0 pointer-events-none overflow-hidden">
    <template v-for="group in activeCoins" :key="group.id">
      <div
          v-for="coin in group.coins"
          :key="coin.id"
          :style="{
          left: `${coin.x}px`,
          top: `${coin.y}px`,
          animationDelay: `${coin.delay}s`
        }"
          class="absolute flex items-center animate-coinFly pointer-events-none"
      >
        <img :src="`/gamePlay/plus_one_golden.webp?v=${APP_VERSION}`" class="w-3 h-3" alt="">
        <img
            :src="`/gamePlay/coin.webp?v=${APP_VERSION}`"
            class="w-5 h-5 object-contain"
            alt=""
        />

      </div>
    </template>
  </div>
  <div class="absolute z-5 inset-0 pointer-events-none overflow-hidden">
    <template v-for="group in activeExp" :key="group.id">
      <div
          v-for="exp in group.exp"
          :key="exp.id"
          :style="{
          left: `${exp.x}px`,
          top: `${exp.y}px`,
          animationDelay: `${exp.delay}s`
        }"
          class="absolute flex items-center animate-expFly pointer-events-none"
      >
        <img :src="`/gamePlay/plus_one_blue.webp?v=${APP_VERSION}`" class="w-3 h-3" alt="">
        <img
            :src="`/gamePlay/exp.webp?v=${APP_VERSION}`"
            class="w-5 h-5 object-contain"
            alt=""
        />

      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes coinFly {
  0% {
    transform: translate(0, 0) scale(0.5);

  }
  20% {

    transform: translate(0, -30px) scale(1.2);
  }
  25% {

    transform: translate(0px, -70px) scale(1.2);
  }
  100% {
    transform: translate(0px, -450px) scale(0.3);


  }
}

.animate-coinFly {
  animation: coinFly 1.3s cubic-bezier(0.25, 1, 0.5, 1) both;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes expExp {
  0% {
    transform: translate(0, 0) scale(0.3);
  }
  20% {
    transform: translate(0, -30px) scale(1.2);
  }
  25% {
    transform: translate(0px, -70px) scale(1.2);
  }
  100% {
    transform: translate(0px, -450px) scale(0.3);

  }
}

.animate-expFly {
  animation: expExp 1.2s cubic-bezier(0.25, 1, 0.5, 1) both;
  will-change: transform, opacity;
  pointer-events: none;
}
</style>