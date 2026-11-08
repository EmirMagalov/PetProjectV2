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
  statusFoam, location, handleRestart, warning, lowEnergy, activeTab, tutorialStep, nextTutorialStep,
  isAdmin, energyFull
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
import i18n from "@/scripts/locales/i18n.js";


const shouldPulse = computed(() => {
  const list = cartItemsList.value || cartItemsList;

  if (!showHunger.value || (foodDrag.isDragging.value && !foodConsumedByPipe)) {
    return false;
  }
  if (list.length === 0 || !list[currentIndex.value]) {
    return false;
  }
  return list[currentIndex.value].category !== 'laboratory';
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
    alert(i18n.global.t('minigames_access.jackpot_min_coins'));
    return;
  }
  if (gameData.foodLevel < 3) {
    alert(i18n.global.t('minigames_access.jackpot_fed'));
    return;
  }
  if (gameData.energy < 3) {
    alert(i18n.global.t('minigames_access.jackpot_energy'));
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


function goToCatchTheFood() {
  // Безопасный расчет монет (поддерживает ref и обычный объект)

  if (gameData.foodLevel < 3) {
    alert(i18n.global.t('minigames_access.food_catch_fed'));
    return;
  }
  if (gameData.energy < 3) {
    alert(i18n.global.t('minigames_access.food_catch_energy'));
    return;
  }

  // Определение устройства iOS (iPhone, iPad, iPod)
  const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // Жёсткая перезагрузка для iOS: очищает застрявший WebKit/GPU кэш Safari
    console.log('iOS')
    window.location.href = '/thefoodgame';
  } else {
    console.log('Android')
    // Для Android и ПК оставляем быструю SPA-навигацию
    router.push('/thefoodgame');
  }
}

function Match3Game() {
  // Безопасный расчет монет (поддерживает ref и обычный объект)

  if (gameData.foodLevel < 3) {
    alert(i18n.global.t('minigames_access.hop_hop_fed'));
    return;
  }
  if (gameData.energy < 3) {
    alert(i18n.global.t('minigames_access.fruit_fresh_energy'));
    return;
  }

  // Определение устройства iOS (iPhone, iPad, iPod)
  const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // Жёсткая перезагрузка для iOS: очищает застрявший WebKit/GPU кэш Safari
    console.log('iOS')
    window.location.href = '/match3game';
  } else {
    console.log('Android')
    // Для Android и ПК оставляем быструю SPA-навигацию
    // router.push('/match3game');
    window.location.href = '/match3game';
  }
}
function resetTutorial() {
  localStorage.removeItem('tutorial_completed')
  tutorialStep.value = 1 // Возвращаем на 1 шаг
  location.reload() // Перезагружаем страницу
}




// Проверяем, входит ли текущий userId в список админов


