<script setup>
import PetMenu from "@/components/PetMenu.vue";
import PetFoam from "@/components/PetFoam.vue";
import PetShower from "@/components/PetShower.vue";
import {ref, onMounted, onUnmounted, watch, computed} from "vue"
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import PetStinky from "@/components/PetStinky.vue";
import Status from "@/components/Status.vue";
import {initGameData} from "@/scripts/api.js";
import Poop from "@/components/Poop.vue";
import Nameplate from "@/components/Nameplate.vue";
import PetSideMenu from "@/components/PetSideMenu.vue";
import TutorialOverlay from "@/components/TutorialOverlay.vue";
import i18n from "@/scripts/locales/i18n.js";

import {
  isBadMood, gameData, blink, statusShower, statusFoam,
  location, tutorialStep, activeStatus, colorFoam, isTutorialCompleted,
  showStatus,scale, isShopOpen
} from "@/scripts/useGameStore.js";
import {
  addCoin, comboClicks,
  comboMultiplier, handleMultiTouch,
  isComboAnimating, isUserLooking, pupilOffset, resetEyeLook,
  updateEyeLook
} from "@/scripts/actions.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import FortuneWheel from "@/components/FortuneWheel.vue";
import SunAndMoon from "@/components/Decorations/SunAndMoon.vue";
import Clouds from "@/components/Decorations/Clouds.vue";
import CoinsAndXP from "@/components/Decorations/CoinsAndXP.vue";
import Rain from "@/components/Decorations/Rain.vue";
import {addToCart} from "@/scripts/basket.js";
import {showerX, showerY} from "@/scripts/dragAndDrop.js";
import PetActivity from "@/components/PetActivity.vue";
import BouncingBall from "@/components/BouncingBall.vue";
import ShopModal from "@/components/ShopModal.vue";
import Character from "@/components/Character.vue";
import CharacterBedRoom from "@/components/CharacterBedRoom.vue";
import HeaderModalMenu from "@/components/HeaderModalMenu.vue";
import MoodModal from "@/components/moodModal.vue";

let blinkInterval = null
let lookInterval = null
let isDragging = false


const isLoading = ref(true);

// === Адаптивное масштабирование под разные мобильные устройства ===

const BASE_WIDTH = 320
const MOOD_COOLDOWN = 86400
function updateScale() {
  // Небольшие боковые отступы + safe-area через visualViewport если доступен
  const vw = window.visualViewport?.width || window.innerWidth
  const available = vw - 12 // небольшой запас слева/справа
  // Ограничиваем: не меньше 82% (узкие телефоны), не больше 128% (чтобы не расползалось на планшетах)
  const raw = available / BASE_WIDTH
  scale.value = Math.min(Math.max(raw, 0.82), 1.28)
}



const calculateComboProgress = (current, min, max) => {
  if (current <= min) return 0;
  if (current >= max) return 100;
  return ((current - min) / (max - min)) * 100;
};

const progressX2 = computed(() => calculateComboProgress(comboClicks.value, 0, 50));
const progressX3 = computed(() => calculateComboProgress(comboClicks.value, 50, 100));
const progressX5 = computed(() => calculateComboProgress(comboClicks.value, 100, 150));

const getClipInset = (progress) => {
  const maxFill = 15;
  const insetValue = 100 - (progress * (100 - maxFill) / 100);
  return `${insetValue}% 0 0 0`;
};

// Текущий множитель и его прогресс для отображения на холсте
const activeComboMeta = computed(() => {
  if (comboMultiplier.value >= 5 || comboClicks.value > 100) {
    return {
      src: `/gamePlay/x5_combo_icons.webp?v=${APP_VERSION}`,
      progress: progressX5.value,
      sizeClass: 'w-17 h-17'
    };
  }
  if (comboMultiplier.value >= 3 || comboClicks.value > 50) {
    return {
      src: `/gamePlay/x3_combo_icons.webp?v=${APP_VERSION}`,
      progress: progressX3.value,
      sizeClass: 'w-15 h-15'
    };
  }
  if (comboMultiplier.value >= 2 || comboClicks.value > 0) {
    return {
      src: `/gamePlay/x2_combo_icons.webp?v=${APP_VERSION}`,
      progress: progressX2.value,
      sizeClass: 'w-13 h-13'
    };
  }
  return {
    src: `/gamePlay/x1_combo_icons.webp?v=${APP_VERSION}`,
    progress: 100,
    sizeClass: 'w-14 h-14'
  };
});

