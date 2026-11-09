<script setup>
import PetMenu from "@/components/PetMenu.vue";
import PetFoam from "@/components/PetFoam.vue";
import PetShower from "@/components/PetShower.vue";
import {ref, onMounted, onUnmounted, watch, computed} from "vue"
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import CloudMessage from "@/components/CloudMessage.vue";
import PetStinky from "@/components/PetStinky.vue";
import PetHeadwear from "@/components/PetHeadwear.vue";
import Status from "@/components/Status.vue";
import {showerDrag, statusSmoke} from "@/scripts/dragAndDrop.js";
import PetSmoke from "@/components/PetSmoke.vue";
import {initGameData} from "@/scripts/api.js";
import Poop from "@/components/Poop.vue";
import Nameplate from "@/components/Nameplate.vue";
import PetSideMenu from "@/components/PetSideMenu.vue";
import TutorialOverlay from "@/components/TutorialOverlay.vue";
import i18n from "@/scripts/locales/i18n.js";

import {
  mouth,
  lowEnergy,
  isVibrating, isBadMood, gameData, blink, statusShower, statusFoam,
  location, dropZoneRef, tutorialStep, isPopping, bodyType, activeStatus, colorFoam, isTutorialCompleted, resetLocal,
  characterPath, showStatus, FatPlayCount
} from "@/scripts/useGameStore.js";
import {
  activeCoins, activeExp, addCoin, comboClicks,
  comboMultiplier, handleMultiTouch,
  isComboAnimating, isUserLooking, pupilOffset, resetEyeLook,
  sunAnimating, updateEyeLook
} from "@/scripts/actions.js";
import PetClothes from "@/components/PetClothes.vue";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import FortuneWheel from "@/components/FortuneWheel.vue";
import SunAndMoon from "@/components/Decorations/SunAndMoon.vue";
import Clouds from "@/components/Decorations/Clouds.vue";
import CoinsAndXP from "@/components/Decorations/CoinsAndXP.vue";
import Rain from "@/components/Decorations/Rain.vue";
import {addToCart} from "@/scripts/basket.js";
import {addExp} from "@/scripts/level.js";

let blinkInterval = null
let lookInterval = null
let isDragging = false
let vibrateTimer = null
const isFlips = ref(false)
const isEggShaking = ref(false)
const isLoading = ref(true);
function getHornAsset(level) {
  if (level >= 50) return `${characterPath.value}/horns/50lvl.webp?v=${APP_VERSION}`
  if (level >= 45) return `${characterPath.value}/horns/45lvl.webp?v=${APP_VERSION}`
  if (level >= 40) return `${characterPath.value}/horns/40lvl.webp?v=${APP_VERSION}`
  if (level >= 35) return `${characterPath.value}/horns/35lvl.webp?v=${APP_VERSION}`
  if (level >= 30) return `${characterPath.value}/horns/30lvl.webp?v=${APP_VERSION}`
  if (level >= 25) return `${characterPath.value}/horns/25lvl.webp?v=${APP_VERSION}`
  if (level >= 20) return `${characterPath.value}/horns/20lvl.webp?v=${APP_VERSION}`
  if (level >= 15) return `${characterPath.value}/horns/15lvl.webp?v=${APP_VERSION}`
  if (level >= 10) return `${characterPath.value}/horns/10lvl.webp?v=${APP_VERSION}`
  if (level >= 5) return `${characterPath.value}/horns/5lvl.webp?v=${APP_VERSION}`
  return `${characterPath.value}/horns/1lvl.webp?v=${APP_VERSION}`
}

function getEggsAsset() {
  if (gameData.exp >= 80) return `/character/egg_pahse_five.webp?v=${APP_VERSION}`
  if (gameData.exp >= 60) return `/character/egg_pahse_four.webp?v=${APP_VERSION}`
  if (gameData.exp >= 40) return `/character/egg_pahse_three.webp?v=${APP_VERSION}`
  if (gameData.exp >= 20) return `/character/egg_pahse_two.webp?v=${APP_VERSION}`
  return `/character/egg_pahse_one.webp?v=${APP_VERSION}`
}

