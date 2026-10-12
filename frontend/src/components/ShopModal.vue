<script setup>

import {activeTab, gameData} from "@/scripts/useGameStore.js"
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {
  currentList,
  foodTab, getItemBonuses, getItemCost,
  getItemQuantity,
  handleItemClick,
  isEquipped,
  isItemLocked, isUnlocked, lastBought, lastBoughtQuantity,
  wardrobeTab
} from "@/scripts/shop.js";

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

defineEmits(['close'])

// Подкатегории для Гардероба: 'hats' или 'costumes'


</script>

<template>
  <div
      v-if="isOpen"
      class="fixed inset-0 z-300 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none"
  >
    <!-- Само окно магазина -->
    <div
        class="relative w-full max-w-md h-180 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

      <!-- Шапка модалки -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <div class="flex gap-1 items-center">
            <img :src="`/gamePlay/shoppingСart_icon.webp?v=${APP_VERSION}`" class="w-6 h-6" alt="">
            <p class="text-lg">Магазин</p>
          </div>
        </h2>

        <button
            @click="$emit('close')"
            class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Переключатель основных категорий -->
      <div
          class="flex overflow-x-auto justify-center no-scrollbar border-b border-slate-800 bg-slate-900/40 p-2 gap-2 shrink-0 touch-pan-x">
        <button
            @click="activeTab = 'food'"
            :class="['py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer', activeTab === 'food' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/food/burger.webp" alt="">
            <span class="whitespace-nowrap">Еда</span>
          </div>
        </button>