const isComboUpgrading = ref(false)
let comboUpgradeTimer = null

const hasReachedMaxCombo = ref(false)

function triggerComboBurst() {
  isComboUpgrading.value = false
  requestAnimationFrame(() => {
    isComboUpgrading.value = true
    if (comboUpgradeTimer) clearTimeout(comboUpgradeTimer)
    comboUpgradeTimer = setTimeout(() => {
      isComboUpgrading.value = false
    }, 450)
  })
}

// 1. При смене множителя (x1 -> x2 -> x3 -> x5)
watch(
    () => activeComboMeta.value.src,
    (newSrc, oldSrc) => {
      if (!oldSrc || newSrc === oldSrc) return
      triggerComboBurst()
    }
)

// 2. Когда дошли до последнего комбо (x5 / progressX5 >= 100)
watch(
    [() => comboMultiplier.value, () => progressX5.value],
    ([mult, p5]) => {
      const isMaxReached = mult >= 5 || p5 >= 100

      if (isMaxReached && !hasReachedMaxCombo.value) {
        hasReachedMaxCombo.value = true
        triggerComboBurst()
      } else if (!isMaxReached) {
        // Сбрасываем флаг, когда комбо спало ниже максимума, чтобы при новом достижении сработало снова
        hasReachedMaxCombo.value = false
      }
    }
)

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



function handlePointerDown(event) {
  const trigger = document.querySelector('[data-nameplate-trigger]')
  if (trigger) {
    const rect = trigger.getBoundingClientRect()
    if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
    ) {
      event.preventDefault()
      event.stopPropagation()
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }))
      return
    }
  }
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
      {x: 0, y: 0}, //Смотрит строго прямо (в центр).
      {x: -0.95, y: -0.95},//Смотрит вверх и влево.
      {x: 0.95, y: -0.95},//Смотрит вверх и вправо.
      {x: -0.95, y: 0.95},//Смотрит вниз и влево.
      {x: 0.95, y: 0.95},//Смотрит вниз и вправо.
      {x: 0, y: -0.95}//Смотрит строго вверх.
    ]
    const randomDir = directions[Math.floor(Math.random() * directions.length)]
    pupilOffset.value = randomDir
  }, 4500)

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




