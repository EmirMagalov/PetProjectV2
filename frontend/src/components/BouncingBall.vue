<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useBallPhysics } from '@/scripts/ballPhysics.js';
import { APP_VERSION } from '@/scripts/imageVersion.js';
import {gameData} from "@/scripts/useGameStore.js";

const ballEl = ref(null);
const containerEl = ref(null);

const props = defineProps({
  onBallMove: Function
});

// Выносим обработчик в отдельную функцию, чтобы избежать ошибок скоупа
const handleUpdate = (x, y, isMoving) => {
  if (props.onBallMove) {
    props.onBallMove(x, y, isMoving);
  }
};

const { setupInitial, stop, kickBall } = useBallPhysics(ballEl, containerEl, {
  size: 28, // размер мяча w-7 h-7 (28px)
  gravity: 0.45,
  bounce: 0.88,
  friction: 0.998,
  startX: 20,
  startY: 230,
  floorY: 265,
  onUpdate: handleUpdate // передаем функцию напрямую
});

onMounted(() => {
  containerEl.value = ballEl.value.closest('.w-\\[300px\\]');
  setupInitial();
});

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div
      ref="ballEl"
      v-show="gameData.level>1"
      @click="kickBall"
      style="touch-action: none; will-change: transform;"
      class="absolute top-0 left-0 z-50 w-7 h-7 cursor-grab active:cursor-grabbing select-none pointer-events-auto"
  >
    <img
        :src="`/balls/tennis_ball.webp?v=${APP_VERSION}`"
        alt="Ball"
        class="w-full h-full object-contain pointer-events-none drop-shadow-md"
    />
  </div>
</template>