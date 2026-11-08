<script setup>
import {cloudShow, energyFull, showHunger, gameData, lowEnergy} from "@/scripts/useGameStore.js";
import {computed} from "vue";
import {APP_VERSION} from "@/scripts/imageVersion.js";

const activeItems = computed(() => {
  let items = 0 // <--- ИСПРАВЛЕНИЕ: let вместо const
  if (showHunger.value) {
    items += 1
  }
  if (energyFull.value || lowEnergy.value) {
    items += 1
  }
  return items
})
</script>

<template>
  <!-- Внешний позиционирующий контейнер (оставляем как у тебя, но убираем мусор) -->
  <div class="absolute -right-20 -top-40 inset-0 flex items-center justify-center pointer-events-none overflow-visible z-30">

    <div
        v-show="cloudShow && !gameData.sleep"
        class="relative flex items-center justify-center animate-thought-cloud z-50 pointer-events-auto"
    >
      <!-- Само облако (базовый размер контейнера) -->
      <img :src="`/gamePlay/cloud_message.webp?v=${APP_VERSION}`" class="relative opacity-60 w-45 block" alt="cloud">

      <!-- Контейнер для иконки внутри облака (строго по центру облака) -->
      <div class="absolute  inset-0 flex gap-2 items-center justify-center">

        <!-- Hunger (Бургер) -->
        <div v-show="showHunger" class="flex items-center justify-center w-10">
          <img :src="`/food/burger.webp?v=${APP_VERSION}`" class="w-full object-contain" alt="hunger">
        </div>

        <!-- Energy (Энергия) -->
        <div v-show="energyFull || lowEnergy" class="flex items-center justify-center gap-1 w-12">
          <img
              :src="energyFull ? `/gamePlay/energy_full.webp?v=${APP_VERSION}` : (lowEnergy ? `/gamePlay/energy_low.webp?v=${APP_VERSION}` : '')"
              class="w-full object-contain"
              alt="energy"
          >
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes thoughtCloudAppearAndFloat {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(10px);
  }
  70% {
    transform: scale(1.05) translateY(-2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes cloudFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.02);
  }
}

.animate-thought-cloud {
  animation: thoughtCloudAppearAndFloat 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
  cloudFloat 3s ease-in-out 0.4s infinite;
  transform-origin: center bottom;
}

</style>