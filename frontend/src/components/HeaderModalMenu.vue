<script setup>
import {expPercentage} from "@/scripts/level.js";
import DailyTasksModal from "@/components/DailyTasks.vue";
import i18n from "@/scripts/locales/i18n.js";
import {syncToBackend} from "@/scripts/api.js";
import {ref} from "vue";
import {gameData, showStatsModal} from "@/scripts/useGameStore.js";
import {hasAvailableRewards} from "@/scripts/dealyTasks.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
// 🎯 Делаем вкладку "Задания" первой по умолчанию
const activeTab = ref('stats');

// 🌐 Функция переключения языка
const changeLanguage = async (lang) => {
  i18n.global.locale.value = lang;
  localStorage.setItem('user_language', lang);
  if (gameData) {
    gameData.language = lang;
  }
  try {
    // await syncToBackend()
  } catch (error) {
    console.error(error);
  }

};

function formatFullNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('ru-RU');
}

</script>

<template>
  <!-- Модальное окно со скроллом и вкладками -->
  <Teleport to="body">
  <Transition name="fade">
    <div
        v-if="showStatsModal"
        class="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="showStatsModal = false"
    >
      <div
          class="bg-[#fff6ef] border-2 border-[#3399FF] rounded-3xl p-5 w-full max-w-xs h-130 shadow-2xl relative flex flex-col justify-between">

        <!-- Шапка: Переключатель вкладок + Кнопки смены языка -->
        <div class="flex flex-col gap-2 shrink-0">
          <div class="flex justify-end items-center px-1">
            <div class="flex gap-1">
              <button
                  @click="changeLanguage('en')"
                  class="px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all"
                  :class="$i18n.locale === 'en' ? 'bg-[#3399FF] text-white border-[#3399FF]' : 'bg-white/60 text-gray-600 border-gray-300'"
              >
                EN
              </button>
              <button
                  @click="changeLanguage('ru')"
                  class="px-2 py-0.5 text-[11px] font-bold rounded-lg border transition-all"
                  :class="$i18n.locale === 'ru' ? 'bg-[#3399FF] text-white border-[#3399FF]' : 'bg-white/60 text-gray-600 border-gray-300'"
              >
                RU
              </button>

            </div>
          </div>

          <!-- Переключатель вкладок -->
          <div class="flex bg-[#98E5FE]/60 p-1 rounded-2xl border border-[#3399FF]">
            <button
                @click="activeTab = 'stats'"
                class="flex-1 py-1.5 text-xs font-bold rounded-xl transition-all"
                :class="activeTab === 'stats' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'"
            >
                <span class="flex items-center justify-center gap-1">
                  <img src="/gamePlay/statistics.webp" class="w-6" alt="">
                  {{ $t(`intelligence`) }}
                </span>
            </button>
            <button
                @click="activeTab = 'tasks'"
                class="relative flex-1 py-1.5 text-xs font-bold rounded-xl transition-all"
                :class="activeTab === 'tasks' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'"
            >
                <span class="flex items-center justify-center gap-1">
                  <img src="/gamePlay/calendar.webp" class="w-6" alt="">
                  {{ $t(`tasks`) }}
                </span>

              <img v-if="hasAvailableRewards" src="/gamePlay/exclamation_mark.webp" alt="" class="w-8 top-0 left-0 absolute animate-pulse">
            </button>

          </div>
        </div>

        <!-- Центральный блок с контентом и скроллом -->
        <div class="flex-1 overflow-y-auto my-2 pr-1 custom-scroll">
          <!-- Вкладка "Задания" -->
          <div v-if="activeTab === 'tasks'">
            <DailyTasksModal/>
          </div>

          <!-- Вкладка "Сведения" -->
          <div v-else-if="activeTab === 'stats'" class="flex flex-col gap-2 text-sm mt-2">
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <span class="font-semibold text-gray-600">{{ $t(`level`) }}:</span>
              <span class="font-bold text-gray-800">{{ gameData.level }} ({{
                  $t(`exp`)
                }}: {{ Math.floor(gameData.exp) }}/{{ Number(gameData.level) * 100 }})</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/coin.webp?v=${APP_VERSION}`" alt="Монеты" width="18">
                <span class="font-semibold text-gray-600">{{ $t(`coins`) }}</span>
              </div>
              <span class="font-bold text-amber-600">{{ formatFullNumber(gameData.coins) }}</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/click_icon.webp?v=${APP_VERSION}`" alt="Клики" width="20">
                <span class="font-semibold text-gray-600">{{ $t(`total_clicks`) }}</span>
              </div>
              <span class="font-bold text-gray-800">{{ formatFullNumber(gameData.clickCounter) }}</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/a_pig_in_a_poke.webp?v=${APP_VERSION}`" alt="Смерти" width="20">
                <span class="font-semibold text-gray-600">{{ $t(`total_deaths`) }}:</span>
              </div>
              <span class="font-bold text-gray-800">{{ formatFullNumber(gameData.deathsCount) }}</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/hunger.webp?v=${APP_VERSION}`" alt="Сытость" width="18">
                <span class="font-semibold text-gray-600">{{ $t(`satiety`) }}</span>
              </div>
              <span class="font-bold text-gray-800">{{ Math.trunc(gameData.foodLevel) }}%</span>
            </div>

            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/energy.webp?v=${APP_VERSION}`" alt="Энергия" width="18">
                <span class="font-semibold text-gray-600">{{ $t(`energy`) }}</span>
              </div>
              <span class="font-bold text-gray-800">{{ Math.trunc(gameData.energy) }}%</span>
            </div>
            <div class="flex justify-between items-center bg-white/60 p-2.5 rounded-2xl border border-[#f7c9a5]/40">
              <div class="flex items-center gap-1.5">
                <img :src="`/gamePlay/play_icon.webp?v=${APP_VERSION}`" alt="Развлечения" width="18">
                <span class="font-semibold text-gray-600">{{ $t(`entertainment`) }}</span>
              </div>
              <span class="font-bold text-gray-800">{{ Math.trunc(gameData.funLevel) }}%</span>
            </div>
          </div>
        </div>

        <!-- Нижняя кнопка «Закрыть» -->
        <button
            @click="showStatsModal = false"
            class="w-full bg-[#98E5FE] hover:bg-[#f3b584] text-gray-800 font-bold py-2 rounded-2xl border border-[#3399FF] transition-colors active:scale-95 shrink-0"
        >
          {{ $t(`close`) }}
        </button>
      </div>
    </div>
  </Transition>
  </Teleport>
</template>

<style scoped>

</style>