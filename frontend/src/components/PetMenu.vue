<script setup>
import ShopModal from '@/components/ShopModal.vue'
import {
  currentIndex, bathCartList, foodCartList, serumCartList,
  currentBathIndex, currentSerumIndex, nextItem, nextBathItem, nextSerumItem
} from "@/scripts/basket.js";
import {
  feedStatus,
  gameData,
  isShopOpen,
  showHunger,
  sleepTimeRemaining,
  statusFoam, location, handleRestart, lowEnergy, activeTab, tutorialStep, nextTutorialStep,
  isAdmin, energyFull
} from "@/scripts/useGameStore.js";
import {goSleep} from "@/scripts/actions.js";
import {
  showerCount,
  foodEl,
  showerEl,
  foamEl,
  initFoodInteract,
  initFoamInteract,
  initShowerInteract, isDraggingMain
} from "@/scripts/dragAndDrop.js";
import {computed, onMounted, watch} from "vue";

import {useRouter} from 'vue-router';
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {initSerumInteract, serumEl} from "@/scripts/laboratoryScripts/dragAndDrop.js";

const router = useRouter();



function resetTutorial() {
  localStorage.removeItem('tutorial_completed')
  tutorialStep.value = 1
  location.reload()
}

const foodWarning = computed(() => {
  const list = foodCartList.value
  const idx = currentIndex.value
  return (gameData.isFat && list[idx]?.subcategory !== 'fruits' && gameData.isFat && list[idx]?.subcategory !== 'serum') ||
      (gameData.sick && list[idx]?.subcategory === 'pipe')
})

const currentFoodImage = computed(() => {
  const item = foodCartList.value?.[currentIndex.value]
  return item?.image ? `${item.image}?v=${APP_VERSION}` : ''
})

const currentBathImage = computed(() => {
  const item = bathCartList.value?.[currentBathIndex.value]
  return item?.image ? `${item.image}?v=${APP_VERSION}` : ''
})

const currentSerumImage = computed(() => {
  const item = serumCartList.value?.[currentSerumIndex.value]
  return item?.image ? `${item.image}?v=${APP_VERSION}` : ''
})

onMounted(() => {
  if (foodEl.value) initFoodInteract(foodEl.value)
  if (foamEl.value) initFoamInteract(foamEl.value)
  if (showerEl.value) initShowerInteract(showerEl.value) // Исправлено на правильную функцию душа
  if (serumEl.value) initSerumInteract(serumEl.value)    // Добавлена инициализация сыворотки
})

watch(foodEl, (newEl) => { if (newEl) initFoodInteract(newEl) })
watch(foamEl, (newEl) => { if (newEl) initFoamInteract(newEl) })
watch(showerEl, (newEl) => { if (newEl) initShowerInteract(newEl) })
watch(serumEl, (newEl) => { if (newEl) initSerumInteract(newEl) })
</script>

