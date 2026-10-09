<script setup>
import {foodList} from '@/scripts/objectItems.js'
import {headItems} from '@/scripts/headwearItems.js'
import {costumeItems} from '@/scripts/costumeItems.js'
import {ref, computed} from 'vue'
import {addToCart, buyCostume, buyHeadwear} from "@/scripts/basket.js"
import {activeTab, gameData} from "@/scripts/useGameStore.js"
import {APP_VERSION} from "@/scripts/imageVersion.js";

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

defineEmits(['close'])

// Подкатегории для Гардероба: 'hats' или 'costumes'
const wardrobeTab = ref('hats')

// Подкатегории для Еды: 'all', 'fastfood', 'fruits', 'sushi'
const foodTab = ref('all')

// Динамический список товаров в зависимости от выбранной вкладки и подкатегории
const currentList = computed(() => {
  if (activeTab.value === 'food') {
    const list = foodList.filter(item => item.category === 'food')
    if (foodTab.value === 'all') return list
    return list.filter(item => item.subcategory === foodTab.value)
  } else if (activeTab.value === 'shaman') {
    return foodList.filter(item => item.category === 'shaman')
  } else if (activeTab.value === 'bath') {
    return foodList.filter(item => item.category === 'bath accessories')
  } else {
    // Активен Гардероб
    if (wardrobeTab.value === 'costumes') {
      return costumeItems.map(item => ({
        ...item,
        image: item.preview || item.image_normal
      }))
    }
    return headItems
  }
})

const lastBought = ref(null)
const lastBoughtQuantity = ref(1)
let notificationTimer = null

// Функция определения количества товара в инвентаре
function getItemQuantity(item) {
  if (activeTab.value === 'food' || activeTab.value === 'shaman' || activeTab.value === 'bath') {
    return gameData.cart?.[item.id] || 0
  }
  return 0
}

// Универсальная проверка блокировки товара по уровню
function isItemLocked(item) {
  if (Boolean(item.level) && gameData.level < item.level) {
    return true
  }

  if (activeTab.value === 'clothes') {
    const isUnlockedItem = wardrobeTab.value === 'costumes'
        ? gameData.unlockedCostumes?.includes(item.id)
        : gameData.unlockedHeads?.includes(item.id)

    if (!isUnlockedItem && Boolean(item.level) && gameData.level < item.level) {
      return true
    }
  }

  return false
}

// Проверка надета ли одежда/шляпа
function isEquipped(itemId) {
  if (wardrobeTab.value === 'costumes') {
    return gameData.equippedCostume === itemId
  }
  return gameData.equippedHead === itemId
}

// Проверка куплен ли предмет
function isUnlocked(itemId) {
  if (wardrobeTab.value === 'costumes') {
    return gameData.unlockedCostumes?.includes(itemId)
  }
  return gameData.unlockedHeads?.includes(itemId)
}

// Универсальная логика клика по кнопке товара
function handleItemClick(item) {
  if (isItemLocked(item)) return

  // Получаем динамическую цену предметов
  const itemCost = getItemCost(item)

  if (activeTab.value === 'food' || activeTab.value === 'shaman' || activeTab.value === 'bath') {
    if (gameData.coins >= itemCost) {
      gameData.coins -= itemCost // 👈 Списываем с учетом уровня
      addToCart(item.id)

      const currentQty = gameData.cart[item.id] || 1
      showNotification(item, currentQty)
    } else {
      alert("Не хватает монет!")
    }
  } else {
    if (isUnlocked(item.id)) {
      if (wardrobeTab.value === 'costumes') {
        selectCostume(item.id)
      } else {
        selectHeadwear(item.id)
      }
    } else {
      if (gameData.coins >= itemCost) {
        gameData.coins -= itemCost // 👈 Списываем с учетом уровня

        if (wardrobeTab.value === 'costumes') {
          if (!gameData.unlockedCostumes) gameData.unlockedCostumes = []
          buyCostume(item.id)
        } else {
          buyHeadwear(item.id)
        }

        showNotification(item, 1)
      } else {
        alert("Не хватает монет!")
      }
    }
  }
}

