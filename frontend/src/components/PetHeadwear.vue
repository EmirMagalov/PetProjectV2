<script setup>


import {currentHeadItem} from "@/scripts/basket.js";
import {gameData} from "@/scripts/useGameStore.js";
</script>

<template>
  <div class="absolute inset-x-0 flex justify-center items-center pointer-events-none -translate-y-1 z-15"
       >

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