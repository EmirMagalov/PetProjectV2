<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { tutorialStep, location, activeStatus, gameData } from "@/scripts/useGameStore.js"

// Храним массив координат всех найденных элементов текущего шага
const targetRects = ref([])

function updateTargetRect() {
  if (tutorialStep.value === 0) {
    targetRects.value = []
    return
  }

  // Теперь для каждого шага можно передавать и строки, и массивы селекторов!
  const selectorsMap = {
    1: '#tutorial-pet',
    2: '#tutorial-fridge',
    3: ['#tutorial-food','#tutorial-pet'],
    4: '#tutorial-pet',
    5: '#tutorial-back',
    6: '#tutorial-bath-btn',
    7: ['#tutorial-shampoo', '#tutorial-pet'],   // Подсветит и шампунь, и питомца по отдельности
    8: ['#tutorial-shower', '#tutorial-pet']     // Подсветит и душ, и питомца по отдельности
  }

  const rawSelector = selectorsMap[tutorialStep.value]
  // Превращаем в массив, даже если передан один элемент
  const selectors = Array.isArray(rawSelector) ? rawSelector : [rawSelector]

  setTimeout(() => {
    const rects = []
    selectors.forEach(selector => {
      if (!selector) return
      const el = document.querySelector(selector)
      if (el) {
        const rect = el.getBoundingClientRect()
        rects.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          radius: selector === '#tutorial-egg' ? '50%' : '24px'
        })
      }
    })
    targetRects.value = rects
  }, 50)
}

watch([tutorialStep, location], () => {
  nextTick(() => setTimeout(updateTargetRect, 60))
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', updateTargetRect)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTargetRect)
})

function Skip() {
  tutorialStep.value = 0
  localStorage.setItem('tutorial_completed', 'true')
  gameData.tutorialCompleted = true
}
</script>

<template>
  <div v-if="tutorialStep > 0" class="fixed inset-0 z-200 pointer-events-none select-none">

    <!-- SVG-маска: создает темный фон и вырезает независимые дырки для каждого элемента из массива -->
    <svg v-if="targetRects.length > 0" class="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <mask id="tutorial-spotlight-mask">
          <!-- Белый фон (затемнение будет везде, где белый цвет) -->
          <rect width="100%" height="100%" fill="white" />
          <!-- Черные прямоугольники вырезают прозрачные «окошки» для каждого элемента -->
          <rect
              v-for="(r, index) in targetRects"
              :key="index"
              :x="r.left"
              :y="r.top"
              :width="r.width"
              :height="r.height"
              :rx="r.radius === '50%' ? r.width / 2 : 24"
              :ry="r.radius === '50%' ? r.height / 2 : 24"
              fill="black"
          />
        </mask>
      </defs>
      <!-- Затемненный прямоугольник на весь экран с примененной маской -->
      <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#tutorial-spotlight-mask)"
      />
    </svg>

    <!-- Если элементы не найдены — просто сплошное затемнение -->
    <div v-else class="absolute inset-0 bg-black/60 pointer-events-auto"></div>

    <!-- ШАГ 1 -->
    <div v-if="tutorialStep === 1" class="absolute top-22 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 max-h-30 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_1') }}</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 2 -->
    <div v-if="tutorialStep === 2" class="absolute top-15 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_2') }}</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 3 -->
    <div v-if="tutorialStep === 3 && location === 'food'" class="absolute top-15 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-3 rounded-2xl shadow-lg w-70 max-h-30 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_3') }}</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 4 -->
    <div v-if="tutorialStep === 4 && !activeStatus.show" class="absolute top-15 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 max-h-30 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_4') }}</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 5 -->
    <div v-if="tutorialStep === 5" class="absolute top-15 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 max-h-30 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_5') }}</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 6 -->
    <div v-if="tutorialStep === 6" class="absolute top-15 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 max-h-30 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_6') }}</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 7 -->
    <div v-if="tutorialStep === 7" class="absolute top-15 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 max-h-30 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_7') }}</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 8 -->
    <div v-if="tutorialStep === 8" class="absolute top-15 left-1/2 -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 max-h-30 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            {{ $t('tutorial.skip') }}
          </button>
          <span>{{ $t('tutorial.step_8') }}</span>
        </div>
      </div>
    </div>

  </div>
</template>