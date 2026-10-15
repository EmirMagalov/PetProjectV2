<script setup>
import IngredientItem from "@/components/Laboratory/ingredientItem.vue";
import { laboratoryIngredientsList } from "@/scripts/basket.js";
import { ingredientList } from "@/scripts/laboratoryScripts/ingredientItems.js";
import { getItemCost, handleItemClick, lastBought, lastBoughtQuantity } from "@/scripts/shop.js";
import { APP_VERSION } from "@/scripts/imageVersion.js";
import { getAvailableIngredientCount, getTotalIngredientCount } from "../../scripts/laboratoryScripts/dragAndDrop.js";
import {gameData} from "@/scripts/useGameStore.js";
import {ref} from "vue";
import {serumRecipes} from "@/scripts/laboratoryScripts/recipes.js";
const showRecipeModal = ref(false);
const getPurchasedItem = (ingredientId) => {
  return laboratoryIngredientsList.value.find(item => item.id === ingredientId);
};

function getIngredient(id) {
  return ingredientList.find(i => i.id === id)
}

</script>

<template>
  <div class="rounded-4xl p-3 mx-5 bg-blue-200 min-h-[260px] mt-1 border-2 border-[#f7c9a5] relative flex flex-col items-center">
    <RouterLink to="/" class="z-30">
      <div
          class="bg-[#fff6ef] absolute -left-6 top-1/2 -translate-y-1/2 h-15 w-10 flex flex-col items-center justify-center p-0.5 rounded-l-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer z-30"
          style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);"
      >
        <div
            class="w-10 h-10 bg-contain bg-no-repeat bg-center"
            :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"
        ></div>
        <span class="text-xs font-bold text-gray-600 pointer-events-none"></span>
      </div>
    </RouterLink>



    <div @click="showRecipeModal=true" class="absolute -top-5 -right-2 w-8 rounded-full bg-white p-1 border border-[#f7c9a5] ">
      <img src="/gamePlay/question_mark.webp" alt="">
    </div>



    <div class="grid grid-cols-2 gap-2 w-70">
      <div
          v-for="item in ingredientList"
          :key="item.id"
          class="flex flex-col items-center justify-between h-[120px] bg-white/30 p-2 rounded-2xl border border-white/40 shadow-sm relative"
      >
        <p class="absolute inset-0 flex text-blue-800/75 items-center  justify-center text-center text-[11px] pointer-events-none">
          {{ item.name }}
        </p>

        <div v-if="getPurchasedItem(item.id)" class="w-full flex flex-col items-center relative">
          <IngredientItem :item="getPurchasedItem(item.id)" />

          <span class="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow">
            x{{ getAvailableIngredientCount(item.id) }}
          </span>
        </div>

        <div v-else class="w-full flex flex-col items-center">
          <img
              :src="item.image"
              class="w-16 h-16 object-contain opacity-30 drop-shadow-md mb-2"
              :alt="item.name"
          />
        </div>

        <!-- Кнопка покупки проверяет общую сумму (инвентарь + стол) -->
        <button
            @click="handleItemClick(item)"
            :disabled="getTotalIngredientCount(item.id) >= 10"
            :class="[
              'py-1.5 w-full font-bold rounded-lg text-xs transition-all shadow-md flex justify-center items-center gap-1.5 mt-auto',
              getTotalIngredientCount(item.id) >= 10
                ? 'bg-slate-400 text-slate-700 cursor-not-allowed shadow-none'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 cursor-pointer'
            ]"
        >
          <template v-if="getTotalIngredientCount(item.id) >= 10">
            <span>Макс</span>
          </template>
          <template v-else>
            <span class="w-4 h-4 shrink-0 flex items-center justify-center">
              <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="coin" class="w-full h-full object-contain"/>
            </span>
            <span>{{ getItemCost(item) }}</span>
          </template>
        </button>
      </div>

    </div>

    <transition name="toast">
      <div
          v-if="lastBought"
          class="absolute top-0 z-200 bg-emerald-600/90 border border-emerald-400 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none"
      >
        <div class="w-8 h-8 bg-white/20 rounded-lg p-1 flex items-center justify-center shrink-0 relative">
          <img :src="lastBought.image" class="w-full h-full object-contain">
          <span v-if="lastBoughtQuantity > 1"
                class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            x{{ lastBoughtQuantity }}
          </span>
        </div>
        <div>
          <p class="text-[10px] text-white font-medium">Успешное приобретение!</p>
          <p class="text-xs text-amber-300 font-bold">
            {{ lastBought.name }}
          </p>
        </div>
      </div>
    </transition>
  </div>

  <div
      v-if="showRecipeModal"

      class="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="showRecipeModal = false"
  >
    <div  class="bg-[#CCFFFF] border-2 border-[#99FFFF] rounded-3xl p-5 w-full max-w-xs shadow-2xl relative flex flex-col gap-3">

      <h3 class="text-lg font-bold text-center text-gray-800">Синтез</h3>

      <div class="flex flex-col  gap-2 text-sm">
        <div v-for="serum in serumRecipes" :key="serum.id" class="flex justify-between items-center bg-white/60 p-2 rounded-2xl border border-[#f7c9a5]/40">

          <div class="flex flex-col gap-2 items-center w-full">
            <p class="text-sm">{{ serum.name }}</p>

            <!-- Общий контейнер со стабильным gap и выравниванием по центру -->
            <div class="flex items-center gap-2 ">

              <!-- Цикл по ингредиентам -->
              <template v-for="(quantity, receptId, index) in serum.requirements" :key="receptId">

                <!-- Карточка ингредиента -->
                <div class="relative flex items-center ">
                  <span class="absolute -top-2 -left-2 bg-slate-900/80 text-xs px-1 rounded font-bold text-amber-400 z-10">
                    x{{ quantity }}
                  </span>
                  <img class="w-12 h-12 object-contain bg-emerald-300/50 rounded-lg p-0.5" :src="getIngredient(receptId)?.image" alt="">
                </div>

                <!-- Плюс между ингредиентами (рендерится, если это НЕ последний элемент) -->
                <div v-if="index < Object.keys(serum.requirements).length - 1" class="text-xl font-bold text-slate-400">
                  +
                </div>

              </template>

              <!-- Знак равенства перед результатом -->
              <div class="text-xl font-bold text-slate-400">
                =
              </div>

              <!-- Итоговая сыворотка -->
              <img :src="serum.image" class="w-12 h-12 object-contain bg-emerald-300/50 rounded-lg p-0.5" alt="">

            </div>
          </div>


        </div>


      </div>

      <button
          @click="showRecipeModal = false"
          class="mt-1 bg-[#99FFCC]  text-gray-800 font-bold py-2 rounded-2xl border border-[#99FFFF] transition-colors active:scale-95"
      >
        Закрыть
      </button>
    </div>
  </div>

</template>