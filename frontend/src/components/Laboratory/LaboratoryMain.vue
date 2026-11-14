<script setup>
import {onMounted, onUnmounted, ref} from "vue";
import {gameData} from "@/scripts/useGameStore.js";
import {
  ingredientDropZoneRef,
  activeIngredient,
  lastCrafted,
  lastCraftedQuantity
} from "@/scripts/laboratoryScripts/dragAndDrop.js"; // Импортируем activeSerums
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import {useRouter} from "vue-router";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import LaboratoryMenu from "@/components/Laboratory/LaboratoryMenu.vue";
import RecipeHints from "@/components/Laboratory/RecipeHints.vue";


const isLoading = ref(true);

// === Адаптивное масштабирование ===
const scale = ref(1)
const BASE_WIDTH = 320

function updateScale() {
  const vw = window.visualViewport?.width || window.innerWidth
  const available = vw - 12
  const raw = available / BASE_WIDTH
  scale.value = Math.min(Math.max(raw, 0.82), 1.28)
}

onMounted(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
    try { tg.expand() } catch (e) {}
  }

  updateScale()
  window.addEventListener('resize', updateScale)
  window.addEventListener('orientationchange', () => {
    setTimeout(updateScale, 150)
  })

  setTimeout(() => {
    isLoading.value = false;
  }, 800);



});

onUnmounted(() => {
  window.removeEventListener('resize', updateScale)
  window.removeEventListener('orientationchange', updateScale)
});

// Функция для удаления предмета из центра, если игрок передумал
const removeSerum = (index) => {
  const item = activeIngredient.value[index];
  if (item.count > 1) {
    item.count--; // Если на столе несколько таких, уменьшаем на 1
  } else {
    activeIngredient.value.splice(index, 1); // Если остался 1 — полностью убираем со стола
  }
};



</script>

<template>
  <div
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative flex flex-col', gameData.sleep ? 'bg-linear-to-r from-blue-900 via-blue-800 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']"
      style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);"
  >
    <Transition name="fade">
      <div
          v-if="isLoading"
          class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#ABD7DD] via-[#ABD7DD] to-blue-300 text-[#D18900]"
      >
        <div class="relative flex items-center justify-center mb-4">
          <!-- Пульсирующее свечение -->
          <div class="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-ping"></div>

          <!-- Анимированный логотип/иконка -->
          <div class="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-2xl animate-bounce">
            <div class="w-full h-full bg-[#FADCCC]  rounded-full flex items-center justify-center border border-amber-300/40">
              <img :src="`/gamePlay/logo_icons.webp?v=${APP_VERSION}`" class="w-10 h-10 object-contain drop-shadow-md" alt="Loading..." />
            </div>
          </div>
        </div>

        <!-- Текст загрузки -->
        <span class="text-[#D18900] font-extrabold tracking-widest text-sm uppercase drop-shadow-md animate-pulse">
          {{ $t('enter_the_laboratory') }}
        </span>

        <!-- Спиннер -->
        <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    </Transition>

    <PetHeaderMenu class="mb-1 shrink-0" />

    <!-- Масштабируемый блок (холст + меню) -->
    <div class="flex-1 flex flex-col items-center justify-start overflow-x-hidden px-1">
      <div
          class="overflow-hidden"
          :style="{
            width: (BASE_WIDTH * scale) + 'px',
            height: (540 * scale) + 'px'
          }"
      >
        <div
            class="origin-top-left"
            :style="{
              transform: `scale(${scale})`,
              width: BASE_WIDTH + 'px',

            }"
        >
          <!-- Лаборатория -->
          <div class="relative flex justify-center items-center w-full">
            <transition name="toast">
              <div
                  v-if="lastCrafted"
                  class="absolute bottom-20 left-1/2 h-30 -translate-x-1/2 z-200 bg-emerald-600/90 border border-emerald-400 text-white px-4 py-2 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-2 pointer-events-none"
              >
                <div class="bg-white/20 rounded-lg p-1 flex items-center justify-center shrink-0 relative">
                  <img :src="lastCrafted.image" class="w-15 h-15 object-contain">
                  <span class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                    x{{ lastCraftedQuantity }}
                  </span>
                </div>
                <div class="text-center">
                  <p class="text-[10px] text-white font-medium">{{ $t('successful_synthesis') }}</p>
                  <p class="text-xs text-amber-300 font-bold">
                    {{ $t(`serums.${lastCrafted.id}`) }}
                  </p>
                </div>
              </div>
            </transition>
            <RecipeHints />
            <div
                class="relative w-[300px] h-[270px] overflow-hidden rounded-3xl border-2 border-red-400/80 shadow-2xl flex items-center justify-center p-4"
                :class="gameData.sleep ? 'bg-[#0F175C]' : 'bg-[#98E5FE]'"
            >
              <!-- ФОН ЛАБОРАТОРИИ -->
              <div ref="ingredientDropZoneRef" class="absolute inset-0 z-0 flex justify-center items-center">
                <img :src="`/Laboratory/location/laboratory.webp?v=${APP_VERSION}`" alt="location laboratory" class="w-full h-full object-cover pointer-events-none"/>
              </div>

              <!-- ЗАКИНУТЫЕ ПРЕДМЕТЫ В ЦЕНТРЕ -->
              <div class="relative top-17 z-10 flex flex-wrap gap-2 justify-center items-center max-w-[250px]">
                <div
                    v-for="(item, index) in activeIngredient"
                    :key="item.id"
                    class="relative flex items-center justify-center cursor-pointer hover:scale-110 transition-transform "
                    @click="removeSerum(index)"
                    title="Нажми, чтобы убрать"
                >
                  <img :src="item.image" :alt="item.name" class="w-12 h-12 object-contain drop-shadow-lg" />
                  <span
                      v-if="item.count > 1"
                      class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md"
                  >
                    x{{ item.count }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- НИЖНЕЕ МЕНЮ -->
          <div class="">
            <LaboratoryMenu/>
          </div>
        </div> <!-- end transform scale -->
      </div> <!-- end size wrapper -->
    </div> <!-- end flex-1 -->

  </div>
</template>