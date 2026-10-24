<script setup>
import { computed } from 'vue';
import {isBadMood, gameData} from "@/scripts/useGameStore.js";

// Проверяем, зима ли сейчас
const isWinter = computed(() => gameData.season === 'winter');

// Предрассчитываем капли дождя
const raindrops = Array.from({ length: 25 }, () => ({
  left: `${Math.random() * 100}%`,
  animationDuration: `${0.5 + Math.random() * 0.4}s`,
  animationDelay: `${Math.random() * 2}s`,
  opacity: 0.4 + Math.random() * 0.4
}));

// ❄️ Предрассчитываем снежинки (они крупнее, падают медленнее и плавно качаются)
const snowflakes = Array.from({ length: 30 }, () => ({
  left: `${Math.random() * 100}%`,
  size: `${3 + Math.random() * 4}px`, // Размер снежинки от 3px до 7px
  animationDuration: `${3 + Math.random() * 4}s`, // Падают медленно (3-7 секунд)
  animationDelay: `${Math.random() * 5}s`,
  opacity: 0.6 + Math.random() * 0.4
}));
</script>

<template>
  <Transition name="weather-fade">
    <div v-show="isBadMood" class="absolute inset-0 pointer-events-none z-0 overflow-hidden">

      <!-- 🌧️ ДОЖДЬ И МОЛНИИ (если НЕ зима) -->
      <div v-if="!isWinter">
        <div class="lightning-flash"></div>
        <div class="weather-container">
          <div
              v-for="(rain, index) in raindrops"
              :key="'rain-' + index"
              class="raindrop"
              :style="rain"
          ></div>
        </div>
      </div>

      <!-- ❄️ СНЕГ (если ЗИМА) -->
      <div v-else class="weather-container">
        <div
            v-for="(flake, index) in snowflakes"
            :key="'snow-' + index"
            class="snowflake"
            :style="{
              left: flake.left,
              width: flake.size,
              height: flake.size,
              animationDuration: flake.animationDuration,
              animationDelay: flake.animationDelay,
              opacity: flake.opacity
            }"
        ></div>
      </div>

    </div>
  </Transition>
</template>

<style scoped>
.weather-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ❄️ Стили снежинок */
.snowflake {
  position: absolute;
  top: -10px;
  background: #ffffff;
  border-radius: 50%;
  filter: blur(0.6px); /* Делает снежок мягким и пушистым */
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
  animation: fallSnow linear infinite;
  will-change: transform;
}

/* Анимация падения снега с покачиванием */
@keyframes fallSnow {
  0% {
    transform: translateY(-10px) translateX(0);
  }
  50% {
    transform: translateY(150px) translateX(12px);
  }
  100% {
    transform: translateY(300px) translateX(-12px);
  }
}

/* 🌧️ Стили дождя */
.raindrop {
  position: absolute;
  top: -20px;
  width: 1.5px;
  height: 15px;
  background: linear-gradient(to bottom, transparent, rgba(174, 214, 241, 0.8));
  animation: fallRain linear infinite;
  will-change: transform;
}

@keyframes fallRain {
  0% { transform: translateY(0) rotate(10deg); }
  100% { transform: translateY(300px) rotate(10deg); }
}

/* ⚡ Молнии */
.lightning-flash {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 204, 0.85);
  opacity: 0;
  animation: lightning 7s ease-out infinite;
  animation-delay: 2s;
  will-change: opacity;
}

@keyframes lightning {
  0%, 91%, 100% { opacity: 0; }
  92% { opacity: 0.6; }
  93% { opacity: 0.1; }
  94% { opacity: 0.9; }
  96% { opacity: 0; }
}

/* Плавное появление погоды */
.weather-fade-enter-active,
.weather-fade-leave-active {
  transition: opacity 1s ease;
}

.weather-fade-enter-from,
.weather-fade-leave-to {
  opacity: 0;
}
</style>