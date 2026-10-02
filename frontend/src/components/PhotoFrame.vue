<script setup>
import { ref, nextTick, watch } from 'vue'
import { gameData } from "@/scripts/useGameStore.js";
// Импортируем состояние и функцию из actions.js
import { isEditing, finishEditing } from "@/scripts/actions.js";

const inputRef = ref(null)

function startEditing() {
  isEditing.value = true
}

// Следим за переключением isEditing, чтобы ставить фокус
watch(isEditing, async (newVal) => {
  if (newVal) {
    await nextTick()
    inputRef.value?.focus()
  }
})
</script>

<template>
  <div class="absolute w-19 top-3 right-0">
    <div class="relative">
      <img src="/gamePlay/photo_frame.webp?v=1" alt="" class="w-full h-auto">

      <!-- Отображение имени -->
      <div
          v-if="!isEditing"
          @click="startEditing"
          class="absolute  inset-0 w-full min-w-0 flex font-bold items-center justify-center text-center px-1 text-[10px] leading-tight break-all cursor-pointer select-none"
      >
        {{ gameData.name }}
      </div>

      <!-- Редактирование -->
      <div v-else class="absolute inset-0 flex items-center justify-center px-1">
        <input
            ref="inputRef"
            v-model="gameData.name"
            type="text"
            maxlength="15"
            @blur="finishEditing"
            @keydown.enter="finishEditing"
            @pointerdown.stop
            class="w-full bg-transparent text-center font-bold text-[10px] text-black outline-none"
        />
      </div>
    </div>
  </div>
</template>