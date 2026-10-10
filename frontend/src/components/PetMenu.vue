<script setup>

import ShopModal from '@/components/ShopModal.vue'

import {
  cartItemsList, currentIndex, bathCartList, foodCartList,
  currentBathIndex, nextItem, nextBathItem
} from "@/scripts/basket.js";

import {
  currentDraggedItem,
  feedStatus,
  gameData,
  isShopOpen,
  showHunger,
  sleepTimeRemaining,
  statusFoam, location, isGameOver, handleRestart, warning, lowEnergy, activeTab, tutorialStep, nextTutorialStep
} from "@/scripts/useGameStore.js";
import {goSleep} from "@/scripts/actions.js";
import {
  foamDrag,
  foodDrag,
  showerCount,
  showerDrag,
  foodEl,
  showerEl,
  foamEl, foodConsumedByPipe
} from "@/scripts/dragAndDrop.js";
import {computed} from "vue";

const shouldPulse = computed(() => {
  const list = cartItemsList.value || cartItemsList;

  if (!showHunger.value || (foodDrag.isDragging.value && !foodConsumedByPipe)) {
    return false;
  }
  if (list.length === 0 || !list[currentIndex.value]) {
    return false;
  }
  return list[currentIndex.value].category !== 'shaman';
});
import {useRouter} from 'vue-router';
import {currentBet, isDealing} from "@/scripts/saloonScripts/twentyOneGame.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {isFortuneOpen} from "@/scripts/fortune.js";


const router = useRouter();

function goToSaloon() {
  // Безопасный расчет монет (поддерживает ref и обычный объект)
  const coins = Number(gameData?.value?.coins ?? gameData?.coins) || 0;

  if (coins < 50 && !currentBet.value) {
    alert('Нужно минимум 50 монет, чтобы зайти в Салун!');
    return;
  }
  if (gameData.foodLevel < 3) {
    alert('Чтобы зайти в Салун нужно быть сытым!');
    return;
  }
  if (gameData.energy < 3) {
    alert('Чтобы зайти в Салун нужно быть бодрым!');
    return;
  }

  // Определение устройства iOS (iPhone, iPad, iPod)
  const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // Жёсткая перезагрузка для iOS: очищает застрявший WebKit/GPU кэш Safari
    console.log('iOS')
    window.location.href = '/saloon';
  } else {
    console.log('Android')
    // Для Android и ПК оставляем быструю SPA-навигацию
    router.push('/saloon');
  }
}

function resetTutorial() {
  localStorage.removeItem('tutorial_completed')
  tutorialStep.value = 1 // Возвращаем на 1 шаг
  location.reload() // Перезагружаем страницу
}

const ADMIN_IDS = [
  '1059422557',
  '2101015196',
  '743865425',
  '7287871980'

]

const userId = computed(() => {
  return String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '')
})

// Проверяем, входит ли текущий userId в список админов
const isAdmin = computed(() => ADMIN_IDS.includes(userId.value))

const foodWarning = computed(() => {
  const list = foodCartList.value
  const idx = currentIndex.value

  return (gameData.isFat && list[idx]?.subcategory !== 'fruits' && gameData.isFat && list[idx]?.subcategory !== 'potion') ||
      (gameData.sick && list[idx]?.subcategory === 'pipe')
})

// Вычисляем картинку активной еды с версией
const currentFoodImage = computed(() => {
  const item = foodCartList.value?.[currentIndex.value]
  return item?.image ? `${item.image}?v=${APP_VERSION}` : ''
})

// Вычисляем картинку активного средства для купания с версией
const currentBathImage = computed(() => {
  const item = bathCartList.value?.[currentBathIndex.value]
  return item?.image ? `${item.image}?v=${APP_VERSION}` : ''
})
</script>

