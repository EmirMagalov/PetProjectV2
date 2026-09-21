<script setup>
import {cloudShow, energyFull, showHunger, gameData, lowEnergy} from "@/scripts/useGameStore.js";
import {computed} from "vue";

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
  <div
      v-show="cloudShow && !gameData.sleep "
      class="inset-0 flex items-center  animate-thought-cloud justify-center pointer-events-none overflow-visible z-50">
    <!-- Облако -->
    <img src="/gamePlay/cloud.webp" class="relative opacity-60" width="85%" alt="">
<!--    <div-->
<!--        v-show="gameData.addictionLevel ===1"-->
<!--         :class="['absolute flex justify-center items-center top-10 left-44 w-10']">-->
<!--      <img src="/other/pipe.webp" alt="">-->
<!--    </div>-->
    <!-- Hunger -->
    <div v-show="gameData.addictionLevel !==1 && showHunger "
         :class="['absolute flex justify-center items-center', activeItems <= 1 ? 'top-10 left-44 w-10' : 'top-12 left-40 w-6']">
      <img src="/food/burger.webp" alt="">
    </div>

    <!-- Energy -->
    <div v-show="gameData.addictionLevel !==1 && (energyFull || lowEnergy)"
         :class="['absolute flex justify-center items-center gap-1', activeItems <= 1 ? 'top-9 left-43 w-12' : 'top-11 left-48 w-8']">
      <img :src="energyFull?'/gamePlay/energy_full.webp':(lowEnergy?'/gamePlay/energy_low.webp':'')"  alt="">
<!--      <p class="font-bold text-md text-[#47B949]">{{ gameData.energy }}%</p>-->
    </div>
  </div>
</template>

<style scoped>
</style>