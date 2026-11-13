<script setup>
import { ref, onMounted, watch } from 'vue';
import {
  getAvailableIngredientCount,
  initIngredientInteract,
  isDraggingLaboratory
} from "@/scripts/laboratoryScripts/dragAndDrop.js";

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const ingredientEl = ref(null);

onMounted(() => {
  if (ingredientEl.value) {
    initIngredientInteract(ingredientEl.value, props.item);
  }
});

watch(ingredientEl, (newEl) => {
  if (newEl) {
    initIngredientInteract(newEl, props.item);
  }
});
</script>

<template>
  <div class="relative flex flex-col items-center justify-center select-none w-full">
    <!-- Контейнер строго по размеру картинки, чтобы координаты призрака и оригинала совпадали 1 в 1 -->
    <div class="relative w-16 h-16">
      <!-- 1. Призрак (лежит строго в 0,0 этого контейнера) -->
      <img
          :src="item.image"
          :alt="item.name"
          class="w-16 h-16 absolute inset-0 object-contain opacity-30 drop-shadow-md pointer-events-none"
      />

      <!-- 2. Перетаскиваемый элемент (лежит ровно поверх призрака, двигается через interact.js) -->
      <div
          ref="ingredientEl"
          v-show="getAvailableIngredientCount(item.id) > 0"
          style="touch-action: none; will-change: transform;"
          class="relative z-10 w-16 h-16 cursor-grab active:cursor-grabbing"
      >
        <img
            :src="item.image"
            :alt="item.name"
            class="w-16 h-16 object-contain pointer-events-none drop-shadow-md"
        />
      </div>
    </div>
  </div>
</template>