function getCombo() {
  if (comboMultiplier.value >= 5) return `/gamePlay/x5_combo_icons.webp?v=${APP_VERSION}`
  if (comboMultiplier.value >= 3) return `/gamePlay/x3_combo_icons.webp?v=${APP_VERSION}`
  if (comboMultiplier.value >= 2) return `/gamePlay/x2_combo_icons.webp?v=${APP_VERSION}`
  return `/gamePlay/x1_combo_icons.webp?v=${APP_VERSION}`
}

watch(location, (newLocation) => {
  if (newLocation === 'home') {
    // if (statusFoam) {
    //   statusFoam.value = false;
    // }
    // locationUrl.value = `/location/home.webp?v=${APP_VERSION}`

  } else if (newLocation === 'bath') {
    // locationUrl.value = `/location/bath.webp?v=${APP_VERSION}`
    gameData.sleep = false
  }
})

function triggerPop() {
  isPopping.value = true

  setTimeout(() => {
    isPopping.value = false

  }, 200)
}

function handlePointerDown(event) {
  isDragging = true
  handleMultiTouch(event)
  updateEyeLook(event)
}

function handlePointerMove(event) {
  if (isDragging || event.buttons > 0) {
    updateEyeLook(event)
  }
}

function handlePointerEnd() {
  isDragging = false
  resetEyeLook(800)
}

function startRandomLooking() {
  lookInterval = setInterval(() => {
    if (isUserLooking.value || isDragging) return

    const directions = [
      {x: 0, y: 0},
      {x: -2, y: -2},
      {x: 2, y: -2},
      {x: -2, y: 2},
      {x: 2, y: 2},
      {x: 0, y: -2}
    ]
    const randomDir = directions[Math.floor(Math.random() * directions.length)]
    pupilOffset.value = randomDir
  }, 2500)

  blinkInterval = setInterval(() => {
    blink.value = true
    setTimeout(() => {
      blink.value = false
    }, 150)
  }, 3500)
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    initGameData()
  }
}

const currentTime = ref('');

function updateClock() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

let clockInterval = null;


function handleEggClick() {
  // Начисляем опыт за один клик
  addExp(0.4)
  // Если сальто уже играет, игнорируем повторный клик
  if (isFlips.value || isEggShaking.value) return

  // Случайный выбор: сальто (25%) или короткая тряска (75%)
  const randomChance = Math.random()
  if (randomChance < 0.25) {
    isFlips.value = true
    setTimeout(() => {
      isFlips.value = false
    }, 750) // Длительность сальто строго по таймеру анимации
  } else {
    isEggShaking.value = true

    // Короткая тряска длится 0.4 секунды и сама выключается
    setTimeout(() => {
      isEggShaking.value = false
    }, 400)
  }
}

let comboHideTimer = null
let comboTimer = null
function handleCharacterClick() {
  isVibrating.value = true
  if (comboHideTimer) clearTimeout(comboHideTimer)
  if (vibrateTimer) clearTimeout(vibrateTimer)
  if (comboTimer) clearTimeout(comboTimer)

  vibrateTimer = setTimeout(() => {
    isVibrating.value = false
  }, 400)
  triggerPop()
  isComboAnimating.value = true
  if (gameData.level > 1) {
    comboClicks.value++
  }
  comboHideTimer = setTimeout(() => {
    isComboAnimating.value = false
  }, 800)
  comboTimer = setTimeout(() => {
    comboClicks.value = 0
    comboMultiplier.value = 1
  }, 900)

}


