<script setup>
import { foamOffset } from "@/scripts/useGameStore.js";
import {foamBubbles, isHovered} from "@/scripts/dragAndDrop.js";

defineProps({
  statusFoam: Boolean,
  bgColor: {
    default: "bg-white/70",
    type: String,
  },
})

function getBubbleScale(bubble) {
  if (foamOffset.value <= 0 || bubble.y <= 0) {
    return 1
  }
  // Чем ниже пузырь (больше bubble.y), тем сильнее он сжимается при смыве
  const depthFactor = Math.min(1.4, 0.7 + bubble.y / 60)
  const washRatio = Math.min(1, foamOffset.value / 60)
  return Math.max(0.35, 1 - washRatio * 0.65 * depthFactor)
}

function getBubbleOpacity(bubble) {
  // Верхние и центральные пузыри не теряют прозрачность
  if (foamOffset.value <= 0 || bubble.y <= 0) {
    return 1
  }
  const depthFactor = Math.min(1.3, 0.5 + bubble.y / 50)
  const washRatio = Math.min(1, foamOffset.value / 60)
  // Нижний порог прозрачности: 0.15, чтобы пузырь плавно растворялся, а не пропадал рывком
  return Math.max(0.15, 1 - washRatio * 0.85 * depthFactor)
}
</script>

<template>
  <div
      v-if="statusFoam || foamBubbles.length > 0"
      class="absolute mt-20 inset-0 flex justify-center items-center pointer-events-none z-15"
      style="will-change: transform;"
  >
    <div
        class="relative w-10 h-10 flex items-center justify-center transition-transform duration-75 ease-out"
        :style="{
          transform: `translateY(${foamOffset}px)`
        }"
    >
      <div
          v-for="bubble in foamBubbles"
          :key="bubble.id"
          :class="[bubble.color || bgColor, !isHovered ? 'animate-bounce' : '']"
          class="absolute rounded-full bubble-glossy transition-opacity duration-75 ease-out"
          :style="{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `calc(50% + ${bubble.x}px)`,
            top: `calc(50% + ${bubble.y}px)`,
            marginLeft: `${-bubble.size / 2}px`,
            marginTop: `${-bubble.size / 2}px`,
            opacity: getBubbleOpacity(bubble),
            '--bubble-scale': getBubbleScale(bubble),
            transform: foamOffset > 0 ? `scale(${getBubbleScale(bubble)})` : undefined
          }"
      ></div>
    </div>
  </div>
</template>

<style scoped>

@keyframes bounce {
  0%, 100% {
    transform: translateY(-3%) scale(var(--bubble-scale, 1));
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0) scale(var(--bubble-scale, 1));
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.animate-bounce {
  animation: bounce 2s infinite;
}


@keyframes bubblePop {
  0% {
    scale: 0.2;
    opacity: 0;
  }
  100% {
    scale: 1;
    opacity: 1;
  }
}

.bubble-pop {
  animation: bubblePop 0.16s ease-out forwards;
}

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