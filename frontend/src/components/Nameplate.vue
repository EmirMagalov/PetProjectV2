<script setup>
import { ref, nextTick, watch } from 'vue'
import {gameData, isTutorialCompleted, tutorialStep} from "@/scripts/useGameStore.js";
import { isEditing, finishEditing } from "@/scripts/actions.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {location} from "@/scripts/useGameStore.js";
const inputRef = ref(null)
let openedAt = 0
function startEditing() {
  if (gameData.name === 'store.pet_name_placeholder') {
    gameData.name = ''
  }
  isEditing.value = true
}

// 1. Принудительно обрезаем имя до 15 символов при любых изменениях (вставка, T9, быстрый ввод)
watch(() => gameData.name, (newVal) => {
  if (gameData.name!=='store.pet_name_placeholder' && newVal && newVal.length > 15) {
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

function handleBlur() {
  if (Date.now() - openedAt < 120) {
    inputRef.value?.focus()
    return
  }
  finishEditing()
}
</script>

<template>
  <div
      class="absolute inset-0 z-0 pointer-events-auto "

      v-show="(location === 'home' || location === 'food' || location==='bedroom')"
  >
    <div class="absolute left-6 top-19 pointer-events-auto">
      <div class="relative w-13">
        <img :src="`/gamePlay/nameplate_icons.webp?v=${APP_VERSION}`" alt="" class="h-auto">

        <!-- Отображение имени -->
        <div v-show="gameData.level>1">
          <div
              v-if="!isEditing"
              data-nameplate-trigger
              @click="startEditing"
              class="absolute scale-75  inset-0 text-white text-shadow-2xs shirk text-shadow-black w-full min-w-0 flex font-bold items-start justify-center text-[5px] leading-tight break-all cursor-pointer select-none"
          >
            {{ $t(gameData.name) }}
          </div>

          <!-- Редактирование -->
          <div v-else class="absolute inset-0 w-full min-w-0 flex font-bold items-start justify-center ">
            <input
                ref="inputRef"
                v-model="gameData.name"
                type="text"
                maxlength="15"
                @blur="handleBlur"
                @keydown.enter="finishEditing"
                @pointerdown.stop
                @click.stop
                class="w-full bg-transparent text-center font-bold text-[10px] text-white text-shadow-2xs text-shadow-red-500 outline-none"
            />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>