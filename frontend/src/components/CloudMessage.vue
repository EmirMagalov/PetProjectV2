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
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-30">
  <div
      v-show="cloudShow && !gameData.sleep "
      class="inset-0 flex items-center  animate-thought-cloud justify-center pointer-events-none overflow-visible z-50 pointer-events-auto">
    <!-- Облако -->
    <img :src="`/gamePlay/cloud_message.webp?v=${APP_VERSION}`" class="relative opacity-60" width="85%" alt="">
<!--    <div-->
<!--        v-show="gameData.addictionLevel ===1"-->
<!--         :class="['absolute flex justify-center items-center top-10 left-44 w-10']">-->
<!--      <img src="/other/pipe.webp" alt="">-->
<!--    </div>-->
    <!-- Hunger -->
    <div v-show="showHunger "
         :class="['absolute flex justify-center items-center', activeItems <= 1 ? 'top-12 left-51 w-10' : 'top-13 left-47 w-8']">
      <img :src="`/food/burger.webp?v=${APP_VERSION}`" alt="">
    </div>

    <!-- Energy -->
    <div v-show="energyFull || lowEnergy"
         :class="['absolute flex justify-center items-center gap-1', activeItems <= 1 ? 'top-11 left-50 w-12' : 'top-13 left-56 w-8']">
      <img :src="energyFull?`/gamePlay/energy_full.webp?v=${APP_VERSION}`:(lowEnergy?'/gamePlay/energy_low.webp':'')"  alt="">
<!--      <p class="font-bold text-md text-[#47B949]">{{ gameData.energy }}%</p>-->
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