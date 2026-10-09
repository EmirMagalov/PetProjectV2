<script setup>
import { ref, onMounted } from 'vue'
import { gameData } from "@/scripts/useGameStore.js"
import { Clean } from "@/scripts/actions.js"
import { APP_VERSION } from "@/scripts/imageVersion.js"

const LOCAL_STORAGE_KEY = 'pet_poops_positions'

// Массив для хранения данных о каждой какашке
const poopsList = ref([])

// Функция загрузки или первичной генерации какашек
function initPoops() {
  const savedPoops = localStorage.getItem(LOCAL_STORAGE_KEY)

  // 1. Если какашки уже сохранены в localStorage — загружаем их
  if (savedPoops) {
    try {
      const parsed = JSON.parse(savedPoops)
      if (Array.isArray(parsed) && parsed.length > 0) {
        poopsList.value = parsed
        return
      }
    } catch (e) {
      console.error("Ошибка чтения какашек из localStorage", e)
    }
  }

  // 2. Если какашек нет — генерируем новые
  generatePoops()
}

// Функция генерации какашек со случайными координатами без наложения
function generatePoops() {
  // Если уровень меньше 10 -> ровно 1, если 10 или выше -> рандом от 1 до 3
  const count = (gameData.level >= 10)
      ? Math.floor(Math.random() * 3) + 1
      : 1

  const result = []
  const MIN_DISTANCE = 18 // Минимальный отступ между какашками в % (чтобы не слипались)

  for (let i = 0; i < count; i++) {
    let newLeft
    let isTooClose
    let attempts = 0

    // Ищем координату left, пока она не окажется достаточно далеко от остальных
    do {
      newLeft = Math.floor(Math.random() * 60) + 10 // от 10% до 70%
      isTooClose = result.some(poop => Math.abs(poop.left - newLeft) < MIN_DISTANCE)
      attempts++
    } while (isTooClose && attempts < 50)

    result.push({
      id: Date.now() + i,
      left: newLeft,
      bottom: Math.floor(Math.random() * 12) + 2, // от 2% до 14%
    })
  }

  poopsList.value = result
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result))
}

// Поштучная уборка конкретной какашки
function cleanSinglePoop(event, poopId) {
  // Вызываем эффекты/звук/награду
  Clean(event)

  // Удаляем только ту какашку, на которую нажали
  poopsList.value = poopsList.value.filter(p => p.id !== poopId)

  // Если убрали ВСЕ какашки
  if (poopsList.value.length === 0) {
    gameData.isPooped = false
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  } else {
    // Если еще остались — обновляем хранилище
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(poopsList.value))
  }
}

onMounted(() => {
  initPoops()
})
</script>

<template>
  <div class="poop-wrapper">
    <!-- Отрисовываем каждую какашку отдельно по её координатам -->
    <div
        v-for="poop in poopsList"
        :key="poop.id"
        @pointerdown.stop="cleanSinglePoop($event, poop.id)"
        class="absolute flex justify-center items-center z-35 w-8 cursor-pointer select-none"
        :style="{ left: `${poop.left}%`, bottom: `${poop.bottom}%` }"
    >
      <!-- Картинка какашки -->
      <img
          :src="`/gamePlay/poop.webp?v=${APP_VERSION}`"
          alt="poop"
          class="w-full h-full object-contain pointer-events-none"
      >

      <!-- Летающая муха №1 -->
      <span class="absolute top-3 right-5 text-[7px] fly-anim-1 pointer-events-none">🪰</span>

      <!-- Летающая муха №2 -->
      <span class="absolute -top-1 right-0 text-[7px] fly-anim-2 pointer-events-none">🪰</span>
    </div>
  </div>
</template>

<style scoped>
@keyframes fly1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-6px, -8px) scale(1.1); }
  66% { transform: translate(4px, -12px) scale(0.9); }
}

@keyframes fly2 {
  0%, 100% { transform: translate(0, 0) scale(0.9); }
  40% { transform: translate(8px, -10px) scale(1.1); }
  80% { transform: translate(-4px, -6px) scale(1); }
}

.fly-anim-1 {
  animation: fly1 1.6s infinite ease-in-out;
}

.fly-anim-2 {
  animation: fly2 1.3s infinite ease-in-out;
  animation-delay: 0.4s;
}
</style>