onMounted(async () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
  }
  setTimeout(() => {
    isLoading.value = false;
  }, 800);
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && (urlLang === 'ru' || urlLang === 'en')) {
    // Устанавливаем язык из URL
    i18n.global.locale.value = urlLang;
    localStorage.setItem('user_language', urlLang);
  } else {
    // Иначе берем из localStorage или дефолтный 'en'
    const savedLang = localStorage.getItem('user_language') || 'en';
    i18n.global.locale.value = savedLang;
  }
  // localStorage.removeItem('pet_nextSpinAt')
  document.addEventListener('visibilitychange', handleVisibilityChange)

  location.value = 'home'

  startRandomLooking()
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  if (!isTutorialCompleted.value) {
    // Если уровень уже 2-й (или выше, но обучение еще не завершено)
    if (gameData.level > 2) {
      tutorialStep.value = 0 // Исправлено: работаем через .value
      localStorage.setItem('tutorial_completed', 'true')
      gameData.tutorialCompleted = true
    }
    if (gameData.level === 2) {
      tutorialStep.value = 2;
      gameData.cart = []
      gameData.foodLevel = 50
      gameData.energy = 50
      gameData.exp = 0
      addToCart('burger');
      addToCart('shampoo');
    }
    // Если игрок совсем новый (1 уровень) — сбрасываем локал и даем стартовые вещи
    else if (gameData.level < 2) {
      await resetLocal();
      gameData.level = 1;
      tutorialStep.value = 1;
      addToCart('burger');
      addToCart('shampoo');
    }
  }
  if (localStorage.getItem('pending_level_up') === 'true') {
    localStorage.removeItem('pending_level_up');
    // Небольшая задержка, чтобы компонент успел смонтироваться и очередь статусов отработала корректно
    showStatus('levelUp');
  }
})