<template>
  <!--  HOME -->
  <ShopModal
      :is-open="isShopOpen"
      @close="isShopOpen = false"
  />

  <div>
    <button
        v-if="isAdmin"
        @click="resetTutorial"
        class="absolute bottom-0  right-2 z-300 bg-red-500 text-white text-xs px-2 py-1 rounded shadow"
    >
      Сбросить обучение
    </button>
  </div>
  <div
      class="rounded-4xl p-3 mx-5 bg-[#fff6ef] h-65 mt-1 border-2 border-[#f7c9a5] flex flex-col justify-center items-center">
    <div v-if="isGameOver">
      <div
          @click="handleRestart"
          class="bg-[#fff6ef] justify-center flex flex-col h-25   items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
          style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

        <button class="text-md font-bold text-gray-600 pointer-events-none">Начать заново</button>
      </div>
    </div>
    <div v-else>
      <div v-show="location==='home'" class="grid grid-cols-2 gap-8 relative  gap-y-1.5 w-65 place-self-center  ">
        <div
            @click="isShopOpen = true"
            class="bg-[#fff6ef] absolute p-1 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 justify-center h-14 w-14 overflow-hidden  flex flex-col items-center rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[100px] h-[100px]  bg-contain bg-no-repeat bg-center"
               :style="{ backgroundImage: `url('/gamePlay/market.webp?v=${APP_VERSION}')` }">
          </div>
          <!--          <button class="text-[5px] font-bold text-gray-600 pointer-events-none">Магазин</button>-->
        </div>


        <div
            @click="isFortuneOpen = true"
            class="bg-[#fff6ef] absolute p-1 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 justify-center h-11 w-11 overflow-hidden  flex flex-col items-center rounded-4xl border-2 border-purple-400 transition-transform duration-50 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[100px] h-[100px]  bg-contain bg-no-repeat bg-center"
               :style="{ backgroundImage: `url('/gamePlay/fortune_icons.webp?v=${APP_VERSION}')` }">
          </div>
          <!--          <button class="text-[5px] font-bold text-gray-600 pointer-events-none">Магазин</button>-->
        </div>


        <div
            @click="location = 'food',nextTutorialStep()"
            class="bg-[#fff6ef] justify-center h-25  flex flex-col  items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95"
            :class="[showHunger?'animate-pulse':'',tutorialStep === 1 ? 'z-205 animate-pulse': 'z-30']"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center cursor-pointer"
               :style="{backgroundImage: `url('/gamePlay/fridge.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600">Кормить</button>
        </div>
        <div
            @click="location = 'bath',nextTutorialStep()"
            class="bg-[#fff6ef] justify-center flex flex-col h-25   items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            :class=" tutorialStep === 5 ? 'z-205 animate-pulse' : ''"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/bath_icon.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">Мыть</button>
        </div>
        <div
            @click="goSleep()"

            :class="['bg-[#fff6ef] relative justify-center h-25  flex flex-col  items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95',showHunger?'opacity-50':'']"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[60px] h-[60px] bg-contain bg-no-repeat bg-center"
               :style="{ 'background-image': `url('/gamePlay/${gameData.sleep ? 'sun_icon.webp' : 'sleep_icon.webp'}?v=${APP_VERSION}')` }">
          </div>
          <div v-show="gameData.sleep"
               class="absolute bottom-8 text-md text-white text-shadow-md text-shadow-black font-bold  ">
            <p>{{ sleepTimeRemaining }}</p>
          </div>
          <button class="text-md font-bold text-gray-600">
            {{ gameData.sleep ? 'Проснуться' : 'Спать' }}
          </button>

        </div>
        <div class="relative rounded-4xl overflow-hidden">

          <!-- Блокирующий оверлей (как в магазине) -->
          <div
              v-if="gameData.level < 5"
              class="absolute inset-0 z-20 bg-slate-950/70 flex flex-col items-center justify-center p-1 text-center"
          >
        <span class="text-amber-400 font-bold text-xs tracking-wide leading-tight">
          🔒 Нужен<br>5 уровень
        </span>
          </div>

          <!-- Кнопка Салуна -->
          <div
              @click="goToSaloon"
              class="bg-[#fff6ef] relative justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"
              :class="{'opacity-50 pointer-events-none': gameData.level < 5}"
              style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);"
          >
            <div class="flex absolute top-1 right-2">
              <div class="relative w-5">
                <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" class="" alt="">
                <p class="absolute text-white text-shadow-lg text-shadow-black top-1 text-xs left-1 font-bold">50</p>
              </div>

            </div>

            <div
                class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
                :style="{backgroundImage: `url('/gamePlay/saloon.webp?v=${APP_VERSION}')`}"
            ></div>
            <button class="text-md font-bold text-gray-600 pointer-events-none">Салун</button>
          </div>

        </div>

      </div>


      <!--  BATH -->

      <div v-show="location==='bath'" class="grid grid-cols-2 gap-8 relative  gap-y-1.5 w-65 place-self-center  ">

        <!-- ДУШ -->
        <div
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34"
            :class="[
                tutorialStep === 7 ? 'z-205 bg-white' : '',
                tutorialStep === 7 && !showerDrag.isDragging.value? 'animate-pulse' : ''
                ]"
        >
          <div v-show="gameData.sick && statusFoam" class="absolute pointer-events-none w-20 opacity-50 animate-pulse">
            <img :src="`/gamePlay/warning_icons.webp?v=${APP_VERSION}`" alt="">
          </div>
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">
          <div v-show="!feedStatus"
               ref="showerEl"
               :style="[
               showerDrag.isDragging.value ? showerDrag.style.value : {},
               {
                   'touch-action': 'none',
                   'background-image': `url('/gamePlay/shower_icon.webp?v=${APP_VERSION}')`
               }
             ]"
               :class="[
               showerDrag.isDragging.value ? 'fixed z-210' : 'relative',
               statusFoam && !showerDrag.isDragging.value && !gameData.sick ? 'animate-pulse' : ''
             ]"
               class="flex flex-col items-center cursor-move w-[70px] h-[70px]  bg-contain bg-no-repeat bg-center"
          ></div>
          <div v-show="showerDrag.isDragging.value || feedStatus"
               :style="{backgroundImage: `url('/gamePlay/shower_icon.webp?v=${APP_VERSION}')`}"
               class="w-[70px] h-[70px] opacity-30 bg-contain">

          </div>

          <button class="text-xs font-bold text-gray-600">Душ</button>

        </div>

        <!-- ШАМПУНЬ -->
        <div
            @click="nextBathItem()"
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34 cursor-pointer"
            :class="[
              tutorialStep === 6 && bathCartList.length > 0? 'z-205  bg-white' : '',
              tutorialStep === 6 && bathCartList.length > 0 && !foamDrag.isDragging.value ? 'animate-pulse ' : ''
              ]"
        >
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">

          <!-- 1. Если список банных принадлежностей пуст -->
          <template v-if="bathCartList.length === 0">
            <div
                class="flex flex-col items-center justify-center w-[70px] h-[70px] opacity-30 bg-contain bg-no-repeat bg-center"
                :class="currentDraggedItem === 'shower' && !statusFoam && showerCount === 0 ? 'animate-pulse' : ''"
                :style="{backgroundImage: `url('/gamePlay/shampoo_icon.webp?v=${APP_VERSION}')`}">
            </div>
          </template>

          <!-- 2. Если в инвентаре есть шампунь/мыло -->
          <template v-else>
            <div v-show="!feedStatus"
                 ref="foamEl"
                 :style="[
       foamDrag.isDragging.value ? foamDrag.style.value : {},
       {
           'touch-action': 'none',
           'background-image': currentBathImage ? `url('${currentBathImage}')` : 'none'
       }
     ]"
                 :class="[
       /* УБИРАЕМ pointer-events-none, чтобы событие перетаскивания не теряло позицию */
       foamDrag.isDragging.value ? 'fixed z-150' : 'relative',
       currentDraggedItem === 'shower' && !statusFoam && showerCount === 0 ? 'animate-pulse' : ''
     ]"
                 class="flex flex-col items-center cursor-move w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
            ></div>

            <div v-show="foamDrag.isDragging.value || feedStatus"
                 :style="{ 'background-image': `url('${bathCartList[currentBathIndex]?.image}?v=${APP_VERSION}')` }"
                 class="w-[70px] h-[70px] opacity-30 bg-contain bg-no-repeat bg-center">

            </div>
          </template>

          <!-- Текст названия / статуса -->
          <p class="text-xs absolute bottom-2 font-bold text-gray-600 pointer-events-none whitespace-nowrap">
            {{
              bathCartList.length > 0 && bathCartList[currentBathIndex]
                  ? `${bathCartList[currentBathIndex].name} x${bathCartList[currentBathIndex].count}`
                  : 'Полка пустая'
            }}
          </p>
        </div>

        <div
            @click="location =  'home'"
            class="bg-[#fff6ef] justify-center h-25  flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            style="box-shadow: inset 0 -5px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-20 h-20 bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-lg font-bold text-gray-600 pointer-events-none">Назад</button>
        </div>
        <div
            @click="isShopOpen = true;activeTab='bath'"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/market.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">Магазин</button>
        </div>
      </div>

      <!-- FOOD -->


      <div v-show="location==='food'" class="grid grid-cols-2 gap-8 relative  gap-y-1.5 w-65 place-self-center " >

        <div
            @click="nextItem()"
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34 overflow-hidden"
            :class="[
              tutorialStep === 2 && foodCartList.length > 0 ? 'z-205 pointer-events-auto bg-white' : 'z-30',
              tutorialStep === 2 && foodCartList.length > 0 && !foodDrag.isDragging.value ? 'animate-pulse' : ''
]"

        >
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">

          <!-- 1. Если холодильник пуст: используем foodCartList вместо cartItemsList -->
          <template v-if="foodCartList.length === 0">
            <div
                :class="!foodDrag.isDragging.value  && showHunger ? 'animate-pulse' : ''"
                class="flex flex-col items-center justify-center w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"

                :style="{backgroundImage: `url('/gamePlay/fridge_empty.webp?v=${APP_VERSION}')`}">

            </div>
          </template>

          <!-- 2. Если в холодильнике есть еда -->
          <template v-else>
            <div v-show="!feedStatus"
                 ref="foodEl"
                 :style="[
                   (foodDrag.isDragging.value && !foodConsumedByPipe) ? foodDrag.style.value : {},
                   {
                     'touch-action': 'none',
                     'background-image': currentFoodImage ? `url('${currentFoodImage}')` : 'none'
                   }
                 ]"
                 :class="[

                   (foodDrag.isDragging.value && !foodConsumedByPipe) ? 'fixed z-150 pointer-events-none' : 'relative ',
                   !foodDrag.isDragging.value &&( foodCartList[currentIndex]?.category === 'food') && showHunger ? 'animate-pulse' : '',
                    !foodDrag.isDragging.value && foodCartList[currentIndex]?.id === 'healthPotion' && gameData.sick ? 'animate-pulse' : '',
                    !foodDrag.isDragging.value && foodCartList[currentIndex]?.id === 'pipe' && lowEnergy.value ? 'animate-pulse' : '',


                 ]"
                 class="flex flex-col items-center cursor-move w-[80px] h-[80px]  bg-contain bg-no-repeat bg-center"
            ></div>
            <div
                v-show="foodWarning"
                class="absolute w-20 opacity-50 animate-pulse pointer-events-none">
              <img :src="`/gamePlay/warning_icons.webp?v=${APP_VERSION}`" alt="">
            </div>
            <img v-show="(foodDrag.isDragging.value || feedStatus) && !foodConsumedByPipe"
                 :src="foodCartList[currentIndex]?.image"
                 class="opacity-30 relative"
                 width="80"
                 alt="">
          </template>
          <p v-show="Object.keys(gameData.cart).length > 0" class="absolute top-0 left-2 text-amber-500">
            x{{ gameData.cart[foodCartList[currentIndex]?.id] || 0 }}
          </p>
          <!-- Текст названия / статуса с использованием foodCartList -->
          <p class="text-[10px] absolute bottom-0 font-bold text-gray-600 pointer-events-none whitespace-nowrap">
            {{
              foodCartList.length > 0 && foodCartList[currentIndex]
                  ? `${foodCartList[currentIndex].name}`
                  : 'Холодильник пуст'
            }}
          </p>

        </div>

        <div
            @click="isShopOpen = true;activeTab='food'"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/market.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">Магазин</button>
        </div>

        <div
            @click="location = 'home',nextTutorialStep()"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            :class=" tutorialStep === 4 ? 'z-205 animate-pulse' : ''"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-20 h-20 bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">Назад</button>
        </div>
      </div>
    </div>

  </div>

</template>

<style scoped>

@keyframes pulse-breath {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.03) translateY(2px);
  }
}

.animate-pulse {
  animation: pulse-breath 0.5s ease-in-out infinite;
}

</style>