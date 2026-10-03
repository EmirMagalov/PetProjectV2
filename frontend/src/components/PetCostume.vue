<script setup>
import { currentCostumeItem } from "@/scripts/basket.js";
import { computed } from "vue";
import {bodyType, gameData} from "@/scripts/useGameStore.js";

const costume = computed(() => {
  // 1. Проверяем, надет ли костюм
  if (!currentCostumeItem.value) return null;

  // 2. Используем bodyType.value для получения текущего значения ref
  const type = bodyType.value;

  if (type === "fat") return currentCostumeItem.value.image_fat;
  if (type === "skinny") return currentCostumeItem.value.image_skinny;

  // По умолчанию возвращаем обычный вид
  return currentCostumeItem.value.image_normal;
})

</script>

<template>
  <div>
    <img
        v-if="currentCostumeItem && costume"
        :src="costume"
        alt="Костюм"
        class="object-contain drop-shadow-md pointer-events-none absolute  top-0 left-0 z-10"
    >
  </div>
</template>

<style scoped>
</style>