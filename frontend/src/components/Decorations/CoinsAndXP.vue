<script setup>
import {activeStatus, gameData, tutorialStep} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {activeCoins, activeExp} from "@/scripts/actions.js";
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden"  :class="tutorialStep === 3 ? 'z-205' : ' z-50'">
    <template v-for="group in activeCoins" :key="group.id">
      <img
          v-for="coin in group.coins"
          :key="coin.id"
          :style="{
                      left: `${coin.x}px`,
                      top: `${coin.y}px`,
                      animationDelay: `${coin.delay}s`
                    }"
          :src="`/gamePlay/coin.webp?v=${APP_VERSION}`"
          class="absolute w-5 animate-coinFly pointer-events-none"
          alt=""
      />
    </template>
  </div>
  <div class="absolute inset-0 pointer-events-none overflow-hidden" :class="tutorialStep === 3 ? 'z-205' : ' z-50'">
    <template v-for="group in activeExp" :key="group.id">
      <img
          v-for="exp in group.exp"
          :key="exp.id"
          :style="{
                      left: `${exp.x}px`,
                      top: `${exp.y}px`,
                      animationDelay: `${exp.delay}s`
                    }"
          :src="`/gamePlay/exp.webp?v=${APP_VERSION}`"
          class="absolute w-5 animate-expFly pointer-events-none"
          alt=""
      />
    </template>
  </div>
</template>

<style scoped>
@keyframes coinFly {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
    transform: translate(0, -30px) scale(1.2);
  }
  25% {
    opacity: 1;
    transform: translate(0px, -70px) scale(1.2);
  }
  100% {
    transform: translate(0px, -250px) scale(0.3);
    opacity: 0;
  }
}

.animate-coinFly {
  animation: coinFly 0.7s cubic-bezier(0.25, 1, 0.5, 1) both;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes coinExp {
  0% {
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
    transform: translate(0, -30px) scale(1.2);
  }
  25% {
    opacity: 1;
    transform: translate(0px, -70px) scale(1.2);
  }
  100% {
    transform: translate(0px, -250px) scale(0.3);
    opacity: 0;
  }
}

.animate-expFly {
  animation: coinExp 0.7s cubic-bezier(0.25, 1, 0.5, 1) both;
  will-change: transform, opacity;
  pointer-events: none;
}
</style>