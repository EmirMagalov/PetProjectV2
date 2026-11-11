<script setup>
import { ref } from 'vue';
import { useItemDraggable } from "@/scripts/laboratoryScripts/dragAndDrop.js";

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const el = ref(null);
const { isDragging, style, canDragMore } = useItemDraggable(el, props.item);
</script>

<template>
  <div class="relative flex flex-col items-center justify-center select-none w-full">
    <!-- Статический призрак-подложка -->
    <img
        v-show="isDragging || !canDragMore()"
        :src="item.image"
        :alt="item.name"
        class="w-16 h-16 object-contain opacity-30 drop-shadow-md mb-2"
    />

    <!-- Перетаскиваемый элемент -->
    <div
        v-show="canDragMore()"
        ref="el"
        :style="[
          isDragging ? style : {},
          { 'touch-action': 'none' }
        ]"
        :class="[
          isDragging ? 'fixed z-150 pointer-events-none' : '',
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