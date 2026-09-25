<script setup>
import {foodList} from '@/scripts/objectItems.js'
import {headItems} from '@/scripts/headwearItems.js'
import {ref, computed} from 'vue'
import {addToCart, buyHeadwear} from "@/scripts/basket.js"
import {gameData} from "@/scripts/useGameStore.js"

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

defineEmits(['close'])

const activeTab = ref('food')

// Динамический список товаров в зависимости от выбранной вкладки
const currentList = computed(() => {
  if (activeTab.value === 'food') {
    return foodList.filter(item => item.category !== 'shaman' && item.category !== 'bath accessories')
  } else if (activeTab.value === 'shaman') {
    return foodList.filter(item => item.category === 'shaman')
  } else if (activeTab.value === 'bath') {
    return foodList.filter(item => item.category === 'bath accessories')
  } else {
    return headItems
  }
})

const lastBought = ref(null)
const lastBoughtQuantity = ref(1)
let notificationTimer = null

// Универсальная логика клика по кнопке товара
function handleItemClick(item) {
  if (activeTab.value === 'food' || activeTab.value === 'shaman' || activeTab.value === 'bath') {
    if (gameData.coins >= item.cost) {
      gameData.coins -= item.cost
      addToCart(item.id)

      // Получаем актуальное количество товара в корзине
      const currentQty = gameData.cart[item.id] || 1
      showNotification(item, currentQty)
    } else {
      alert("Не хватает монет!")
    }
  } else {
    // Логика для одежды
    if (gameData.unlockedHeads?.includes(item.id)) {
      selectHeadwear(item.id)
    } else {
      if (gameData.coins >= item.cost) {
        gameData.coins -= item.cost
        buyHeadwear(item.id)
        showNotification(item, 1)
      } else {
        alert("Не хватает монет!")
      }
    }
  }
}

// Функция надевания/снимания шапки
function selectHeadwear(headId) {
  if (gameData.equippedHead === headId) {
    gameData.equippedHead = null
  } else {
    gameData.equippedHead = headId
  }
}

function showNotification(item, quantity = 1) {
  lastBought.value = item
  lastBoughtQuantity.value = quantity
  if (notificationTimer) clearTimeout(notificationTimer)
  notificationTimer = setTimeout(() => {
    lastBought.value = null
  }, 2500)
}

const getItemBonuses = (item) => {
  const bonuses = []
  if (item.foodGain) bonuses.push(`+ ${item.foodGain} сытости`)
  if (item.energyGain) bonuses.push(`+ ${item.energyGain} энергии`)
  if (item.life) bonuses.push(`+ ${item.life} жизнь`)
  if (item.health) bonuses.push(`Востановление здоровья`)
  return bonuses
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-150 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

    <!-- Само окно магазина -->
    <div
        class="relative w-full max-w-md h-180 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

      <!-- Шапка модалки -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <h2 class="text-xl font-bold text-white flex items-center gap-2">
          <div class="flex gap-1 items-center">
            <img src="/gamePlay/shoppingСart_icon.webp" class="w-6 h-6" alt="">
            <p class="text-lg">Магазин</p>
          </div>
        </h2>

        <button
            @click="$emit('close')"
            class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      <!-- Переключатель категорий -->
      <div class="grid grid-cols-4 border-b border-slate-800 bg-slate-900/40 p-2 gap-1.5">
        <button
            @click="activeTab = 'food'"
            :class="['py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all truncate', activeTab === 'food' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1">
            <img class="w-5 h-5 object-contain" src="/food/burger.webp" alt="">
            <span>Еда</span>
          </div>
        </button>
        <button
            @click="activeTab = 'shaman'"
            :class="['py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all truncate', activeTab === 'shaman' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1">
            <img class="w-5 h-5 object-contain" src="/gamePlay/feather_icon.webp" alt="">
            <span>Шаман</span>
          </div>
        </button>
        <button
            @click="activeTab = 'bath'"
            :class="['py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all truncate', activeTab === 'bath' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1">
            <img class="w-5 h-5 object-contain" src="/gamePlay/soap_icon.webp" alt="">
            <span>Баня</span>
          </div>
        </button>
        <button
            @click="activeTab = 'clothes'"
            :class="['py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all truncate', activeTab === 'clothes' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1">
            <img class="w-5 h-5 object-contain" src="/headwear/cowboyhat.webp" alt="">
            <span>Гардероб</span>
          </div>
        </button>
      </div>

      <!-- Список товаров -->
      <div class="p-6 overflow-y-auto space-y-4 flex-1">
        <div
            v-for="item in currentList"
            :key="item.id"
            class="relative flex items-center justify-between bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 hover:border-slate-600 transition-all"
            :class="{'opacity-50 pointer-events-none': activeTab === 'shaman' && gameData.level < 5}"
        >
          <div v-if="activeTab === 'shaman' && gameData.level < 5"
               class="absolute inset-0 z-20 bg-slate-950/70 flex items-center justify-center">
            <span class="text-amber-400 font-bold text-sm tracking-wide px-3 py-1">
              🔒 Требуется 5 уровень
            </span>
          </div>

          <!-- Картинка и описание -->
          <div class="flex items-center gap-3">
            <div class="w-15 h-15 shrink-0 bg-white/20 rounded-lg flex items-center justify-center p-1">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-contain">
            </div>
            <div>
              <h3 class="font-semibold text-sm text-white">{{ item.name }}</h3>
              <p v-if="activeTab === 'food' || activeTab === 'shaman' || activeTab === 'bath'" class="text-xs text-emerald-400">
                <template v-for="(bonus, index) in getItemBonuses(item)" :key="index">
                  {{ bonus }}<br v-if="index < getItemBonuses(item).length - 1">
                </template>
              </p>
            </div>
          </div>

          <!-- Динамическая кнопка: Покупка или Выбор -->
          <button
              @click="handleItemClick(item)"
              :class="[
                'px-4 py-2 min-w-23 font-bold rounded-lg text-sm transition-all active:scale-90 flex justify-center items-center gap-1.5 shrink-0',
                activeTab === 'clothes' && gameData.unlockedHeads?.includes(item.id)
                  ? (gameData.equippedHead === item.id
                      ? 'bg-slate-700 text-slate-300 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20')
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
              ]"
          >
            <template v-if="activeTab === 'clothes' && gameData.unlockedHeads?.includes(item.id)">
              {{ gameData.equippedHead === item.id ? 'Снять' : 'Выбрать' }}
            </template>
            <template v-else>
              <span class="w-5"><img src="/gamePlay/coin.webp" alt=""></span> {{ item.cost }}
            </template>
          </button>
        </div>
      </div>

      <!-- Подвал модалки (баланс) -->
      <div class="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
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
          class="absolute bottom-10 z-200 bg-emerald-600/90 border border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3"
      >
        <div class="w-8 h-8 bg-white/20 rounded-lg p-1 flex items-center justify-center shrink-0 relative">
          <img :src="lastBought.image" class="w-full h-full object-contain">
          <!-- Бейдж количества -->
          <span v-if="lastBoughtQuantity > 1" class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            x{{ lastBoughtQuantity }}
          </span>
        </div>
        <div>
          <p class="text-xs text-emerald-200 font-medium">Успешное приобретение!</p>
          <p class="text-sm font-bold">
            {{ lastBought.name }} <span v-if="lastBoughtQuantity > 1" class="text-amber-300 font-normal"></span>
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