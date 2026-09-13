<script setup>


import {currentHeadItem} from "@/scripts/basket.js";
</script>

<template>
  <div class="absolute top-0 inset-0 flex justify-center items-center pointer-events-none z-10">

  <img
      v-if="currentHeadItem"
      :src="currentHeadItem.image"
      alt="Шапка"
      class="absolute  w-15 object-contain drop-shadow-md pointer-events-none z-10"
  >

  </div>
</template>

<style scoped>

</style>