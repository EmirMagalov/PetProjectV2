<script setup>
import { isBadMood } from "@/scripts/useGameStore.js";

// Предрассчитываем стили капель один раз при загрузке или создании,
// чтобы они не дергались при каждом цикле отрисовки.
const raindrops = Array.from({ length: 25 }, () => ({
  left: `${Math.random() * 100}%`,
  animationDuration: `${0.5 + Math.random() * 0.4}s`,
  animationDelay: `${Math.random() * 2}s`,
  opacity: 0.4 + Math.random() * 0.4
}));
</script>

<template>
  <Transition name="rain-fade">
    <div v-show="isBadMood" class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <!-- Вспышка молнии -->
      <div class="lightning-flash"></div>

      <!-- Капли дождя -->
      <div class="rain-container">
        <div
            v-for="(rain, index) in raindrops"
            :key="index"
            class="raindrop"
            :style="rain"
        ></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Контейнер дождя на весь холст */
.rain-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Сама капля дождя */
.raindrop {
  position: absolute;
  top: -20px;
  width: 1.5px;
  height: 15px;
  background: linear-gradient(to bottom, transparent, rgba(174, 214, 241, 0.8));
  animation: fallRain linear infinite;
  will-change: transform;
}

/* Анимация падения сверху вниз */
@keyframes fallRain {
  0% {
    transform: translateY(0) rotate(10deg);
  }
  100% {
    transform: translateY(300px) rotate(10deg);
  }
}

/* Оверлей для вспышки молнии */
.lightning-flash {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 204, 0.85);
  opacity: 0;
  animation: lightning 7s ease-out infinite;
  animation-delay: 2s;
  will-change: opacity;
}

/* Эффект двойной вспышки молнии */
@keyframes lightning {
  0%, 91%, 100% {
    opacity: 0;
  }
  92% {
    opacity: 0.6;
  }
  93% {
    opacity: 0.1;
  }
  94% {
    opacity: 0.9;
  }
  96% {
    opacity: 0;
  }
}

/* Плавное появление и затухание всего блока дождя */
.rain-fade-enter-active,
.rain-fade-leave-active {
  transition: opacity 1s ease;
}

.rain-fade-enter-from,
.rain-fade-leave-to {
  opacity: 0;
}
</style>