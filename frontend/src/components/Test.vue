<script setup>
import { useDraggable } from '@vueuse/core'
import { ref } from 'vue'

const el = ref()

const { style } = useDraggable(el, {
  storageKey: 'vueuse-draggable',
  storageType: 'session',
  preventDefault: true,
  // pointerTypes: ['mouse', 'touch', 'pen'] // можно явно добавить
})
</script>

<template>
  <div
      ref="el"
      :style="style"
      class="fixed "
      style="touch-action: none;"
  >
  ауауа
  </div>
</template>