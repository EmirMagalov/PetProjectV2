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
  statusFoam, location, isGameOver, handleRestart
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
</script>

<template>
  <!--  HOME -->
  <ShopModal
      :is-open="isShopOpen"
      @close="isShopOpen = false"
  />

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
      <div v-show="location==='home'" class="grid grid-cols-2 gap-x-4  gap-y-1.5 w-60 place-self-center  ">
        <div
            @click="location = 'food'"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col  items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95"
            :class="showHunger?'animate-pulse':''"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center cursor-pointer"
               style="background-image: url('/gamePlay/fridge.webp')">
          </div>
          <button class="text-md font-bold text-gray-600">Кормить</button>
        </div>
        <div
            @click="location = 'bath'"
            class="bg-[#fff6ef] justify-center flex flex-col h-25   items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"
               style="background-image: url('/gamePlay/bath_icon.webp')">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">Мыть</button>
        </div>
        <div
            @click="goSleep()"

            :class="['bg-[#fff6ef] relative justify-center h-25  flex flex-col  items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95',showHunger?'opacity-50':'']"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">

          <div class="w-[60px] h-[60px] bg-contain bg-no-repeat bg-center"
               :style="{ 'background-image': `url('${gameData.sleep ? '/gamePlay/sun_icon.webp' : '/gamePlay/sleep_icon.webp'}')` }">
          </div>
          <div v-show="gameData.sleep"
               class="absolute bottom-8 text-md text-white text-shadow-md text-shadow-black font-bold  ">
            <p>{{ sleepTimeRemaining }}</p>
          </div>
          <button class="text-md font-bold text-gray-600">
            {{ gameData.sleep ? 'Проснуться' : 'Спать' }}
          </button>

        </div>
        <div
            @click="isShopOpen = true"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
               style="background-image: url('/gamePlay/market.webp')">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">Магазин</button>
        </div>
      </div>

      <!--  BATH -->

      <div v-show="location==='bath'" class="grid grid-cols-2 gap-x-4 gap-y-1.5 w-60 place-self-center">

        <!-- ДУШ -->
        <div
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34"
        >
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">
          <div v-show="!feedStatus"
               ref="showerEl"
               :style="[
               showerDrag.isDragging.value ? showerDrag.style.value : {},
               {
                   'touch-action': 'none',
                   'background-image': 'url(\'/gamePlay/shower_icon.webp\')'
               }
             ]"
               :class="[
               showerDrag.isDragging.value ? 'fixed z-150' : 'relative',
               statusFoam && !showerDrag.isDragging.value ? 'animate-pulse' : ''
             ]"
               class="flex flex-col items-center cursor-move w-[70px] h-[70px]  bg-contain bg-no-repeat bg-center"
          ></div>
          <div v-show="showerDrag.isDragging.value || feedStatus"
               style="background-image: url('/gamePlay/shower_icon.webp')"
               class="w-[70px] h-[70px] opacity-30 bg-contain">

          </div>
          <!--          <img v-show="showerDrag.isDragging.value || feedStatus" src="/gamePlay/shower_icon.webp" class="opacity-30"-->
          <!--               width="70"-->
          <!--               alt="">-->
          <button class="text-xs font-bold text-gray-600">Душ</button>
        </div>

        <!-- ШАМПУНЬ -->
        <div
            @click="nextBathItem()"
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34 cursor-pointer"
        >
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">

          <!-- 1. Если список банных принадлежностей пуст -->
          <template v-if="bathCartList.length === 0">
            <div
                class="flex flex-col items-center justify-center w-[70px] h-[70px] opacity-30 bg-contain bg-no-repeat bg-center"
                style="background-image: url('/gamePlay/shampoo_icon.webp')">
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
                       'background-image': `url('${bathCartList[currentBathIndex]?.image}')`
                   }
                 ]"
                 :class="[
                   foamDrag.isDragging.value ? 'fixed z-150 pointer-events-none' : 'relative',
                   currentDraggedItem === 'shower' && !statusFoam && showerCount === 0 ? 'animate-pulse' : ''
                 ]"
                 class="flex flex-col items-center cursor-move w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
            ></div>

            <div v-show="foamDrag.isDragging.value || feedStatus"
                 :style="{ 'background-image': `url('${bathCartList[currentBathIndex]?.image}')` }"
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
               style="background-image: url('/gamePlay/back_icon.webp')">
          </div>
          <button class="text-lg font-bold text-gray-600 pointer-events-none">Назад</button>
        </div>
      </div>

      <!-- FOOD -->

      <!-- FOOD -->

      <div v-show="location==='food'" class="grid grid-cols-2 gap-x-4 gap-y-1.5 w-60 place-self-center">

        <div
            @click="nextItem()"
            class="border-gray-300 h-25 justify-center flex flex-col relative items-center p-2 rounded-3xl border-2 bg-[#f7c9a5]/34"

        >
          <img class="absolute top-0 right-3" src="/signs/two_lines.svg" width="20" alt="">

          <!-- 1. Если холодильник пуст: используем foodCartList вместо cartItemsList -->
          <template v-if="foodCartList.length === 0">
            <div
                class="flex flex-col items-center justify-center w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"
                style="background-image: url('/gamePlay/fridge_empty.webp')">
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
                     'background-image': `url('${foodCartList[currentIndex]?.image}')`
                   }
                 ]"
                 :class="[
                   (foodDrag.isDragging.value && !foodConsumedByPipe) ? 'fixed z-150 pointer-events-none' : 'relative',
                 ]"
                 class="flex flex-col items-center cursor-move w-[80px] h-[80px] bg-contain bg-no-repeat bg-center"
            ></div>

            <img v-show="(foodDrag.isDragging.value || feedStatus) && !foodConsumedByPipe"
                 :src="foodCartList[currentIndex]?.image"
                 class="opacity-30 relative"
                 width="80"
                 alt="">
          </template>

          <!-- Текст названия / статуса с использованием foodCartList -->
          <p class="text-xs absolute bottom-1 font-bold text-gray-600 pointer-events-none whitespace-nowrap">
            {{
              foodCartList.length > 0 && foodCartList[currentIndex]
                  ? `${foodCartList[currentIndex].name} x${gameData.cart[foodCartList[currentIndex]?.id]}`
                  : 'Холодильник пуст'
            }}
          </p>

        </div>

        <div
            @click="isShopOpen = true"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-[70px] h-[70px] bg-contain bg-no-repeat bg-center"
               style="background-image: url('/gamePlay/market.webp')">
          </div>
          <button class="text-md font-bold text-gray-600 pointer-events-none">Магазин</button>
        </div>

        <div
            @click="location = 'home'"
            class="bg-[#fff6ef] justify-center h-25 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
            style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
          <div class="w-20 h-20 bg-contain bg-no-repeat bg-center"
               style="background-image: url('/gamePlay/back_icon.webp')">
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