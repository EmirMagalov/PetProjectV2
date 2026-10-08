<script setup>
import {tutorialStep, location, activeStatus} from "@/scripts/useGameStore.js";


function Skip() {
  tutorialStep.value = 0 // Исправлено: работаем через .value
  localStorage.setItem('tutorial_completed', 'true')
}
</script>

<template>
  <div v-if="tutorialStep > 0" class="fixed inset-0 z-200 pointer-events-none touch-none select-none">
    <!-- Тёмная подложка (кликабельная) -->
    <div class="absolute inset-0 bg-black/60 transition-opacity duration-500 pointer-events-auto"></div>

    <!-- ШАГ 1: Инструкция по перетаскиванию еды -->
    <div v-if="tutorialStep === 1" class="absolute  top-15 left-1/2  -translate-x-1/2 pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl  shadow-lg w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500  hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            Пропустить обучение
          </button>
          <span>Нажми на холодильник чтобы перейти к кормлению!</span>
        </div>
      </div>
    </div>

    <!-- ШАГ 2: Перетаскивание еды -->
    <div v-if="tutorialStep === 2 && location === 'food'" class="absolute  top-15 left-1/2 -translate-x-1/2  pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-3 rounded-2xl shadow-lg w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            Пропустить обучение
          </button>
          <span>Перетащи еду на питомца, чтобы покормить!</span>

        </div>
      </div>
    </div>

    <!-- ШАГ 3: Клик по питомцу -->
    <div v-if="tutorialStep === 3 && !activeStatus.show" class="absolute  top-15 left-1/2 -translate-x-1/2  pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg  w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            Пропустить обучение
          </button>
          <span >Кликай по питомцу чтобы заработать еще монет и опыта!</span>

        </div>
      </div>
    </div>

    <div v-if="tutorialStep === 4" class="absolute top-15 left-1/2 -translate-x-1/2   pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500  hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            Пропустить обучение
          </button>
          <span>Вернись в главное меню!</span>

        </div>
      </div>
    </div>

    <div v-if="tutorialStep === 5" class="absolute  top-15 left-1/2 -translate-x-1/2  pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            Пропустить обучение
          </button>
          <span>Питомец испачкался, нужно его помыть!</span>

        </div>
      </div>
    </div>

    <div v-if="tutorialStep === 6" class="absolute  top-15 left-1/2 -translate-x-1/2  pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            Пропустить обучение
          </button>
          <span>Перетащи шампунь на питомца!</span>

        </div>
      </div>
    </div>

    <div v-if="tutorialStep === 7" class="absolute  top-15 left-1/2 -translate-x-1/2  pointer-events-auto">
      <div class="bg-white text-slate-900 font-bold px-4 py-2 rounded-2xl shadow-lg  w-70 h-20 text-sm animate-bounce">
        <div class="flex text-center flex-col h-full items-center justify-between">
          <button @click="Skip" class="text-amber-500 hover:text-amber-600 font-bold cursor-pointer pointer-events-auto">
            Пропустить обучение
          </button>
          <span>Перетащи и держи душ  чтобы смыть пену!</span>

        </div>
      </div>
    </div>
  </div>
</template>