const foodWarning = computed(() => {
  const list = foodCartList.value
  const idx = currentIndex.value

  return (gameData.isFat && list[idx]?.subcategory !== 'fruits' && gameData.isFat && list[idx]?.subcategory !== 'serum') ||
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
    <div v-if="gameData.isGameOver">
      <div
          @click="handleRestart"
          class="bg-[#fff6ef] justify-center flex flex-col h-25   items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
          style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

        <button class="text-md font-bold text-gray-600 pointer-events-none">{{$t('store.start_again')}}</button>
      </div>
    </div>
    <div v-else class="relative h-full w-full flex flex-col items-center justify-center">
      <div
          v-if="gameData.level === 1"
          class="absolute inset-0   backdrop-blur-xs  rounded-3xl z-40 cursor-not-allowed flex items-center justify-center"
      >
        <span class="text-white font-bold text-xs bg-black/60 px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5">
          <img src="/gamePlay/lock.webp" class="w-15 h-15 object-contain" alt="">
        </span>
      </div>
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

        <div v-show="gameData.level>1" class="absolute gap-2 z-20 flex -top-10 left-1/2 -translate-x-1/2">

          <!-- 1. Кнопка Фортуны -->
          <div
              @click="isFortuneOpen = true"
              class="bg-purple-200 overflow-hidden rounded-4xl border-2 border-purple-400 transition-transform duration-50 cursor-pointer"
              style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
            <div class="h-9 w-9 bg-contain bg-no-repeat bg-center"
                 :style="{ backgroundImage: `url('/gamePlay/fortune_icons.webp?v=${APP_VERSION}')` }">
            </div>
          </div>

          <!-- 2. Кнопка Салуна (с замком) -->
          <div class="relative rounded-4xl overflow-hidden cursor-pointer" @click="gameData.level >= 10 && goToSaloon()">
            <div
                v-if="gameData.level < 10"
                class="absolute inset-0 z-30 bg-slate-950/50 flex flex-col items-center justify-center text-center pointer-events-none"
            >
              <span class="text-amber-400 font-bold text-[7px] tracking-wide leading-tight">
                🔒 10 lvl
              </span>
            </div>
            <div
                class="bg-red-200 overflow-hidden rounded-4xl border-2 border-red-600 transition-transform duration-50"
                style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
              <div class="h-9 w-9 bg-contain bg-no-repeat bg-center"
                   :style="{ backgroundImage: `url('/gamePlay/jackpot_icon.webp?v=${APP_VERSION}')` }">
              </div>
            </div>
          </div>

          <!-- 3. Кнопка Catch the Food -->
          <div
              @click="goToCatchTheFood()"
              class="bg-orange-200 overflow-hidden rounded-4xl border-2 border-orange-400 transition-transform duration-50 cursor-pointer"
              style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
            <div class="h-9 w-9 bg-contain bg-no-repeat bg-center"
                 :style="{ backgroundImage: `url('/gamePlay/cart_for_game.webp?v=${APP_VERSION}')` }">
            </div>
          </div>

          <!-- 4. Кнопка Match3 (с плашкой Beta) -->
          <div
              @click="Match3Game()"
              class="bg-green-300 relative overflow-hidden rounded-4xl border-2 border-yellow-400 transition-transform duration-50 cursor-pointer"
              style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
            <div class="h-9 w-9 bg-contain bg-no-repeat bg-center"
                 :style="{ backgroundImage: `url('/gamePlay/fruit_fresh_icon.webp?v=${APP_VERSION}')` }">
            </div>
            <div

                class="absolute inset-0 z-20 flex flex-col items-center justify-end pb-0.5 text-center pointer-events-none bg-black/10"
            >
      <span class="text-amber-400 text-shadow-2xs text-shadow-black font-bold text-[7px] tracking-wide leading-tight">
        Beta
      </span>
            </div>
          </div>

        </div>

        <div
            @click="location = 'food',nextTutorialStep()"
            class="bg-[#fff6ef] justify-center h-25  flex flex-col  items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95"
            :class="[showHunger?'animate-pulse':'',tutorialStep === 2 ? 'z-205 animate-pulse': 'z-30']"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center cursor-pointer"
               :style="{backgroundImage: `url('/gamePlay/fridge.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600">{{ $t('feed') }}</button>
        </div>
        <div
            @click="location = 'bath',nextTutorialStep()"
            class="bg-[#fff6ef] justify-center flex flex-col h-25   items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            :class=" tutorialStep === 6 ? 'z-205 animate-pulse' : ''"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/bath_icon.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('wash') }}</button>
        </div>
        <div
            @click="goSleep()"

            :class="[lowEnergy && !showHunger && !gameData.sleep?'animate-pulse':'','bg-[#fff6ef] relative justify-center h-25  flex flex-col  items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95',showHunger || energyFull?'opacity-50':'']"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <img v-show="energyFull" class="w-10 absolute top-0 right-0" src="/gamePlay/energy_full.webp" alt="">
          <div class="w-[60px] h-[60px] bg-contain bg-no-repeat bg-center"
               :style="{ 'background-image': `url('/gamePlay/${gameData.sleep ? 'sun_icon.webp' : 'sleep_icon.webp'}?v=${APP_VERSION}')` }">
          </div>
          <div v-show="gameData.sleep"
               class="absolute bottom-8 text-md text-white text-shadow-md text-shadow-black font-bold  ">
            <p>{{ sleepTimeRemaining }}</p>
          </div>
          <button class="text-md font-bold text-gray-600">
            {{ gameData.sleep ? $t('wake_up')  :  $t('sleep')  }}
          </button>

        </div>


          <!-- Кнопка Лаборатория -->
          <div
              @click="router.push('/laboratory');"
              class="bg-[#fff6ef] relative justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"

              style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);"
          >
            <div class="flex absolute top-1 right-2">

            </div>

            <div
                class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
                :style="{backgroundImage: `url('/gamePlay/laboratory_icon.webp?v=${APP_VERSION}')`}"
            ></div>
            <button class="text-xs font-bold text-gray-600 pointer-events-none">{{ $t('laboratory') }}</button>
          </div>



      </div>


      <!--  BATH -->

      <div v-show="location==='bath'" class="grid grid-cols-2 gap-8 relative  gap-y-1.5 w-65 place-self-center  ">

        <!-- ДУШ -->
        <div
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34"
            :class="[
                tutorialStep === 8 ? 'z-205 bg-white' : '',
                tutorialStep === 8 && !showerDrag.isDragging.value? 'animate-pulse' : ''
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

          <button class="absolute text-xs font-bold bottom-0 text-gray-600">{{ $t('shower') }}</button>

        </div>

        <!-- ШАМПУНЬ -->
        <div
            @click="nextBathItem()"
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34 cursor-pointer"
            :class="[
              tutorialStep === 7 && bathCartList.length > 0? 'z-205  bg-white' : '',
              tutorialStep === 7 && bathCartList.length > 0 && !foamDrag.isDragging.value ? 'animate-pulse ' : ''
              ]"
        >
          <div v-show="gameData.sick && !statusFoam && bathCartList.length > 0" class="absolute -left-2 pointer-events-none w-12  opacity-70 animate-pulse">
            <img :src="`/gamePlay/thermometer.webp?v=${APP_VERSION}`" alt="">
          </div>
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">

          <!-- 1. Если список банных принадлежностей пуст -->
          <template v-if="bathCartList.length === 0">
            <div
                class="flex flex-col items-center justify-center w-[70px] h-[70px] opacity-30 bg-contain bg-no-repeat bg-center"
                :class="currentDraggedItem === 'shower' && !statusFoam && showerCount === 0 ? 'animate-pulse' : ''"
                :style="{backgroundImage: `url('/Bath/shampoo_icon.webp?v=${APP_VERSION}')`}">
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
          <p v-show="bathCartList.length > 0" class="absolute top-0 left-2 text-amber-500">
            x{{ gameData.cart[bathCartList[currentBathIndex]?.id] || 0 }}
          </p>
          <!-- Текст названия / статуса -->
          <p class="absolute bottom-0 font-bold text-center text-gray-600 pointer-events-none break-words" :class="bathCartList[currentBathIndex]?.name.length<15?'text-[10px]':'text-[7px]'" >
            {{
              bathCartList.length > 0 && bathCartList[currentBathIndex]
                  ? $t(`items.${bathCartList[currentBathIndex].id}`)
                  : $t('empty_shelf')
            }}
          </p>
        </div>

        <div
            @click="location =  'home';"
            class="bg-[#fff6ef] justify-center h-25  flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            style="box-shadow: inset 0 -5px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-20 h-20 bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-lg font-bold text-gray-600 pointer-events-none">{{ $t('back') }}</button>
        </div>
        <div
            @click="isShopOpen = true;activeTab='bath'"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/market.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('shop') }}</button>
        </div>
      </div>

      <!-- FOOD -->


      <div v-show="location==='food'" class="grid grid-cols-2 gap-8 relative  gap-y-1.5 w-65 place-self-center " >

        <div
            @click="nextItem()"
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34 overflow-hidden"
            :class="[
              tutorialStep === 3 && foodCartList.length > 0 ? 'z-205 pointer-events-auto bg-white' : 'z-30',
              tutorialStep === 3 && foodCartList.length > 0 && !foodDrag.isDragging.value ? 'animate-pulse' : ''
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
                    !foodDrag.isDragging.value && foodCartList[currentIndex]?.id === 'health_serum' && gameData.sick ? 'animate-pulse' : '',
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
          <p v-show="foodCartList.length > 0" class="absolute top-0 left-2 text-amber-500">
            x{{ gameData.cart[foodCartList[currentIndex]?.id] || 0 }}
          </p>
          <!-- Текст названия / статуса с использованием foodCartList -->
          <p class="absolute bottom-0 font-bold text-gray-600 pointer-events-none " :class="foodCartList[currentIndex]?.name.length < 15?'text-[10px]':'text-[7px]'">
            {{
              foodCartList.length > 0 && foodCartList[currentIndex]
                  ? $t(`items.${foodCartList[currentIndex].id}`)
                  :  $t('fridge_empty')
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
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('shop') }}</button>
        </div>

        <div
            @click="location = 'home',nextTutorialStep()"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            :class=" tutorialStep === 5 ? 'z-205 animate-pulse' : ''"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-20 h-20 bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">{{ $t('back') }}</button>
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