onUnmounted(() => {
  clearInterval(lookInterval)
  clearInterval(blinkInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (clockInterval) clearInterval(clockInterval);
})
const pumpkinAnimating = ref(false)

const pumpkinAnimation = (event) => {
  if (pumpkinAnimating.value) return

  // Находим игровой холст, чтобы считать координаты относительно него
  const gameCanvas = document.querySelector('.w-\\[320px\\]') || event.currentTarget;
  const rect = gameCanvas.getBoundingClientRect();

  // Получаем координаты с учетом touch или mouse события
  const touch = (event.touches && event.touches.length > 0)
      ? event.touches[0]
      : (event.changedTouches && event.changedTouches.length > 0)
          ? event.changedTouches[0]
          : event;

  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  // Передаем точные локальные координаты в addCoin
  addCoin(5, x, y);

  pumpkinAnimating.value = true
  setTimeout(() => {
    pumpkinAnimating.value = false
  }, 200)
}


</script>

<template>
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
          {{ $t('home_loading') }}
        </span>

      <!-- Спиннер -->
      <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
    </div>
  </Transition>
  <div
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative', gameData.sleep ? 'bg-linear-to-r from-blue-900 via-blue-800 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']">

    <PetHeaderMenu class="mb-1"/>

    <!-- Холст -->
    <div class="relative flex justify-center w-full">

      <div :class="[
  'relative w-[320px] h-[270px] border-2 border-red-400 overflow-hidden rounded-2xl object-cover duration-1000',
   gameData.sleep ? 'bg-[#0F175C]' : isBadMood?'bg-gray-400':'bg-[#98E5FE]',
]">


        <SunAndMoon/>
        <Clouds/>
        <rain/>

        <!-- Фон локации -->
        <div class="absolute inset-0  pointer-events-none transition-all duration-1000 ease-in-out "
             :class="gameData.sleep ? 'brightness-30' : 'brightness-100'">
          <div v-show="location==='home' || location === 'food'">

            <img

                :src="`/location/home.webp?v=${APP_VERSION}`"
                fetchpriority="high"
                decoding="sync"
                class="w-[320px] h-[270px] relative z-5"

            />

            <img :src="`/location/${gameData.season}.webp?v=${APP_VERSION}`" id="season-bg" alt="Season background"
                 class="absolute top-0 z-0 w-[320px] h-[270px]">
          </div>

          <img
              v-show="location==='bath'"
              :src="`/location/bath.webp?v=${APP_VERSION}`"
              fetchpriority="high"
              decoding="sync"
              class="w-[320px] h-[270px] "

          />

        </div>


        <div
            v-if="location==='home'|| location === 'food'"
            class="absolute right-12 top-23.5 text-[10px] leading-none text-red-600 font-bold pointer-events-none scale-60 origin-right transition-all duration-500"
            :class="{ 'drop-shadow-[0_0_6px_rgba(239,68,68,0.9)] text-red-500 brightness-125': gameData.sleep }"
        >
          {{ currentTime }}
        </div>


        <div class="relative flex items-center justify-center p-12">
          <!-- Ореол света ночника -->
          <div v-show="gameData.sleep" class="absolute top-12 right-10 z-20 flex items-center justify-center">
            <div class="absolute top-12 -right-18 w-52 h-56 blur-lg -rotate-30 opacity-85 pointer-events-none">
              <div
                  class="w-full h-full bg-[conic-gradient(from_150deg_at_90%_0%,rgba(253,224,71,0.6)_0deg,rgba(251,191,36,0.1)_180deg,transparent_180deg)]"></div>
            </div>
            <div class="absolute w-23 h-20 -top-5 blur-xl -right-10 bg-amber-300/30 pointer-events-none"></div>
            <div
                class="relative z-10 w-5 h-5 top-2 left-3.5 bg-yellow-100 rounded-full rotate-12 blur-[3px] opacity-25 shadow-[0_0_20px_#fde047]"></div>
            <div
                class="relative z-10 w-4 h-1 top-5 -left-1 bg-yellow-300 brightness-130 rounded-full blur-[3px] shadow-[0_0_20px_#fde047]"></div>
          </div>
        </div>


        <!-- 🎃 ТЫКВА с замедленным и плавным ночным переходом (3 секунды) -->
        <div
            @click.stop="pumpkinAnimation($event)"
            class="absolute left-2 z-30 bottom-15 w-20 cursor-pointer pointer-events-auto transition-transform duration-300"
            :class="{ 'scale-108': pumpkinAnimating }"
            v-if="location==='home'|| location === 'food'"
        >
          <!-- Ореол света (плавно появляется через opacity за 3 секунды) -->
          <div
              class="absolute inset-0 pointer-events-none flex items-center justify-center z-[-1]"
              style="transition: opacity 1s ease-in-out;"
              :class="gameData.sleep ? 'opacity-100' : 'opacity-0'"
          >
            <!-- Основной мягкий размытый свет -->
            <div class="absolute -inset-6 bg-amber-400/40 blur-xl rounded-full pointer-events-none"></div>
            <!-- Яркое ядро свечения за тыквой -->
            <div class="absolute w-12 h-12 bg-yellow-200/20 blur-md rounded-full pointer-events-none"></div>
          </div>

          <!-- Дневная тыква (держит размеры контейнера, плавно исчезает) -->
          <img
              src="/other/halloween_pumpkin.webp"
              alt="Pumpkin"
              class="w-full h-auto block filter"
              style="transition: opacity 0s ease-in-out, filter 0s ease-in-out;"
              :class="gameData.sleep ? 'opacity-0 brightness-50' : 'opacity-100 brightness-100'"
          >

          <!-- Ночная тыква (накладывается поверх, плавно проявляется) -->
          <img
              src="/other/halloween_pumpkin_darkness.webp"
              alt="Pumpkin Dark"
              class="absolute inset-0 w-full h-auto filter"
              style="transition: opacity 0s ease-in-out, filter 0s ease-in-out;"
              :class="gameData.sleep ? 'opacity-100 brightness-80 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]' : 'opacity-0 brightness-100'"
          >
        </div>


        <CloudMessage/>

        <!-- Монетки / Опыт -->
        <CoinsAndXP v-if="gameData.level>1"/>
        <Status
            :class="[1,3,4,7, 8].includes(tutorialStep)? 'z-210' : ''"
            v-if="activeStatus.show"
            :status="true"
            :text="activeStatus.text"
            :image="activeStatus.image"
            :additional="activeStatus.additional"
            :energyAdditional="activeStatus.energyAdditional"
            :energy-image="activeStatus.energyImage"
            :bg-color="activeStatus.bgColor"
            class="pointer-events-auto"
        />
        <!-- Зона персонажа (исправлены классы transition и синтаксис :class) -->
        <div ref="dropZoneRef"
             @pointerdown="handlePointerDown($event)"
             @pointermove="handlePointerMove($event)"
             @pointerup="handlePointerEnd"
             @pointercancel="handlePointerEnd"
             @pointerleave="handlePointerEnd"
             class="absolute inset-0 flex justify-center items-center cursor-pointer touch-none select-none transition-[filter,transform] duration-1000 ease-in-out"
             :class="[
               gameData.sleep ? 'brightness-30' : 'brightness-100',[1,2,3,4, 7, 8].includes(tutorialStep) ? ' z-205 ' : ''

             ]"
        >

          <div v-show="gameData.sleep"
               class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
            <div class="absolute text-[#00BFFF] font-extrabold text-xl z-1 drop-shadow-md">Z</div>
            <div class="absolute  text-[#00BFFF] font-bold text-sm z-2 left-4 -top-3 drop-shadow-md">z</div>
          </div>

          <!-- Табличка с именем -->
          <Nameplate/>

          <!-- Персонаж (исходный контейнер w-45 h-45, ничего не сжимается) -->
          <div v-if="gameData.level>1" class="absolute flex justify-center items-center w-45 h-45 pointer-events-none"
               :class="[isPopping ? 'animate-pop' : '']">

            <!-- 🎯 Точечная кликабельная зона поверх персонажа (размер w-24 h-24, клик работает строго по центру) -->
            <div
                @pointerdown="handleCharacterClick"
                class="absolute z-30 w-20 h-20  top-25 cursor-pointer pointer-events-auto"
            ></div>

            <PetHeadwear/>
            <PetClothes/>
            <div class="absolute w-45 h-45 pointer-events-none">
              <!-- Худое тело -->
              <img
                  :src="`${characterPath}/skinny_body.webp?v=${APP_VERSION}`"
                  alt="skinny body"
                  class="absolute inset-0 w-full h-full object-contain body-fade"
                  :class="bodyType === 'skinny' ? 'opacity-100' : 'opacity-0'"
              />

              <!-- Нормальное тело -->
              <img
                  :src="`${characterPath}/main_body.webp?v=${APP_VERSION}`"
                  alt="normal body"
                  class="absolute inset-0 w-full h-full object-contain body-fade"
                  :class="bodyType === 'normal' ? 'opacity-100' : 'opacity-0'"
              />

              <!-- Толстое тело -->
              <img
                  :src="`${characterPath}/fat_body.webp?v=${APP_VERSION}`"
                  alt="fat body"
                  class="absolute inset-0 w-full h-full object-contain body-fade"
                  :class="bodyType === 'fat' ? 'opacity-100' : 'opacity-0'"
              />
            </div>
            <img v-show="gameData.old_1_phase" :src="`${characterPath}/wrinkles_1_phase.webp?v=${APP_VERSION}`"
                 class="absolute w-45 z-5 pointer-events-none" alt="">
            <img v-show="gameData.old_2_phase" :src="`${characterPath}/wrinkles_2_phase.webp?v=${APP_VERSION}`"
                 class="absolute w-45 z-5 pointer-events-none" alt="">

            <img :src="getHornAsset(gameData.level)" class="absolute  w-45 pointer-events-none" alt="">
            <img v-show="gameData.sick" :src="`${characterPath}/drunk.webp?v=${APP_VERSION}`"
                 class="absolute z-6 w-45 pointer-events-none" alt="">
            <img v-show="gameData.sick && bodyType==='fat'" :src="`${characterPath}/sick_fat.webp?v=${APP_VERSION}`"
                 class="absolute w-45 z-10 pointer-events-none" alt="">
            <img v-show="gameData.sick && bodyType!=='fat'" :src="`${characterPath}/sick.webp?v=${APP_VERSION}`"
                 class="absolute w-45 z-10 pointer-events-none" alt="">

            <div v-if="!blink && !gameData.sleep && !isVibrating" class="pointer-events-none">
              <div v-show="lowEnergy" class="absolute inset-0 flex justify-center items-center z-10">
                <img :src="`${characterPath}/bags_left.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
                <img :src="`${characterPath}/bags_right.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
              </div>

              <div class="absolute inset-0 flex justify-center items-center pointer-events-none">
                <img :src="`${characterPath}/eye_left.webp?v=${APP_VERSION}`" class="absolute w-45" alt="">
                <img :src="`${characterPath}/eye_right.webp?v=${APP_VERSION}`" class="absolute w-45" alt="">
              </div>

              <!-- Зрачки -->
              <div class="absolute inset-0 flex justify-center items-center pointer-events-none">
                <div
                    class="absolute inset-0 flex justify-center items-center pupils-look"
                    :style="{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }"
                >
                  <img :src="`${characterPath}/eye_pupils_left.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
                  <img :src="`${characterPath}/eye_pupils_right.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
                </div>
              </div>
            </div>
            <img v-else-if="isVibrating" :src="`${characterPath}/eye_close.webp?v=${APP_VERSION}`"
                 class="absolute w-45 pointer-events-none" alt="">
            <img v-else-if="!isVibrating" :src="`${characterPath}/eye_close.webp?v=${APP_VERSION}`"
                 class="absolute w-45 pointer-events-none" alt="">
            <img :src="mouth" :class="isVibrating ? 'animate-vibrate' : ''" class="absolute w-45 pointer-events-none"
                 alt="">
          </div>
          <!-- Яйцо: сальто всегда доигрывает до конца, тряска останавливается при отпускании -->
          <div
              v-else
              @click="handleEggClick"

              class="absolute flex justify-center items-center bottom-10 w-22 h-22 cursor-pointer transition-transform select-none touch-none"
              :class="[
                isFlips ? 'animate-pet-jump-flip' : '',
                isEggShaking ? 'animate-cs-egg' : '',

              ]"
          >
            <img :src="getEggsAsset()" alt="Egg" class="pointer-events-none">
          </div>
          <!-- Оверлеи и элементы поверх персонажа -->
          <div class="absolute inset-0 w-full h-full pointer-events-none">
            <Transition name="combo-fade">
              <img
                  v-if="isComboAnimating"
                  :src="getCombo()"
                  class="absolute brightness-130 text-2xl right-30 top-30 select-none z-50 animate-float-combo pointer-events-none"
                  :class="{
                    'w-14': comboMultiplier >= 1,
                    'w-15': comboMultiplier >= 2,
                    'w-17': comboMultiplier >= 3,
                    'w-19': comboMultiplier >= 5,
                    'z-205': tutorialStep === 4 || tutorialStep === 7 || tutorialStep === 8
                  }"
                  alt="">
            </Transition>


            <PetStinky/>
            <PetFoam :status-foam="statusFoam" :status-shower="statusShower" :bg-color="colorFoam"/>
            <PetSmoke :status-smoke="statusSmoke"/>
            <PetShower :status-shower="statusShower" :x="showerDrag.x.value" :y="showerDrag.y.value"/>

            <Poop
                v-show="gameData.isPooped && (location==='home' || location==='food')"
                class="pointer-events-auto"
            />
          </div>
        </div>
      </div>
      <PetSideMenu/>
    </div>

    <!-- Меню -->
    <div class="mt-auto pb-4 shrink-0">
      <PetMenu/>
    </div>


  </div>
  <TutorialOverlay/>
  <FortuneWheel/>
