<script setup>
import { ref } from 'vue';
import { useDraggable } from '@vueuse/core';
import { ingredientMove, ingredientEnd, activeIngredient } from "@/scripts/laboratoryScripts/dragAndDrop.js";
import { laboratoryIngredientsList } from "@/scripts/basket.js";

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const el = ref();

// Проверяем, можем ли мы вытащить еще один такой предмет на стол
const canDragMore = () => {
  const purchased = laboratoryIngredientsList.value.find(i => i.id === props.item.id);
  const ownedCount = purchased ? purchased.count : 0;

  const onTable = activeIngredient.value.find(i => i.id === props.item.id);
  const tableCount = onTable ? onTable.count : 0;

  // Разрешаем тянуть, если на столе меньше, чем куплено
  return tableCount < ownedCount;
};

// Инициализируем draggable
const serumDrag = useDraggable(el, {
  onStart: () => {
    if (!canDragMore()) return;
    const rect = el.value.getBoundingClientRect();
    serumDrag.x.value = rect.left;
    serumDrag.y.value = rect.top;
  },
  onMove: (pos, event) => {
    if (!canDragMore()) return;
    ingredientMove(event, props.item);
  },
  onEnd: () => {
    if (!canDragMore()) return;
    ingredientEnd(props.item);
  }
});
</script>

<template>
  <div class="relative flex flex-col items-center justify-center select-none w-full">
    <!-- Статический призрак-подложка всегда видна в меню -->
    <img
        v-show="serumDrag.isDragging.value || !canDragMore()"
        :src="item.image"
        :alt="item.name"
        class="w-16 h-16 object-contain opacity-30 drop-shadow-md mb-2"
    />

    <!-- Перетаскиваемый элемент -->
    <div
        v-show="canDragMore()"
        ref="el"
        :style="[
          serumDrag.isDragging.value ? serumDrag.style.value : {},
          { 'touch-action': 'none' }
        ]"
        :class="[
          serumDrag.isDragging.value ? 'fixed z-150 pointer-events-none' : '',
          !canDragMore() ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        ]"
    >
      <img
          :src="item.image"
          :alt="item.name"
          class="w-16 h-16 object-contain pointer-events-none drop-shadow-md"
      />
    </div>
  </div>
</template>