<script setup>
import {gameData} from "@/scripts/useGameStore.js";
import ProgressBar from "@/components/ProgressBar.vue";
import {expPercentage} from "@/scripts/level.js";
</script>

<template>
  <div class="p-2">
    <div class="relative shadow-2xl rounded-2xl bg-white/20 backdrop-blur-md ">
      <div class="flex justify-center  items-center gap-2 p-2">
        <div class="flex flex-col gap-1">
          <!--        <ProgressBar image="/gamePlay/heart.svg" name="Здоровье" :value="gameData.health" color="#FF0000"/>-->
          <ProgressBar image="/gamePlay/hunger.webp" name="Сытость" :value="gameData.foodLevel" color="#FFF700"/>
          <ProgressBar image="/gamePlay/energy.webp" name="Энергия" :value="gameData.energy" color="#44B846"/>

        </div>

        <div class="grid grid-cols-2 gap-1 left-0.5 top-10 ">

          <!-- Уровень с заполняющимся фоном опыта -->
          <div
              class="relative overflow-hidden flex items-center justify-center gap-1 shadow-md bg-white/10 backdrop-blur-md px-1 w-15 max-w-15 py-1 rounded-xl border border-white/10">

            <!-- Шкала опыта (заполняет фон слева направо) -->
            <div
                class="absolute left-0 top-0 bottom-0 bg-[#b0d9de]/80 transition-all duration-500 pointer-events-none z-0"
                :style="{ width: expPercentage + '%' }"
            ></div>

            <!-- Текст уровня (поверх заливки) -->
            <span class="text-xs font-semibold text-gray-700 relative z-10">Ур.</span>
            <span class="text-lg font-bold text-gray-900 relative z-10">{{ gameData.level }}</span>
          </div>

          <!-- Монетки -->
          <div
              class="flex relative items-center gap-1.5 shadow-md bg-white/10 backdrop-blur-md px-1 w-15 max-w-15 py-1 rounded-xl border border-white/10">
            <img src="/gamePlay/coin.svg" alt="Монеты" width="24" class="shrink-0">
            <span class="absolute left-3 text-sm font-bold text-gray-900 text-shadow-xs text-shadow-amber-50">
            {{ gameData.coins }}
          </span>
          </div>

        </div>

      </div>

      <div class="flex justify-center items-center gap-2  w-full">

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
      <div v-show="gameData.addictionStreak >=2" class="absolute bottom-0 right-0">
        <img src="/gamePlay/drunk.webp" alt=""  width="30">
      </div>
    </div>


  </div>
</template>

<style scoped>

</style>