</template>

<style scoped>


.body-fade {
  /* Менять время плавно здесь: например 1000ms, 3000ms, 5000ms */
  transition: opacity 50ms ease-in-out !important;
  will-change: opacity;
}

.fade-sun-enter-active,
.fade-sun-leave-active {
  transition: opacity 1s ease;
}

.fade-sun-enter-from,
.fade-sun-leave-to {
  opacity: 0;
  transform: scale(1);
}

@keyframes moonFlash {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 0.45;
  }
  45% {
    opacity: 0.45;
  }
  100% {
    opacity: 0;
  }
}

.animate-moonFlash {
  animation: moonFlash 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

@keyframes floatCombo {
  0% {
    transform: translate(70px, -70px) scale(1) rotate(15deg);
  }
  25% {
    transform: translate(70px, -70px) scale(1) rotate(-15deg);
  }
  50% {
    transform: translate(70px, -70px) scale(1) rotate(15deg);
  }
  75% {
    transform: translate(70px, -70px) scale(1) rotate(-15deg);
  }
  100% {
    transform: translate(70px, -70px) scale(1) rotate(15deg);
  }
}

.animate-float-combo {
  animation: floatCombo 0.5s ease-in-out infinite;
}

.combo-fade-enter-active,
.combo-fade-leave-active {
  transition: opacity 1s ease, transform 0.5s ease;
}

.combo-fade-enter-from,
.combo-fade-leave-to {
  opacity: 0;
  transform: scale(0.6) translateY(10px);
}


@keyframes popCharacter {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-pop {
  animation: popCharacter 0.2s ease-out;
}

@keyframes vibrate {
  0% {
    transform: translate(1px, 1px);
  }
  50% {
    transform: translate(-0.1px, -0.1px);
  }
  100% {
    transform: translate(-0.1px, 0.1px);
  }
}

.animate-vibrate {
  animation: vibrate 0.50s linear infinite;
  display: inline-block;
}

.pupils-look {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}


@keyframes sleep-breath {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.03) translateY(2px);
  }
}

