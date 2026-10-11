<script setup>
import IngredientItem from "@/components/Laboratory/ingredientItem.vue";
import { laboratoryIngredientsList } from "@/scripts/basket.js";
import { ingredientList } from "@/scripts/laboratoryScripts/ingredientItems.js";
import { getItemCost, handleItemClick, lastBought, lastBoughtQuantity } from "@/scripts/shop.js";
import { APP_VERSION } from "@/scripts/imageVersion.js";

// Функция возвращает данные купленного предмета (включая его количество в инвентаре)
const getPurchasedItem = (ingredientId) => {
  return laboratoryIngredientsList.value.find(item => item.id === ingredientId);
};
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
    <!-- Общая сетка по 2 элемента в ряд для ВСЕХ ингредиентов -->
    <div class="grid grid-cols-2 gap-2 w-70">
      <div
          v-for="item in ingredientList"
          :key="item.id"
          class="flex flex-col items-center justify-between h-[120px] bg-white/30 p-2 rounded-2xl border border-white/40 shadow-sm relative"
      >
        <p class="absolute inset-0 flex text-blue-800/75 items-center  justify-center text-center text-[11px] pointer-events-none">
          {{ item.name }}
        </p>
        <!-- Верхняя часть: если предмет куплен, показываем интерактивный drag-and-drop элемент -->
        <div v-if="getPurchasedItem(item.id)" class="w-full flex flex-col items-center relative">
          <IngredientItem :item="getPurchasedItem(item.id)" />

          <!-- Бейдж с количеством (например, x2, x3) -->
          <span class="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow">
            x{{ getPurchasedItem(item.id).count }}
          </span>

        </div>

        <!-- Если еще не куплен — показываем просто затемненную картинку -->
        <div v-else class="w-full flex flex-col items-center">
          <img
              :src="item.image"
              class="w-16 h-16 object-contain opacity-30 drop-shadow-md mb-2"
              :alt="item.name"
          />
        </div>

        <!-- Нижняя часть: Кнопка покупки всегда на месте -->
        <button
            @click="handleItemClick(item)"
            class="py-1.5 w-full font-bold rounded-lg text-xs transition-all bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95 flex justify-center items-center gap-1.5 cursor-pointer mt-auto"
        >
          <span class="w-4 h-4 shrink-0 flex items-center justify-center">
            <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="coin" class="w-full h-full object-contain"/>
          </span>
          <span>{{ getItemCost(item) }}</span>
        </button>
      </div>

    </div>

    <!-- Тост об успешной покупке -->
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
</template>