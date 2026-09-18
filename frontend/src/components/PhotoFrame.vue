<script setup>
import { ref, nextTick } from 'vue'
import { gameData } from "@/scripts/useGameStore.js";

const isEditing = ref(false)
const inputRef = ref(null)

async function startEditing() {
  isEditing.value = true
  await nextTick()
  inputRef.value?.focus()
}

function finishEditing() {
  // Если стерли имя полностью и оставили пустым — возвращаем дефолт
  if (!gameData.name.trim()) {
    gameData.name = 'Имя:'
  }
  isEditing.value = false
}
</script>

<template>
  <div class="absolute w-19 top-0 right-0">
    <div class="relative">
      <img src="/gamePlay/photo_frame.webp" alt="" class="w-full h-auto">

      <!-- Отображение имени -->
      <div
          v-if="!isEditing"
          @click="startEditing"
          class="absolute inset-0 w-full min-w-0 flex font-bold items-center justify-center text-center px-1 text-[10px] leading-tight break-all cursor-pointer select-none"
      >
        {{ gameData.name }}
      </div>

      <!-- Редактирование: пишем СРАЗУ в gameData.name через v-model -->
      <div v-else class="absolute inset-0 flex items-center justify-center px-1">
        <input
            ref="inputRef"
            v-model="gameData.name"
            type="text"
            maxlength="15"
            @blur="finishEditing"
            @keydown.enter="finishEditing"
            class="w-full bg-transparent text-center font-bold text-[10px] text-black outline-none "
        />
      </div>
    </div>
  </div>
</template>