@keyframes float-z {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.6) rotate(-10deg);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(25px, -35px) scale(1.2) rotate(10deg);
  }
}

.animate-sleep {
  animation: sleep-breath 3s ease-in-out infinite;
}

.z-1 {
  animation: float-z 2.5s ease-in-out infinite;
}

.z-2 {
  animation: float-z 2.5s ease-in-out infinite;
  animation-delay: 1.2s;
  font-size: 0.8rem;
}


@keyframes quickPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05); /* Легкий быстрый толчок вверх */
  }
}

.animate-quick-pulse {
  animation: quickPulse 0.6s ease-in-out infinite; /* В 2 раза быстрее стандартного pulse */
}


/* Анимация прыжка с сальто в воздухе */
@keyframes petJumpFlip {
  0% {
    transform: translateY(0) scale(1, 1) rotate(0deg);
  }
  20% {
    /* Легкое приседание перед прыжком (сжатие) */
    transform: translateY(5px) scale(1.1, 0.9) rotate(0deg);
  }
  40% {
    /* Взлет вверх и вытягивание в полете */
    transform: translateY(-45px) scale(0.95, 1.05) rotate(180deg);
  }
  60% {
    /* Пик полета (оборот) */
    transform: translateY(-60px) scale(1, 1) rotate(270deg);
  }

  100% {
    /* Мягкое приземление с легким упругим эффектом */
    transform: translateY(0) scale(1, 1) rotate(360deg);
  }
}

.animate-pet-jump-flip {
  /* Плавный математический bezier-график для мягкого старта и торможения */
  animation: petJumpFlip 0.75s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  will-change: transform;
}

/* Дерганье как яйцо в CS2 (ускоряющаяся тряска с наклонами) */
@keyframes csEggShake {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(-10px, 0) rotate(-12deg);
  }
  /* Сильнее влево */
  50% {
    transform: translate(0, 0) rotate(0deg);
  }
  /* Возврат в центр */
  75% {
    transform: translate(10px, 0) rotate(12deg);
  }
  /* Сильнее вправо */
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

.animate-cs-egg {
  animation: csEggShake 0.35s ease-in-out infinite;
  transform-origin: center center;
}


</style>