function selectHeadwear(headId) {
  if (gameData.equippedHead === headId) {
    gameData.equippedHead = null
  } else {
    gameData.equippedHead = headId
  }
}

function selectCostume(costumeId) {
  if (gameData.equippedCostume === costumeId) {
    gameData.equippedCostume = null
  } else {
    gameData.equippedCostume = costumeId
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

  if (item.foodGain) bonuses.push({text: `+ ${item.foodGain} сытости`, color: 'text-amber-400'})
  if (item.energyGain) bonuses.push({text: `+ ${item.energyGain} энергии`, color: 'text-blue-400'})
  if (item.life) bonuses.push({text: `+ ${item.life} жизнь`, color: 'text-red-400'})
  if (item.health) bonuses.push({text: `Восстановление здоровья`, color: 'text-emerald-400'})
  if (item.subcategory === 'fruits') bonuses.push({text: `+ здоровье`, color: 'text-green-400'})
  return bonuses
}

function getItemCost(item) {
  if (!item) return 0
  const baseCost = item.baseCost ?? item.cost ?? 0

  // Повышаем цену на (level * 2) ТОЛЬКО для товаров категории 'food'
  if (item.category === 'food') {
    const rawLevel = gameData.level || 1

    // Ограничиваем уровень максимумом в 50
    const effectiveLevel = Math.min(rawLevel, 50)

    return baseCost + (effectiveLevel)
  }

  // Для всех остальных предметов возвращаем исходную цену
  return baseCost
}

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
          class="flex overflow-x-auto no-scrollbar border-b border-slate-800 bg-slate-900/40 p-2 gap-2 shrink-0 touch-pan-x">
        <button
            @click="activeTab = 'food'"
            :class="['py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer', activeTab === 'food' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/food/burger.webp" alt="">
            <span class="whitespace-nowrap">Еда</span>
          </div>
        </button>

        <button
            @click="activeTab = 'shaman'"
            :class="['py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer', activeTab === 'shaman' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/gamePlay/feather_icon.webp" alt="">
            <span class="whitespace-nowrap">Шаман</span>
          </div>
        </button>

        <button
            @click="activeTab = 'bath'"
            :class="['py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer', activeTab === 'bath' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white']"
        >
          <div class="flex items-center justify-center gap-1.5">
            <img class="w-5 h-5 object-contain shrink-0" src="/gamePlay/soap_icon.webp" alt="">
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
            <div class="w-15 h-15 shrink-0 bg-white/20 rounded-lg flex items-center justify-center p-1 relative">
              <div class="flex">
                <img :src="item.image" :alt="item.name" class="w-full h-full object-contain">
                <p v-show="getItemQuantity(item)>0" v-if="activeTab !== 'clothes'"
                   class="text-[11px] absolute left-1 top-0 font-bold text-amber-400 mt-0.5 break-words">
                  X {{ getItemQuantity(item) }}
                </p>

              </div>

            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-xs text-white leading-tight break-words">{{ item.name }}</h3>

              <!-- Индикатор количества товара в наличии -->


              <!-- Бонусы предмета -->
              <div v-if="activeTab === 'food' || activeTab === 'shaman' || activeTab === 'bath'"
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
          <button
              @click="handleItemClick(item)"
              :class="[
      'px-4 py-2 w-20 font-bold rounded-lg text-xs transition-all active:scale-90 flex justify-center items-center gap-1.5 shrink-0 cursor-pointer self-center',
      activeTab === 'clothes' && isUnlocked(item.id)
        ? (isEquipped(item.id)
            ? 'bg-slate-700 text-slate-300 cursor-default'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20')
        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
    ]"
          >
            <template v-if="activeTab === 'clothes' && isUnlocked(item.id)">
              {{ isEquipped(item.id) ? 'Снять' : 'Выбрать' }}
            </template>
            <template v-else>
    <span class="w-5 h-5 shrink-0 flex items-center justify-center">
      <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="coin" class="w-full h-full object-contain"/>
    </span>
              <!-- ⬇️ Выводим динамическую цену -->
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