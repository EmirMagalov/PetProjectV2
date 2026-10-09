<script setup>
import SaloonMenu from "@/components/Saloon/SaloonMenu.vue";

import {onMounted, onUnmounted, ref, watch} from "vue";
import {blink, gameData} from "@/scripts/useGameStore.js";
import {
  dealerCards,
  dealerScore, deckRef,
  gameFinished,
  gameStarted,
  pupilOffset, randomCharacterImage,
  result
} from "@/scripts/saloonScripts/twentyOneGame.js";
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import {activeCoins, activeExp} from "@/scripts/actions.js";
import {useRouter} from "vue-router";
import {APP_VERSION} from "@/scripts/imageVersion.js";

// =====================================================
// СОСТОЯНИЕ ЗАГРУЗКИ (LOADER)
// =====================================================
const isLoading = ref(true);
const MIN_ENERGY_REQUIRED = 3;
const MIN_FOOD_REQUIRED = 3;

watch(gameFinished, (isFinished) => {
  if (isFinished) {
    const isOutOfEnergy = gameData.energy < MIN_ENERGY_REQUIRED;
    const isOutOfFood = gameData.foodLevel < MIN_FOOD_REQUIRED; // Проверьте имя свойства (foodLevel или food)

    if (isOutOfEnergy || isOutOfFood) {
      // Задержка 1.5 сек, чтобы игрок увидел результат партии и анимацию монет
      setTimeout(() => {
        if (isOutOfEnergy && isOutOfFood) {
          alert("У вас закончились и энергия, и сытость! Вы покинули салун.");
        } else if (isOutOfEnergy) {
          alert("У вас закончилась энергия! Вы покинули салун.");
        } else {
          alert("Персонаж слишком голоден для игры! Вы покинули салун.");
        }

        // Перенаправление на главную/другую локацию
        router.push('/');
      }, 800);
    }
  }
});

const router = useRouter();



// =====================================================
// АНИМАЦИЯ FLUFFY
// =====================================================
let blinkInterval = null;
let lookInterval = null;

function startRandomLooking() {
  lookInterval = setInterval(() => {
    const directions = [
      { x: 0, y: 0 },
      { x: -0.3, y: 0.5 },
      { x: 0, y: 0 },
      { x: 0, y: -1 }
    ];
    pupilOffset.value = directions[Math.floor(Math.random() * directions.length)];
  }, 2000);

  blinkInterval = setInterval(() => {
    blink.value = true;
    setTimeout(() => {
      blink.value = false;
    }, 150);
  }, 3500);
}

// =====================================================
// ССЫЛКИ ДЛЯ АНИМАЦИИ
// =====================================================
const dealerCardsZone = ref(null);

function animateFlyTo({ targetEl, isDealer = false }) {
  const target = targetEl || dealerCardsZone.value;
  if (!deckRef.value || !target) return;

  const startRect = deckRef.value.getBoundingClientRect();
  const endRect = target.getBoundingClientRect();

  const flyer = document.createElement("div");
  flyer.className =
      "fixed z-[999] w-[42px] h-[58px] rounded-md bg-red-800 border-2 border-amber-300 shadow-2xl pointer-events-none transition-all duration-500 ease-out flex items-center justify-center";

  flyer.innerHTML = `<span class="text-amber-200 text-sm font-bold"><img src="/gamePlay/logo_icons.webp?v=${APP_VERSION}" class="w-7 object-contain" alt="" /></span>`;

  flyer.style.left = `${startRect.left}px`;
  flyer.style.top = `${startRect.top}px`;

  document.body.appendChild(flyer);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flyer.style.left = `${endRect.left + endRect.width / 2 - 21}px`;
      flyer.style.top = `${endRect.top + endRect.height / 2 - 29}px`;
      flyer.style.transform = isDealer ? "scale(1.0) rotate(-5deg)" : "scale(1.2) rotate(10deg)";
    });
  });

  setTimeout(() => {
    if (flyer.parentNode) {
      flyer.parentNode.removeChild(flyer);
    }
  }, 500);
}

