<script setup>
import { ref, nextTick, watch } from 'vue'
import { gameData } from "@/scripts/useGameStore.js";
import { isEditing, finishEditing } from "@/scripts/actions.js";

const inputRef = ref(null)

function startEditing() {
  isEditing.value = true
}

// 1. Принудительно обрезаем имя до 15 символов при любых изменениях (вставка, T9, быстрый ввод)
watch(() => gameData.name, (newVal) => {
  if (newVal && newVal.length > 15) {
    gameData.name = newVal.slice(0, 15)
  }
}, { immediate: true })

// 2. Фокус при включении редактирования
watch(isEditing, async (newVal) => {
  if (newVal) {
    await nextTick()
    inputRef.value?.focus()
  }
})
</script>

<template>
  <div class="absolute w-19 left-4 top-19 ">
    <div class="relative w-18">
      <img src="/gamePlay/nameplate_icons.webp?v=1" alt="" class="w-20 h-auto">

      <!-- Отображение имени -->
      <div
          v-if="!isEditing"
          @click="startEditing"
          class="absolute scale-80 py-1 px-2 inset-0 text-white text-shadow-2xs text-shadow-black w-full min-w-0 flex font-bold items-start justify-center text-[12px] leading-tight break-all cursor-pointer select-none"
      >
        {{ gameData.name }}
      </div>

      <!-- Редактирование -->
      <div v-else class="absolute inset-0 w-full min-w-0 flex font-bold items-start justify-center ">
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