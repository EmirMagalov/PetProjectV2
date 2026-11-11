<script setup>
import { ref, onMounted, watch } from 'vue';
import { initIngredientInteract } from "@/scripts/laboratoryScripts/dragAndDrop.js";

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
    <!-- Перетаскиваемый элемент (остается в потоке, движется через GPU transform) -->
    <div
        ref="ingredientEl"
        style="touch-action: none; will-change: transform;"
        class="cursor-grab active:cursor-grabbing"
    >
      <img
          :src="item.image"
          :alt="item.name"
          class="w-16 h-16 object-contain pointer-events-none drop-shadow-md"
      />
    </div>
  </div>
</template>