onMounted(() => {
  result.value = "Начнем игру?";
  startRandomLooking();

  // Имитируем загрузку на 1.8 секунды для плавности
  setTimeout(() => {
    isLoading.value = false;
  }, 800);
});

onUnmounted(() => {
  clearInterval(lookInterval);
  clearInterval(blinkInterval);
});
</script>

<template>
  <div
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative', gameData.sleep ? 'bg-linear-to-r from-blue-900 via-blue-800 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']">

  <!-- ПОЛНОЭКРАННЫЙ ЭКРАН ЗАГРУЗКИ (LOADER) -->
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
          Входим в Салун...
        </span>

        <!-- Спиннер -->
        <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    </Transition>

    <PetHeaderMenu/>

    <!-- САЛУН -->
    <div class="relative flex justify-center items-center w-full my-auto">
      <div class="relative w-[320px] h-[270px] overflow-hidden rounded-3xl border-2 border-red-400/80 shadow-2xl">
        <img
            :src="`/location/saloon.webp?v=${APP_VERSION}`"
            class="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
            alt="Saloon Background"
        />

        <!-- FLUFFY (ПЕРСОНАЖ) -->
        <div class="absolute inset-0 z-20 flex justify-center items-center cursor-pointer pointer-events-none">
          <img
              v-if="randomCharacterImage && randomCharacterImage.includes('.webp')"
              :src="randomCharacterImage"
              alt="Fluffy Body"
              class="absolute"
          />
          <img :src="`/saloonPhotos/location/saloon.webp?v=${APP_VERSION}`" alt="location saloon" class="object-contain"/>

          <div class="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div
                class="absolute inset-0 flex justify-center items-center transition-transform duration-300 ease-out"
                :style="{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }"
            >
              <img :src="`/saloonPhotos/characters/pupils_left.webp?v=${APP_VERSION}`" class="absolute" alt=""/>
              <img :src="`/saloonPhotos/characters/pupils_right.webp?v=${APP_VERSION}`" class="absolute" alt=""/>
            </div>
          </div>
        </div>

        <!-- ИГРОВОЙ ИНТЕРФЕЙС ДИЛЕРА -->
        <div class="absolute inset-x-0 top-0 z-30 p-2.5 flex flex-col items-center gap-1.5 pointer-events-auto">
          <span
              class="text-[11px] font-semibold text-amber-200 bg-black/80 px-2.5 py-0.5 rounded-full shadow-sm">
            Дилер<template v-if="gameFinished"> · {{ dealerScore }}</template>
          </span>

          <!-- КОЛОДА КАРТ -->
          <div class="absolute top-28 left-3 flex flex-col items-center gap-2">
            <div>
              <p class="text-white font-bold text-[11px]  bg-black/80 px-2.5 py-0.5 rounded-full shadow-sm">
                21 Очко
              </p>
            </div>

            <div ref="deckRef" class="relative w-[42px] h-[58px]">
              <div
                  class="absolute inset-0 translate-x-[4px] translate-y-[4px] rounded-md bg-red-950 border border-black/50 shadow-md"></div>
              <div
                  class="absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-md bg-red-900 border border-amber-300/60 shadow-md"></div>
              <div
                  class="absolute inset-0 rounded-md bg-red-800 border-2 border-amber-300 shadow-lg overflow-hidden flex items-center justify-center">
                <div class="absolute inset-[3px] rounded-[4px] border border-amber-200/80"></div>
                <span class="relative z-10 text-amber-200 text-[16px] font-bold drop-shadow-md">
                  <img :src="`/gamePlay/logo_icons.webp?v=${APP_VERSION}`" class="w-7 object-contain" alt=""/>
                </span>
              </div>
            </div>
            <p class="text-white font-bold text-[8px]  bg-black/80 px-2.5 py-0.5 rounded-full shadow-sm">
              36 карт
            </p>
          </div>

          <!-- КАРТЫ ДИЛЕРА -->
          <div v-if="gameStarted" ref="dealerCardsZone"
               class="absolute top-33 flex items-center justify-center min-h-[58px] mt-0.5">
            <div
                v-for="(card, index) in dealerCards"
                :key="index"
                class="w-[42px] h-[58px] -ml-5 first:ml-0 transition-all duration-300"
            >
              <img
                  v-if="gameFinished"
                  :src="card.image"
                  :alt="`${card.name} of ${card.suit}`"
                  loading="eager"
                  decoding="sync"
                  class="w-full h-full object-contain drop-shadow-md"
              />
              <div
                  v-else
                  class="w-full h-full rounded-md bg-red-800 border-2 border-amber-300 shadow-md flex items-center justify-center relative overflow-hidden"
              >
                <div class="absolute inset-[2px] rounded-[3px] border border-amber-200/60"></div>
                <span class="text-amber-200 text-xs font-bold shadow-sm">?</span>
              </div>
            </div>
          </div>

          <!-- РЕЗУЛЬТАТ МАТЧА -->
          <div
              v-if="result"
              class="mt-1 bg-black/85 backdrop-blur-md text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce z-40"
          >
            {{ result }}
          </div>
        </div>
      </div>
    </div>

    <!-- НИЖНЕЕ МЕНЮ -->
    <div class="mt-auto pb-4 shrink-0">
      <SaloonMenu @animate-draw="animateFlyTo"/>
    </div>
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-50 flex items-center justify-center">
      <template v-for="group in activeCoins" :key="group.id">
        <img
            v-for="coin in group.coins"
            :key="coin.id"
            :style="{
                      animationDelay: `${coin.delay}s`
                    }"
            :src="`/gamePlay/coin.webp?v=${APP_VERSION}`"
            class="absolute w-5  animate-coinFly pointer-events-none"
            alt=""
        />
      </template>
    </div>
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-50 flex items-center justify-center">
      <template v-for="group in activeExp" :key="group.id">
        <img
            v-for="exp in group.exp"
            :key="exp.id"
            :style="{
                  animationDelay: `${exp.delay}s`
                }"
            :src="`/gamePlay/exp.webp?v=${APP_VERSION}`"
            class="absolute w-6 animate-expFly pointer-events-none"
            alt=""
        />
      </template>
    </div>
  </div>