<template>


  <div>
    <button v-if="isAdmin" @click="resetTutorial" class="absolute bottom-0 right-2 z-300 bg-red-500 text-white text-xs px-2 py-1 rounded shadow">
      Сбросить обучение
    </button>
  </div>

  <div class="rounded-4xl p-3 mt-1 bg-[#fff6ef] max-h-60 border-2 border-[#f7c9a5] flex flex-col justify-center items-center w-full max-w-[300px] mx-auto">
    <div v-if="gameData.isGameOver">
      <div @click="handleRestart" class="bg-[#fff6ef] justify-center flex flex-col h-25 items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
        <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('store.start_again') }}</button>
      </div>
    </div>

    <div v-else class="relative h-full w-full flex flex-col items-center justify-center">
      <div v-if="gameData.level === 1" class="absolute inset-0 backdrop-blur-xs rounded-3xl z-40 cursor-not-allowed flex items-center justify-center">
        <span class="text-white font-bold text-xs bg-black/60 px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5">
          <img src="/gamePlay/lock.webp" class="w-15 h-15 object-contain" alt="">
        </span>
      </div>

      <!-- HOME -->
      <div v-show="location==='home'" class="grid grid-cols-2 gap-8 relative gap-y-1.5 w-65 place-self-center">
        <div @click="isShopOpen = true" class="bg-[#fff6ef] absolute p-1 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 justify-center h-14 w-14 overflow-hidden flex flex-col items-center rounded-4xl border-2 border-[#f7c9a5] cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[100px] h-[100px] bg-contain bg-no-repeat bg-center" :style="{ backgroundImage: `url('/gamePlay/market.webp?v=${APP_VERSION}')` }"></div>
        </div>



        <div id="tutorial-fridge" @click="location = 'food',nextTutorialStep()" class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] active:scale-95" :class="[showHunger?'animate-pulse':'']" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center cursor-pointer" :style="{backgroundImage: `url('/gamePlay/fridge.webp?v=${APP_VERSION}')`}"></div>
          <button class="text-md font-bold text-gray-600">{{ $t('feed') }}</button>
        </div>

        <div id="tutorial-bath-btn" @click="location = 'bath',nextTutorialStep()" class="bg-[#fff6ef] justify-center flex flex-col h-25 items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/bath_icon.webp?v=${APP_VERSION}')`}"></div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('wash') }}</button>
        </div>

        <div @click="goSleep()" :class="[lowEnergy && !showHunger && !gameData.sleep?'animate-pulse':'','bg-[#fff6ef] relative justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] active:scale-95',showHunger || energyFull?'opacity-50':'']" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <img v-show="energyFull" class="w-10 absolute top-0 right-0" src="/gamePlay/energy_full.webp" alt="">
          <div class="w-[60px] h-[60px] bg-contain bg-no-repeat bg-center" :style="{ 'background-image': `url('/gamePlay/${gameData.sleep ? 'sun_icon.webp' : 'sleep_icon.webp'}?v=${APP_VERSION}')` }"></div>
          <div v-show="gameData.sleep" class="absolute bottom-8 text-md text-white font-bold"><p>{{ sleepTimeRemaining }}</p></div>
          <button class="text-md font-bold text-gray-600">{{ gameData.sleep ? $t('wake_up') : $t('sleep') }}</button>
        </div>

        <div @click="router.push('/laboratory');" class="bg-[#fff6ef] relative justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/laboratory_icon.webp?v=${APP_VERSION}')`}"></div>
          <button class="text-xs font-bold text-gray-600 pointer-events-none">{{ $t('laboratory') }}</button>
        </div>
      </div>

      <!-- BATH -->
      <div v-show="location==='bath'" class="grid grid-cols-2 gap-8 relative gap-y-1.5 w-65 place-self-center">
        <!-- Душ -->
        <div id="tutorial-shower" class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34">
          <div v-show="gameData.sick && statusFoam" class="absolute pointer-events-none w-20 opacity-50 animate-pulse z-20"><img :src="`/gamePlay/warning_icons.webp?v=${APP_VERSION}`" alt=""></div>
          <img class="absolute top-0 right-3 z-20" src="/signs/two_lines.svg" width="20" alt="">

          <div class="relative w-[70px] h-[70px]">
            <!-- 1. Призрак душа -->
            <div
                v-show="!feedStatus"
                style="background-image: url('/gamePlay/shower_icon.webp')"
                class="absolute inset-0 w-[70px] h-[70px] bg-contain bg-no-repeat bg-center opacity-30 pointer-events-none">
            </div>

            <!-- 2. Перетаскиваемый душ -->
            <div
                v-show="!feedStatus"
                ref="showerEl"
                style="touch-action: none; background-image: url('/gamePlay/shower_icon.webp')"
                class="relative z-10 flex flex-col items-center cursor-move w-[70px] h-[70px] bg-contain bg-no-repeat bg-center">
            </div>
          </div>

          <button class="absolute text-xs font-bold bottom-0 text-gray-600 z-20">{{ $t('shower') }}</button>
        </div>

        <!-- Шампунь -->
        <div id="tutorial-shampoo" @click="nextBathItem()" class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34 cursor-pointer">
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">

          <template v-if="bathCartList.length === 0">
            <div class="flex flex-col items-center justify-center w-[70px] h-[70px] opacity-30 bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/Bath/shampoo_icon.webp?v=${APP_VERSION}')`}"></div>
          </template>
          <template v-else>
            <div class="relative w-[70px] h-[70px]">
              <!-- 1. Призрак шампуня (лежит строго в 0,0 под основным элементом) -->
              <div
                  v-show="!feedStatus"
                  :style="{ 'background-image': currentBathImage ? `url('${currentBathImage}')` : 'none' }"
                  class="absolute inset-0 w-[70px] h-[70px] bg-contain bg-no-repeat bg-center opacity-30 pointer-events-none"
              ></div>

              <!-- 2. Перетаскиваемый шампунь (лежит поверх, двигается через interact.js) -->
              <div
                  v-show="!feedStatus"
                  ref="foamEl"
                  style="touch-action: none; will-change: transform;"
                  :style="{ 'background-image': currentBathImage ? `url('${currentBathImage}')` : 'none' }"
                  class="relative z-10 flex flex-col items-center cursor-move w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
              ></div>
            </div>
          </template>

          <p v-show="bathCartList.length > 0" class="absolute top-0 left-2 text-amber-500">x{{ gameData.cart[bathCartList[currentBathIndex]?.id] || 0 }}</p>
          <p class="absolute bottom-0 font-bold text-center text-gray-600 pointer-events-none" :class="bathCartList[currentBathIndex]?.name.length<15?'text-[10px]':'text-[7px]'">
            {{ bathCartList.length > 0 && bathCartList[currentBathIndex] ? $t(`items.${bathCartList[currentBathIndex].id}`) : $t('empty_shelf') }}
          </p>
        </div>

        <div @click="location = 'home';" class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer" style="box-shadow: inset 0 -5px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-20 h-20 bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
          <button class="text-lg font-bold text-gray-600 pointer-events-none">{{ $t('back') }}</button>
        </div>
        <div @click="isShopOpen = true;activeTab='bath'" class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/market.webp?v=${APP_VERSION}')`}"></div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('shop') }}</button>
        </div>
      </div>

      <!-- FOOD -->
      <div v-show="location==='food'" class="grid grid-cols-2 gap-8 relative gap-y-1.5 w-65 place-self-center">
        <!-- Блок продуктов -->
        <div id="tutorial-food" @click="nextItem()" class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34">
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">

          <template v-if="foodCartList.length === 0">
            <div :class="showHunger ? 'animate-pulse' : ''" class="flex flex-col items-center justify-center w-[80px] h-[80px] bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/fridge_empty.webp?v=${APP_VERSION}')`}"></div>
          </template>
          <template v-else>
            <div class="relative w-[80px] h-[80px] " :class="[!isDraggingMain && showHunger ? 'animate-pulse' : '']">
              <!-- 1. Призрак (лежит строго в 0,0 этого контейнера) -->
              <div
                  v-show="!feedStatus"
                  :style="{ 'background-image': currentFoodImage ? `url('${currentFoodImage}')` : 'none' }"
                  class="absolute inset-0 w-[80px] h-[80px] bg-contain bg-no-repeat bg-center opacity-30 pointer-events-none"
              ></div>

              <!-- 2. Перетаскиваемый элемент (лежит ровно поверх призрака, двигается через interact.js) -->
              <div
                  v-show="!feedStatus"
                  ref="foodEl"
                  style="touch-action: none; will-change: transform;"
                  :style="{ 'background-image': currentFoodImage ? `url('${currentFoodImage}')` : 'none' }"
                  class="relative z-10 flex flex-col items-center cursor-move w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"

              ></div>
            </div>

            <div v-show="foodWarning" class="absolute w-20 opacity-50 animate-pulse pointer-events-none z-20">
              <img :src="`/gamePlay/warning_icons.webp?v=${APP_VERSION}`" alt="">
            </div>
          </template>

          <p v-show="foodCartList.length > 0" class="absolute top-0 left-2 text-amber-500">x{{ gameData.cart[foodCartList[currentIndex]?.id] || 0 }}</p>
          <p class="absolute bottom-0 font-bold text-gray-600 pointer-events-none" :class="foodCartList[currentIndex]?.name.length < 15?'text-[10px]':'text-[7px]'">
            {{ foodCartList.length > 0 && foodCartList[currentIndex] ? $t(`items.${foodCartList[currentIndex].id}`) : $t('fridge_empty') }}
          </p>
        </div>

        <!-- Лабораторные сыворотки -->
        <div @click="nextSerumItem()" class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-emerald-200/30">
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">
          <template v-if="serumCartList.length === 0">
            <div class="flex flex-col items-center justify-center w-[80px] h-[80px] bg-contain bg-no-repeat bg-center opacity-40" :style="{backgroundImage: `url('/gamePlay/first_aid_empty.webp?v=${APP_VERSION}')`}"></div>
          </template>
          <template v-else>
            <div class="relative w-[80px] h-[80px]" :class="[!isDraggingMain &&
  (gameData.sick && serumCartList[currentSerumIndex]?.id === 'health_serum') ||
  (gameData.health === 1 && serumCartList[currentSerumIndex]?.id === 'life_serum') || (lowEnergy && serumCartList[currentSerumIndex]?.id === 'energy_serum')
    ? 'animate-pulse'
    : ''
]">
              <!-- 1. Призрак сыворотки (лежит строго в 0,0 под основным элементом) -->
              <div
                  v-show="!feedStatus"
                  :style="{ 'background-image': currentSerumImage ? `url('${currentSerumImage}')` : 'none' }"
                  class="absolute inset-0 w-[80px] h-[80px] bg-contain bg-no-repeat bg-center opacity-30 pointer-events-none"
              ></div>

              <!-- 2. Перетаскиваемая сыворотка (лежит поверх, двигается через interact.js) -->
              <div
                  v-show="!feedStatus"
                  ref="serumEl"
                  style="touch-action: none; will-change: transform;"
                  :style="{ 'background-image': currentSerumImage ? `url('${currentSerumImage}')` : 'none' }"
                  class="relative z-10 flex flex-col items-center cursor-move w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"
              ></div>
            </div>
          </template>
          <p v-show="serumCartList.length > 0" class="absolute top-0 left-2 text-amber-500">x{{ gameData.cart[serumCartList[currentSerumIndex]?.id] || 0 }}</p>
          <p class="absolute bottom-0 font-bold text-gray-600 pointer-events-none" :class="serumCartList[currentSerumIndex]?.name.length < 15 ? 'text-[10px]' : 'text-[7px]' ">
            {{ serumCartList.length > 0 && serumCartList[currentSerumIndex] ? $t(`items.${serumCartList[currentSerumIndex].id}`) : $t('first_aid_empty') }}
          </p>
        </div>

        <div id="tutorial-back" @click="location = 'home',nextTutorialStep()" class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-20 h-20 bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('back') }}</button>
        </div>
        <div @click="isShopOpen = true;activeTab='food'" class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/market.webp?v=${APP_VERSION}')`}"></div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('shop') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-breath {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.03) translateY(2px); }
}
.animate-pulse {
  animation: pulse-breath 0.5s ease-in-out infinite;
}
</style>