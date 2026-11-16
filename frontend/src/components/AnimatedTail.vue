<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  currentFrames: {
    type: Array,
    default: () => [
      '/tails/0-phase-tail-1.webp',
      '/tails/0-phase-tail-2.webp',
      '/tails/0-phase-tail-3.webp',
      '/tails/0-phase-tail-4.webp',
      '/tails/0-phase-tail-5.webp',
    ]
  }
})

// 1. Инициализируем случайным кадром, чтобы они сразу шли вразнобой
const currentFrameIndex = ref(0)
let intervalId = null

watch(() => props.currentFrames, (newFrames) => {
  if (newFrames && newFrames.length > 0) {
    currentFrameIndex.value = Math.floor(Math.random() * newFrames.length)
  }
})

onMounted(() => {
  // 2. Выбираем случайный стартовый кадр при появлении на экране
  if (props.currentFrames && props.currentFrames.length > 0) {
    currentFrameIndex.value = Math.floor(Math.random() * props.currentFrames.length)
  }

  intervalId = setInterval(() => {
    currentFrameIndex.value = (currentFrameIndex.value + 1) % props.currentFrames.length
  }, 135)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div class="tail-container">
    <img :src="props.currentFrames[currentFrameIndex]" alt="Snake Tail" class="tail-img" />
  </div>
</template>

<style scoped>
.tail-container {
  width: 160px;
  height: 160px;
}
.tail-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>