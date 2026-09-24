<script setup>


import {currentHeadItem} from "@/scripts/basket.js";
import {gameData} from "@/scripts/useGameStore.js";
</script>

<template>
  <div class="absolute inset-x-0 flex justify-center items-center pointer-events-none z-10"
       :class="{
       '-translate-y-1': gameData.level < 10,
       '-translate-y-5': gameData.level >= 10 && gameData.level < 15,
       '-translate-y-8  -translate-x-7 rotate-20': gameData.level >= 15 && gameData.level < 20,
       '-translate-y-10  -translate-x-7 rotate-25': gameData.level >= 20 && gameData.level < 25,
       '-translate-y-11  -translate-x-7 rotate-25': gameData.level >= 25 && gameData.level < 30,
       '-translate-y-13  -translate-x-7 rotate-25': gameData.level >= 30  && gameData.level < 35,
       '-translate-y-15  -translate-x-7 rotate-25': gameData.level >= 35  && gameData.level < 40,
       '-translate-y-22': gameData.level >= 40
     }">

  <img
      v-if="currentHeadItem"
      :src="currentHeadItem.image"
      alt="Шапка"
      class="absolute  w-21 object-contain drop-shadow-md pointer-events-none z-10"
  >

  </div>
</template>

<style scoped>

</style>