<!--        <button-->
<!--            @click="activeTab = 'laboratory'"-->
<!--            :class="['py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer', activeTab === 'shaman' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"-->
<!--        >-->
<!--          <div class="flex items-center justify-center gap-1.5">-->
<!--            <img class="w-5 h-5 object-contain shrink-0" src="/gamePlay/feather_icon.webp" alt="">-->
<!--            <span class="whitespace-nowrap">Шаман</span>-->
<!--          </div>-->
<!--        </button>-->

        <button
            @click="activeTab = 'bath'"
            :class="['py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer', activeTab === 'bath' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/Bath/shampoo_icon.webp" alt="">
            <span class="whitespace-nowrap">Баня</span>
          </div>
        </button>

        <button
            @click="activeTab = 'clothes'"
            :class="['py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer', activeTab === 'clothes' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/other/hanger_icon.webp" alt="">
            <span class="whitespace-nowrap">Гардероб</span>
          </div>
        </button>
      </div>

      <!-- Внутренние подкатегории ЕДЫ -->
      <div v-if="activeTab === 'food'"
           class="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-2 shrink-0 overflow-x-auto no-scrollbar">
        <button
            @click="foodTab = 'all'"
            :class="['flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap', foodTab === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white']"
        >
          Все
        </button>
        <button
            @click="foodTab = 'fastfood'"
            :class="['flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap', foodTab === 'fastfood' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/food/burger.webp" alt="">
            <span class="whitespace-nowrap">Фастфуд</span>
          </div>
        </button>
        <button
            @click="foodTab = 'fruits'"
            :class="['flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap', foodTab === 'fruits' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/food/banana.webp" alt="">
            <span class="whitespace-nowrap">Фрукты</span>
          </div>
        </button>
        <button
            @click="foodTab = 'sushi'"
            :class="['flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap', foodTab === 'sushi' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/food/ebi_nigiri.webp" alt="">
            <span class="whitespace-nowrap">Суши</span>
          </div>
        </button>
      </div>

      <!-- Внутренние подкатегории ГАРДЕРОБА -->
      <div v-if="activeTab === 'clothes'" class="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-2 shrink-0">
        <button
            @click="wardrobeTab = 'hats'"
            :class="['flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer', wardrobeTab === 'hats' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1">
            <img :src="`/headwear/piratehat.webp?v=${APP_VERSION}`" class="w-5" alt="">
            <p>Головные уборы</p>
          </div>
        </button>
        <button
            @click="wardrobeTab = 'costumes'"
            :class="['flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer', wardrobeTab === 'costumes' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1">
            <img :src="`/costumes/costume_icon.webp?v=${APP_VERSION}`" class="w-5" alt="">
            <p>Костюмы</p>
          </div>
        </button>
      </div>

      <!-- Список товаров -->
      <div class="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain touch-pan-y">
        <div
            v-for="item in currentList"
            :key="item.id"
            class="relative flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 hover:border-slate-600 transition-all overflow-hidden"
            :class="{'opacity-50 pointer-events-none': isItemLocked(item)}"
        >
          <!-- Плашка блокировки по уровню -->
          <div
              v-if="isItemLocked(item)"
              class="absolute inset-0 z-20 bg-slate-950/70 flex items-center justify-center rounded-xl"
          >
            <span class="text-amber-400 font-bold text-sm tracking-wide px-3 py-1">
              🔒 Требуется {{ item.level }} уровень
            </span>
          </div>

          <!-- Картинка и описание (Разрешен переносы строк, текст виден целиком) -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-15 h-15 shrink-0 bg-white/20 rounded-lg flex items-center justify-center  p-1 relative">
              <div class="flex">
                <img :src="item.image" :alt="item.name" class="w-full h-full  object-contain">
                <p v-show="getItemQuantity(item)>0" v-if="activeTab !== 'clothes'"
                   class="text-[11px] absolute left-1 top-0 font-bold text-amber-400 mt-0.5 break-words">
                  X {{ getItemQuantity(item) }}
                </p>

              </div>

            </div>

            <div class="">
              <h3 class="font-semibold text-xs text-white leading-tight break-words">{{ item.name }}</h3>

              <!-- Индикатор количества товара в наличии -->


              <!-- Бонусы предмета -->
              <div v-if="activeTab === 'food' || activeTab === 'laboratory' || activeTab === 'bath'"
                   class="text-xs mt-0.5 leading-tight break-words">
                <div
                    v-for="(bonus, index) in getItemBonuses(item)"
                    :key="index"
                    :class="bonus.color"
                >
                  {{ bonus.text }}
                </div>
              </div>
            </div>
          </div>

          <!-- Динамическая кнопка (shrink-0 строго держит её ширину и положение) -->
          <!-- Динамическая кнопка -->
          <button
              @click="handleItemClick(item)"
              :disabled="(activeTab !== 'clothes' && getItemQuantity(item) >= 10)"
              :class="[
      'px-4 py-2 w-20 font-bold rounded-lg text-xs transition-all active:scale-90 flex justify-center items-center gap-1.5 shrink-0 cursor-pointer self-center',
      activeTab === 'clothes' && isUnlocked(item.id)
        ? (isEquipped(item.id)
            ? 'bg-slate-700 text-slate-300 cursor-default'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20')
        : (activeTab !== 'clothes' && getItemQuantity(item) >= 10)
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
    ]"
          >
            <template v-if="activeTab === 'clothes' && isUnlocked(item.id)">
              {{ isEquipped(item.id) ? 'Снять' : 'Выбрать' }}
            </template>
            <template v-else-if="activeTab !== 'clothes' && getItemQuantity(item) >= 10">
              <span>Макс</span>
            </template>
            <template v-else>
              <span class="w-5 h-5 shrink-0 flex items-center justify-center">
                <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="coin" class="w-full h-full object-contain"/>
              </span>
              <span>{{ getItemCost(item) }}</span>
            </template>
          </button>
        </div>
      </div>

      <!-- Подвал модалки (баланс) -->
      <div class="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
        <span class="text-slate-400 text-sm">Баланс:</span>
        <span class="text-amber-400 font-bold text-lg flex items-center gap-1 tabular-nums">
          <img class="w-5" src="/gamePlay/coin.webp" alt=""> {{ gameData.coins }}
        </span>
      </div>

    </div>

    <!-- Всплывающее уведомление -->
    <transition name="toast">
      <div
          v-if="lastBought"
          class="absolute bottom-10 z-200 bg-emerald-600/70 border border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none"
      >
        <div class="w-10 h-10 bg-white/20 rounded-lg p-1 flex items-center justify-center shrink-0 relative">
          <img :src="lastBought.image" class="w-full h-full object-contain">
          <span v-if="lastBoughtQuantity > 1"
                class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            x{{ lastBoughtQuantity }}
          </span>
        </div>
        <div>
          <p class="text-xs text-white font-medium">Успешное приобретение!</p>
          <p class="text-sm text-amber-500 font-bold">
            {{ lastBought.name }}
          </p>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>