onMounted(async () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
    // Разворачиваем на всю доступную высоту
    try {
      tg.expand()
    } catch (e) {
    }
  }
  // Адаптивное масштабирование
  updateScale()
  window.addEventListener('resize', updateScale)
  window.addEventListener('orientationchange', () => {
    setTimeout(updateScale, 150) // небольшая задержка после смены ориентации
  })

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

  location.value = gameData.sleep ? 'bedroom' : 'home'

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
      addToCart('soap');
    }
    // Если игрок совсем новый (1 уровень) — сбрасываем локал и даем стартовые вещи
    else if (gameData.level < 2) {
      tutorialStep.value = 1

      // await resetLocal();
      // gameData.level = 1;
      // tutorialStep.value = 1;
      // addToCart('burger');
      // addToCart('shampoo');
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
  window.removeEventListener('resize', updateScale)
  window.removeEventListener('orientationchange', updateScale)
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
function handleBallTracking(ballX, ballY, isMoving) {
  // Центр экрана / персонажа внутри блока 300x270 (примерно середина: X=150, Y=135)
  const centerX = 150;
  const centerY = 135;

  // Если мяч неподвижен и не в руке, пусть глаза смотрят по стандартному алгоритму или прямо
  if (!isMoving) {
    pupilOffset.value = {x: 0, y: 0}; // Возвращаем глаза в центр
    return;
  }
  // 🛑 ДОПОЛНИТЕЛЬНОЕ УСЛОВИЕ РАННЕЙ ОСТАНОВКИ:
  // Если мяч упал на пол (например, Y >= 250) — перестаем следить раньше
  // const floorThreshold = 215; // Настрой под высоту своего пола
  // if (ballY >= floorThreshold) {
  //   pupilOffset.value = { x: 0, y: 0 }; // Глаза смотрят прямо / расслабленно
  //   return;
  // }
  // Считаем разницу между мячом и центром головы питомца
  const dx = ballX - centerX;
  const dy = ballY - centerY;

  // Ограничиваем максимальное смещение зрачков (чтобы они не вылезали из глазниц, например, до 4 пикселей)
  const maxPupilOffset = 2;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return;

  const nx = (dx / distance) * Math.min(Math.abs(dx) * 0.05, maxPupilOffset);
  const ny = (dy / distance) * Math.min(Math.abs(dy) * 0.05, maxPupilOffset);

  // Передвигаем зрачки
  pupilOffset.value = {x: nx, y: ny};
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
        <div
            class="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-2xl animate-bounce">
          <div
              class="w-full h-full bg-[#FADCCC]  rounded-full flex items-center justify-center border border-amber-300/40">
            <img :src="`/gamePlay/logo_icons.webp?v=${APP_VERSION}`" class="w-10 h-10 object-contain drop-shadow-md"
                 alt="Loading..."/>
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
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative flex flex-col', gameData.sleep ? 'bg-linear-to-r from-blue-900 via-blue-800 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']"
      style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);"
  >

    <PetHeaderMenu class="mb-1 shrink-0"/>

    <!-- Масштабируемый игровой блок (холст + меню) -->
    <div class="flex-1 flex flex-col items-center justify-start overflow-x-hidden px-1">
      <!-- Внешний контейнер занимает реальное место после scale -->
      <div
          class="overflow-hidden"
          :style="{
            width: (BASE_WIDTH * scale) + 'px',
            height: (540 * scale) + 'px'   // ~270 холст + ~270 меню
          }"
      >
        <div
            class="origin-top-left"
            :style="{
              transform: `scale(${scale})`,
              width: BASE_WIDTH + 'px',

            }"
        >
          <!-- Холст -->
          <div class="relative flex justify-center w-full">

            <div :class="[
  'relative w-[300px] h-[270px] border-2  overflow-hidden rounded-2xl object-cover duration-1000',
   gameData.sleep ? 'bg-[#0F175C] border-blue-600' : isBadMood?'bg-gray-400  border-gray-400 ':'bg-[#98E5FE] border-orange-600 ',
]">


              <SunAndMoon/>
              <Clouds/>
              <rain/>

              <!-- Фон локации -->
              <div class="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out "
                   :class="gameData.sleep ? 'brightness-30' : 'brightness-100'">
                <div v-show="location==='home' || location === 'food'">

                  <img

                      :src="`/location/home.webp?v=${APP_VERSION}`"
                      fetchpriority="high"
                      decoding="sync"
                      class="w-[320px] h-[270px] relative z-5"

                  />

                  <img :src="`/location/${gameData.season}.webp?v=${APP_VERSION}`" id="season-bg"
                       alt="Season background"
                       class="absolute top-0 z-0 w-[320px] h-[270px]">
                </div>

                <img
                    v-show="location==='bath'"
                    :src="`/location/bath.webp?v=${APP_VERSION}`"
                    fetchpriority="high"
                    decoding="sync"
                    class="w-[320px] h-[270px] "

                />
                <div v-show="location==='bedroom'">

                  <img

                      :src="`/location/bedroom.webp?v=${APP_VERSION}`"
                      fetchpriority="high"
                      decoding="sync"
                      class="w-[320px] h-[270px] relative z-5"

                  />

                  <img :src="`/location/${gameData.season}.webp?v=${APP_VERSION}`" id="season-bg"
                       alt="Season background"
                       class="absolute top-0 z-0 w-[320px] h-[270px]">
                </div>
                <Nameplate class="pointer-events-auto" />
              </div>


              <div
                  v-if="location==='home'|| location === 'food'"
                  class="absolute right-11.5 top-23.5 text-[9.5px] leading-none text-red-600 font-bold pointer-events-none scale-60 origin-right transition-all duration-500"
                  :class="{ 'drop-shadow-[0_0_6px_rgba(239,68,68,0.9)] text-red-500 brightness-125': gameData.sleep }"
              >
                {{ currentTime }}
              </div>

              <div v-if="gameData.sleep && location === 'bedroom'" class="absolute top-6 left-19">
                <div class="relative flex items-center justify-center p-12">
                  <!-- Ореол света ночника -->
                  <div  class="absolute top-12 right-10 z-20 flex items-center justify-center">
                    <div class="absolute top-12 -right-18 w-52 h-56 blur-lg -rotate-30 opacity-85 pointer-events-none">
                      <div class="w-full h-full bg-[conic-gradient(from_150deg_at_90%_0%,rgba(253,224,71,0.6)_0deg,rgba(251,191,36,0.1)_180deg,transparent_180deg)]"></div>
                    </div>
                    <div class="absolute w-23 h-20 -top-5 blur-xl -right-10 bg-amber-300/30 pointer-events-none"></div>
                    <div class="relative z-10 w-5 h-5 top-5 left-3.5 bg-yellow-100 rounded-full rotate-12 blur-[3px] opacity-25 shadow-[0_0_20px_#fde047]"></div>
                    <div class="relative z-10 w-3 h-1 top-5 -left-1 bg-yellow-300 brightness-130 rounded-full blur-[3px] shadow-[0_0_20px_#fde047]"></div>
                  </div>
                </div>
              </div>

              <!-- 🎃 ТЫКВА с замедленным и плавным ночным переходом (3 секунды) -->


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
                  :text-color="activeStatus.textColor"
                  :bg-color="activeStatus.bgColor"
                  :weight="activeStatus.weight"
                  :height="activeStatus.height"
                  class="pointer-events-auto"
              />

              <!-- Зона персонажа (исправлены классы transition и синтаксис :class) -->
              <div
                   id="tutorial-pet"
                   @pointerdown="handlePointerDown($event)"
                   @pointermove="handlePointerMove($event)"
                   @pointerup="handlePointerEnd"
                   @pointercancel="handlePointerEnd"
                   @pointerleave="handlePointerEnd"
                   class="absolute inset-0 flex justify-center items-center cursor-pointer touch-none select-none transition-[filter,transform] duration-1000 ease-in-out"
                   :class="[
               gameData.sleep ? 'brightness-50' : 'brightness-100'
                    ]"
                   style="will-change: filter; -webkit-backface-visibility: hidden;"
              >



                <!-- Табличка с именем -->

                <CharacterBedRoom v-if="location === 'bedroom'"  />
                <Character v-else />

                <!-- Оверлеи и элементы поверх персонажа -->
                <div class="absolute inset-0 w-full h-full pointer-events-none">
                  <Transition name="combo-fade">
                    <div
                        v-if="isComboAnimating"
                        class="absolute right-30 top-30 select-none z-50 animate-float-combo pointer-events-none"
                        :class="activeComboMeta.sizeClass"
                    >
                      <div
                          class="w-full h-full relative"
                          :class="{ 'combo-level-burst': isComboUpgrading }"
                      >
                        <!-- Тёмная подложка -->
                        <img
                            :src="activeComboMeta.src"
                            class="absolute inset-0 w-full h-full brightness-45 object-contain"
                            alt="combo-bg"
                        />
                        <!-- Заполняемый слой по прогрессу -->
                        <img
                            :src="activeComboMeta.src"
                            class="absolute inset-0 w-full h-full transition-all brightness-110 duration-75 ease-linear object-contain"

                            :style="{ clipPath: `inset(${getClipInset(activeComboMeta.progress)})` }"
                            alt="combo-fill"
                        />
                      </div>
                    </div>
                  </Transition>


                  <PetStinky/>
                  <PetFoam :status-foam="statusFoam" :status-shower="statusShower" :bg-color="colorFoam"/>

                  <PetShower :status-shower="statusShower" :x="showerX" :y="showerY"/>

                  <Poop
                      v-show="gameData.isPooped && (location==='home' || location==='food')"
                      class="pointer-events-auto"
                  />

                  <BouncingBall v-if="location==='home' || location==='food'" :on-ball-move="handleBallTracking"/>
                </div>
              </div>
            </div>

          </div> <!-- end relative flex justify-center (холст) -->

          <!-- Меню (внутри масштабируемого блока) -->

          <PetMenu/>

        </div> <!-- end transform scale -->
      </div> <!-- end size-constrained wrapper -->
    </div> <!-- end flex-1 container -->

  </div>
  <TutorialOverlay/>
  <FortuneWheel/>
  <PetSideMenu/>
  <PetActivity/>
  <moodModal />
  <ShopModal :is-open="isShopOpen" @close="isShopOpen = false"/>

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

@keyframes comboLevelBurst {
  0% {
    transform: scale(1) rotate(-12deg);
    filter: brightness(2.2) drop-shadow(0 0 10px rgba(255, 220, 90, 0.95));
  }
  45% {
    transform: scale(1.2) rotate(10deg);
    filter: brightness(1.6) drop-shadow(0 0 14px rgba(255, 180, 40, 0.8));
  }
  100% {
    transform: scale(1) rotate(0deg);
    filter: brightness(1) drop-shadow(0 0 0 transparent);
  }
}

.combo-level-burst {
  animation: comboLevelBurst 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}







</style>