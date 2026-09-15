<script setup>
import {gameData} from "@/scripts/useGameStore.js";
import ProgressBar from "@/components/ProgressBar.vue";
import {expPercentage} from "@/scripts/level.js";
import {animKey} from "@/scripts/actions.js";

function formatNumber(num) {
  if (num === undefined || num === null) return '0';

  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'; // Делим всё равно на 1_000!
  }
  return num.toString();
}
</script>

<template>
  <div class="p-2">
    <div class="relative shadow-2xl rounded-2xl bg-white/20 backdrop-blur-md ">
      <div class="flex justify-between gap-2 p-2">
        <div class="flex flex-col gap-1">
          <!--        <ProgressBar image="/gamePlay/heart.svg" name="Здоровье" :value="gameData.health" color="#FF0000"/>-->
          <ProgressBar image="/gamePlay/hunger.webp" name="Сытость" :value="gameData.foodLevel" color="#FFF700"/>
          <ProgressBar image="/gamePlay/energy.webp" name="Энергия" :value="gameData.energy" color="#44B846"/>

        </div>

        <div class="grid grid-cols-2 gap-1 left-0.5">

          <!-- Уровень с заполняющимся фоном опыта -->
          <div
              class="relative overflow-hidden flex items-center justify-center shadow-md bg-white/10 backdrop-blur-md  w-15 max-w-15 py-1 rounded-xl border border-white/10">

            <!-- Шкала опыта (заполняет фон слева направо) -->
            <div
                class="absolute left-0 top-0 bottom-0 bg-[#b0d9de]/80 transition-all duration-500 pointer-events-none z-0"
                :style="{ width: expPercentage + '%' }"
            ></div>

            <!-- Текст уровня (поверх заливки) -->
            <span class="text-xs font-semibold text-gray-700 relative z-10">Ур.</span>
            <span class="text-sm font-bold text-gray-900 relative z-10">{{ gameData.level }}</span>
          </div>

          <!-- Монетки -->
          <div
              :key="animKey"
              class="flex relative justify-center items-center  shadow-md bg-white/10 backdrop-blur-md whitespace-nowrap  w-15  py-1 rounded-xl border border-white/10 animate-pop">
            <img src="/gamePlay/coin.svg" alt="Монеты" width="15" class="shrink-0 ">
            <span class="text-sm font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
            {{ formatNumber(gameData.coins)}}
          </span>
          </div>
        <div
            :key="animKey"
            class="flex relative items-center  shadow-md bg-white/10 backdrop-blur-md w-15 max-w-15 py-1 rounded-xl border whitespace-nowrap border-white/10 animate-pop">
          <img src="/gamePlay/click_icon.webp" alt="Монеты" width="20" class="shrink-0">
          <span class="text-sm font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
          {{ formatNumber(gameData.clickCounter) }}
        </span>

        </div>

        </div>

      </div>

      <div class="absolute bottom-0 left-5 flex  items-center gap-2  w-full">

        <div class="flex justify-center items-center gap-1.5  pb-1 ">
          <img
              v-for="i in 3"
              :key="i"
              :src="i <= gameData.lives ? '/gamePlay/heart.svg' : '/gamePlay/heart_empty.svg'"
              alt="Жизнь"
              width="18"
          >
        </div>

      </div>
      <div v-show="gameData.isFat" class="absolute bottom-0 right-45 transition-transform duration-50 animate-pulse">
        <img src="/gamePlay/fat_icon.webp" alt="" width="25">
      </div>
      <div v-show="gameData.addictionStreak >=2" class="absolute  animate-pulse bottom-0 right-38" >
        <img src="/gamePlay/drunk_icon.webp" alt="" width="25">
      </div>

    </div>


  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.03) translateY(1px);
  }
}

.animate-pulse {
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes popCharacter {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-pop {
  animation: popCharacter 0.2s ease-out;
}

</style>