</template>

<style scoped>

@keyframes coinFly {
  0% {
    /* Старт: маленький и прозрачный в центре */
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    /* Появление: увеличивается и слегка поднимается */
    transform: translate(100px, -130px) scale(1.2);
    opacity: 1;
  }
  100% {
    /* Финал: улетает вверх к шапке (регулируйте -300px .. -450px под ваш экран) */
    transform: translate(150px, -380px) scale(0.3);
    opacity: 0;
  }
}

.animate-coinFly {
  animation: coinFly 0.8s cubic-bezier(0.25, 1, 0.5, 1) both;
  will-change: transform, opacity;
  pointer-events: none;
}


@keyframes coinExp {
  0% {
    /* Старт: маленький и прозрачный в центре */
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    /* Появление: увеличивается и слегка поднимается */
    transform: translate(100px, -130px) scale(1.2);
    opacity: 1;
  }
  100% {
    /* Финал: улетает вверх к шапке (регулируйте -300px .. -450px под ваш экран) */
    transform: translate(150px, -380px) scale(0.3);
    opacity: 0;
  }
}

.animate-expFly {
  animation: coinExp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  will-change: transform, opacity;
  pointer-events: none;
}


/* Анимация исчезновения лоадера */
.fade-leave-active {
  transition: opacity 0.4s ease-in-out;
}
.fade-leave-to {
  opacity: 0;
}
</style>