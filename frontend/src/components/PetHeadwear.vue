<script setup>


import {currentHeadItem} from "@/scripts/basket.js";
import {gameData} from "@/scripts/useGameStore.js";
</script>

<template>
  <div class="absolute inset-x-0 flex justify-center items-center pointer-events-none z-10"
       :class="{
       '-translate-y-1': gameData.level < 10,
       '-translate-y-4': gameData.level >= 10 && gameData.level < 15,
       '-translate-y-7': gameData.level >= 15 && gameData.level < 20,
       '-translate-y-9': gameData.level >= 20
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