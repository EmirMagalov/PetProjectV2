<script setup>
import {tutorialStep, location, activeStatus, gameData} from "@/scripts/useGameStore.js";


function Skip() {
  tutorialStep.value = 0
  localStorage.setItem('tutorial_completed', 'true')
  gameData.tutorialCompleted = true
}
</script>

<template>
  <div v-if="tutorialStep > 0" class="fixed inset-0 z-200 pointer-events-none touch-none select-none">
    <!-- Тёмная подложка (кликабельная) -->
    <div class="absolute inset-0 bg-black/60 transition-opacity duration-500 pointer-events-auto"></div>

    <!-- ШАГ 1: Инструкция по яйцу -->
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

    <!-- ШАГ 2: Инструкция по холодильнику -->
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

    <!-- ШАГ 3: Перетаскивание еды -->
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

    <!-- ШАГ 4: Клик по питомцу -->
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

    <!-- ШАГ 5: Возврат в меню -->
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

    <!-- ШАГ 6: Питомец испачкался -->
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

    <!-- ШАГ 7: Шампунь -->
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

    <!-- ШАГ 8: Душ -->
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