<script setup>
import AnimatedTail from "@/components/AnimatedTail.vue";
import {gameData, lifeStage} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";

const frames_0 = [
  `/tails/0-phase-tail-1.webp?v=${APP_VERSION}`,
  `/tails/0-phase-tail-2.webp?v=${APP_VERSION}`,
  `/tails/0-phase-tail-3.webp?v=${APP_VERSION}`,
  `/tails/0-phase-tail-4.webp?v=${APP_VERSION}`,
  `/tails/0-phase-tail-5.webp?v=${APP_VERSION}`,
]
const frames_1 = [
  `/tails/1-phase-tail-1.webp?v=${APP_VERSION}`,
  `/tails/1-phase-tail-2.webp?v=${APP_VERSION}`,
  `/tails/1-phase-tail-3.webp?v=${APP_VERSION}`,
  `/tails/1-phase-tail-4.webp?v=${APP_VERSION}`,
  `/tails/1-phase-tail-5.webp?v=${APP_VERSION}`,
]
const frames_2 = [
  `/tails/2-phase-tail-1.webp?v=${APP_VERSION}`,
  `/tails/2-phase-tail-2.webp?v=${APP_VERSION}`,
  `/tails/2-phase-tail-3.webp?v=${APP_VERSION}`,
  `/tails/2-phase-tail-4.webp?v=${APP_VERSION}`,
  `/tails/2-phase-tail-5.webp?v=${APP_VERSION}`,
]
</script>

<template>
  <div class="relative flex items-center justify-center" v-if="gameData.level >= 45">
    <AnimatedTail :current-frames="frames_2" class="absolute mb-12 mr-25" />
    <AnimatedTail :current-frames="frames_2" class="absolute mb-15 mr-5" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute mb-15 ml-5"  />
    <AnimatedTail :current-frames="frames_2" class="absolute mb-10 mr-18" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute mb-10 ml-18"  />
    <AnimatedTail :current-frames="frames_2" class="absolute mb-3 mr-5" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute mb-3 ml-5" />
    <AnimatedTail :current-frames="frames_2" class="absolute" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute" />
  </div>
  <div class="relative flex items-center justify-center" v-else-if="gameData.level >= 40">
    <AnimatedTail :current-frames="frames_2" class="absolute mb-15 mr-5" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute mb-15 ml-5"  />
    <AnimatedTail :current-frames="frames_2" class="absolute mb-3 mr-5" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute mb-3 ml-5" />
    <AnimatedTail :current-frames="frames_2" class="absolute" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute" />
  </div>
  <div class="relative flex items-center justify-center" v-else-if="gameData.level >= 35">
    <AnimatedTail :current-frames="frames_1" class="absolute mb-15 mr-5" />
    <AnimatedTail :current-frames="frames_1" style="transform: scaleX(-1);" class="absolute mb-15 ml-5"  />
    <AnimatedTail :current-frames="frames_2" class="absolute mb-3 mr-5" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute mb-3 ml-5" />
    <AnimatedTail :current-frames="frames_2" class="absolute" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute" />
  </div>
  <div class="relative flex items-center justify-center" v-else-if="gameData.level >= 30">
    <AnimatedTail :current-frames="frames_2" class="absolute mb-3 mr-5" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute mb-3 ml-5" />
    <AnimatedTail :current-frames="frames_2" class="absolute" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute" />
  </div>
  <div class="relative flex items-center justify-center" v-else-if="gameData.level >= 25">
    <AnimatedTail :current-frames="frames_1" class="absolute" />
    <AnimatedTail :current-frames="frames_1" style="transform: scaleX(-1);" class="absolute" />
    <AnimatedTail :current-frames="frames_2" class="absolute" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute" />
  </div>
  <div class="relative flex items-center justify-center" v-else-if="gameData.level >= 20">
    <AnimatedTail :current-frames="frames_1" class="absolute" />
    <AnimatedTail :current-frames="frames_2" class="absolute" />
    <AnimatedTail :current-frames="frames_2" style="transform: scaleX(-1);" class="absolute" />

  </div>

  <div class="relative flex items-center justify-center" v-else-if="gameData.level >= 15">
    <AnimatedTail :current-frames="frames_1" style="transform: scaleX(-1);" class="absolute" />
    <AnimatedTail :current-frames="frames_1" class="absolute" />
  </div>

  <div v-else-if="lifeStage === 'adult'">
    <AnimatedTail :current-frames="frames_1" />
  </div>

  <!-- Для всех остальных уровней (ниже 10) -->
  <div v-else>
    <AnimatedTail :current-frames="frames_0" />
  </div>
</template>

<style scoped>
/* Сохраняем исходный размер картинок без сжатия */

</style>