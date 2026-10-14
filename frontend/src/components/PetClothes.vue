<script setup>
import { currentClothesItem } from "@/scripts/basket.js";
import { computed } from "vue";
import {bodyType, gameData} from "@/scripts/useGameStore.js";

const clothes = computed(() => {
  // 1. Проверяем, надет ли костюм
  if (!currentClothesItem.value) return null;

  // 2. Используем bodyType.value для получения текущего значения ref
  const type = bodyType.value;

  if (type === "fat") return currentClothesItem.value.image_fat;
  if (type === "skinny") return currentClothesItem.value.image_skinny;

  // По умолчанию возвращаем обычный вид
  return currentClothesItem.value.image_normal;
})

</script>

<template>
  <div>
    <img
        v-if="currentClothesItem && clothes"
        :src="clothes"
        alt="Костюм"
        class="object-contain drop-shadow-md pointer-events-none absolute  top-0 left-0 z-10"
    >
  </div>
</template>

<style scoped>
</style>