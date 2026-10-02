<script setup>
import PetMenu from "@/components/PetMenu.vue";
import PetFoam from "@/components/PetFoam.vue";
import PetShower from "@/components/PetShower.vue";
import {ref, onMounted, onUnmounted, watch} from "vue"
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import CloudMessage from "@/components/CloudMessage.vue";
import PetStinky from "@/components/PetStinky.vue";
import PetHeadwear from "@/components/PetHeadwear.vue";
import Status from "@/components/Status.vue";
import {statusSmoke} from "@/scripts/dragAndDrop.js";
import PetSmoke from "@/components/PetSmoke.vue";
import {initGameData} from "@/scripts/api.js";
import Poop from "@/components/Poop.vue";
import {preloadImages} from "@/scripts/preloadImages.js";
import PhotoFrame from "@/components/PhotoFrame.vue";
import PetSideMenu from "@/components/PetSideMenu.vue";
import TutorialOverlay from "@/components/TutorialOverlay.vue";
import {activeStatus} from "@/scripts/stats.js";
import {
  mouth,
  lowEnergy,
  isVibrating, isBadMood, gameData, blink, statusShower, statusFoam,
  locationUrl, location, dropZoneRef, body, tutorialStep
} from "@/scripts/useGameStore.js";
import {
  activeCoins,
  animKey, coinAnimKey,
  comboMultiplier, handleMultiTouch,
  isCoinAnimating,
  isComboAnimating, isUserLooking, pupilOffset, resetEyeLook,
  sunAnimating, updateEyeLook
} from "@/scripts/actions.js";


let blinkInterval = null
let lookInterval = null
function getHornAsset(level) {
  if (level >= 50) return '/horns/50lvl.webp'
  if (level >= 45) return '/horns/45lvl.webp'
  if (level >= 40) return '/horns/40lvl.webp'
  if (level >= 35) return '/horns/35lvl.webp'
  if (level >= 30) return '/horns/30lvl.webp'
  if (level >= 25) return '/horns/25lvl.webp'
  if (level >= 20) return '/horns/20lvl.webp'
  if (level >= 15) return '/horns/15lvl.webp'
  if (level >= 10) return '/horns/10lvl.webp'
  if (level >= 5) return '/horns/5lvl.webp'
  return '/horns/1lvl.webp'
}

function getCombo() {
  if (comboMultiplier.value >= 5) return '/gamePlay/x5_combo_icons.webp'
  if (comboMultiplier.value >= 3) return '/gamePlay/x3_combo_icons.webp'
  if (comboMultiplier.value >= 2) return '/gamePlay/x2_combo_icons.webp'
  return '/gamePlay/x1_combo_icons.webp'
}

watch(location, (newLocation) => {
  if (newLocation === 'home') {
    if (statusFoam) {
      statusFoam.value = false;
    }
    locationUrl.value = '/location/home.webp'


  } else if (newLocation === 'bath') {
    locationUrl.value = '/location/bath.webp'
    gameData.sleep = false
  }
})
// Запускаем рандомный взгляд при монтировании компонента

let isDragging = false // Флаг удержания пальца/курсора

function handlePointerDown(event) {
  isDragging = true
  handleMultiTouch(event) // Вызывает спавн монетки и первоначальный поворот глаз
}

function handlePointerMove(event) {
  // Следим за движением ВСЕГДА, когда палец движется по зоне или зажат
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

onMounted(async () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  location.value = 'home'
  preloadImages()
  startRandomLooking()


})

onUnmounted(() => {
  clearInterval(lookInterval)
  clearInterval(blinkInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})


</script>

<template>
  <div
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative', gameData.sleep ? 'bg-linear-to-r from-blue-900 via-blue-800 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']">


    <PetHeaderMenu/>

    <!-- Холст -->
    <div class="relative flex justify-center w-full  ">


      <div :class="[
  'relative w-[320px] h-[270px] border-2 border-red-400 overflow-hidden rounded-2xl object-cover transition-colors duration-1000',
  gameData.sleep ? 'bg-[#0F175C]' : 'bg-amber-200',

]">

        <!-- Солнце с плавной анимацией появления/исчезновения и движения -->
        <div
            :class="[
         'relative w-20 h-20 bg-yellow-300 rounded-full sun-glow pointer-events-none z-0 transition-all duration-1000 ease-in-out',
         gameData.sleep ? '-top-20 left-[-50px] opacity-0 scale-50' : 'top-0 left-2 opacity-100 scale-100'

       ]">
          <Transition name="fade-sun">
            <img
                v-if="sunAnimating "
                :src="isBadMood ? '/gamePlay/sun_angry.webp' : '/gamePlay/sun_smile.webp'"
                class="absolute left-2 w-17  opacity-45 "
                alt=""
            >
          </Transition>
        </div>

        <!-- Луна с плавной анимацией появления/исчезновения и движения -->
        <div
            :class="[
             'absolute w-20 h-20 bg-[#f4f6f0] rounded-full moon-glow pointer-events-none z-0 transition-all duration-1000 ease-in-out',
             gameData.sleep ? 'top-0 left-2 opacity-100 scale-100' : '-top-20 left-[-50px] opacity-0 scale-50'
            ]">
          <!-- Картинка спавнится ТОЛЬКО когда луна на экране и перезапускает CSS-анимацию -->
          <Transition name="fade-sun">
            <img
                v-if="sunAnimating "
                :src="isBadMood ? '/gamePlay/sad_moon.webp' : '/gamePlay/happy_moon.webp'"
                class="absolute left-2 w-17 opacity-45 pointer-events-none "
                alt=""
            >
          </Transition>
        </div>

        <img
            :src="locationUrl"
            class="absolute animate-dark-base inset-0 pointer-events-none w-[320px] h-[270px] brightness-100 transition-all duration-500"
            :class="gameData.sleep ? 'animate-dark-in' : 'animate-dark-out'"
        />
        <div class="relative flex items-center justify-center p-12">
          <!-- 1. Самый дальний мягкий ореол -->
          <div v-show="gameData.sleep" class="absolute top-4 right-10 z-20 flex items-center justify-center">
            <!-- 1. Направляющий конусный луч (живой свет) -->
            <div class="absolute -top-6 -right-5 w-52 h-56 rotate-[-25deg] blur-lg opacity-70 pointer-events-none">
              <div
                  class="w-full h-full bg-[conic-gradient(from_150deg_at_50%_0%,rgba(253,224,71,0.6)_0deg,rgba(251,191,36,0.1)_40deg,transparent_60deg)]"></div>
            </div>

            <!-- 2. Мягкое объемное облако света (без резких круглых границ) -->
            <div class="absolute w-36 h-36 bg-amber-300/30 blur-2xl pointer-events-none "></div>

            <!-- 3. Яркая вспышка-блик (эллипс, а не круг) -->
            <div
                class="relative z-10 w-4 h-4 top-2 -left-1 bg-yellow-100 rounded-full rotate-12 blur-[5px] shadow-[0_0_20px_#fde047]"></div>
          </div>

        </div>

        <!-- Зона персонажа -->
        <div ref="dropZoneRef"
             @pointerdown="handlePointerDown($event)"
             @pointermove="handlePointerMove($event)"
             @pointerup="handlePointerEnd"
             @pointercancel="handlePointerEnd"
             @pointerleave="handlePointerEnd"
             class="absolute brightness-100 animate-dark-base inset-0 flex justify-center items-center cursor-pointer touch-none select-none"
             :class="gameData.sleep ? 'animate-dark-in' : 'animate-dark-out',tutorialStep === 3 ||tutorialStep === 6 || tutorialStep === 7  ? 'z-205' : ''"
        >

          <div v-show="gameData.sleep"
               class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
            <div class="absolute text-[#00BFFF]  font-extrabold text-xl z-1 drop-shadow-md">Z</div>
            <div class="absolute text-[#00BFFF] font-bold text-sm z-2 left-4 -top-3 drop-shadow-md">z</div>
          </div>
          <p class="bg-[#fbf3e0]"></p>

          <!-- Персонаж (тело и рога обернуты с :key для мгновенного отклика анимации pop) -->
          <div :key="animKey"

               :class="['absolute flex  justify-center items-center w-45 h-45', animKey > 0 ? 'animate-pop' : '']">

            <PetHeadwear/>
            <img :src="body" class="absolute w-45" alt="">
            <img :src="getHornAsset(gameData.level)" class="absolute w-45 " alt="">
            <img v-show="gameData.sick" src="/character/drunk.webp" class="absolute w-45" alt="">
            <img v-show="gameData.sick && body==='/character/fat_body.webp'" src="/character/sick_fat.webp"
                 class="absolute w-45" alt="">
            <img v-show="gameData.sick && body!=='/character/fat_body.webp'" src="/character/sick.webp"
                 class="absolute w-45" alt="">
            <div v-if="!blink && !gameData.sleep">

              <div v-show="lowEnergy" class="absolute inset-0 flex justify-center items-center z-10">
                <img src="/character/bags_left.webp" class="absolute w-45" alt=""/>
                <img src="/character/bags_right.webp" class="absolute w-45" alt=""/>
              </div>

              <div class="absolute inset-0 flex justify-center items-center  pointer-events-none">

                <img src="/character/eye_left.webp?v=1" class="absolute w-45" alt="">
                <img src="/character/eye_right.webp" class="absolute w-45" alt="">
              </div>

              <!-- ЗРАЧКИ -->
              <div class="absolute inset-0 flex justify-center items-center  pointer-events-none">
                <div
                    class="absolute inset-0 flex justify-center items-center pupils-look"
                    :style="{
                transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`
              }"
                >
                  <img src="/character/eye_pupils_left.webp" class="absolute w-45" alt=""/>
                  <img src="/character/eye_pupils_right.webp" class="absolute w-45" alt=""/>

                </div>


              </div>
            </div>
            <img v-else src="/character/eye_close.webp" class="absolute w-45" alt="">
            <img :src="mouth" :class="isVibrating ? 'animate-vibrate' : ''" class="absolute w-45" alt="">
          </div>

        </div>
        <!-- Зона атрибутов -->
        <div
            class="animate-dark-base z-205 absolute inset-0 w-full h-full pointer-events-none"
            :class="gameData.sleep ? 'animate-dark-in' : 'animate-dark-out'"
        >
          <!-- Отрисовываем каждую кликнутую монетку отдельно -->

          <div class="absolute inset-0 pointer-events-none overflow-hidden z-50">
            <template v-for="group in activeCoins" :key="group.id">
              <img
                  v-for="coin in group.coins"
                  :key="coin.id"
                  :style="{
        left: `${coin.x}px`,
        top: `${coin.y}px`,
        animationDelay: `${coin.delay}s`
      }"
                  src="/gamePlay/coin.webp"
                  class="absolute w-5 animate-coinFly pointer-events-none"
                  alt=""
              />
            </template>
          </div>

          <Transition name="combo-fade">
            <img
                v-if="isComboAnimating"
                :src="getCombo()"
                class="absolute text-2xl right-30 top-30 select-none z-50 animate-float-combo pointer-events-none"
                :class="{ 'w-14': comboMultiplier >= 1,'w-15': comboMultiplier >= 2,'w-17': comboMultiplier >= 3,'w-19': comboMultiplier >= 5,'z-205': tutorialStep === 3 || tutorialStep === 6 || tutorialStep === 7 }"
                alt="">
          </Transition>

          <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-30">
            <!-- Добавь pointer-events-auto, если CloudMessage кликабелен -->
            <CloudMessage class="pointer-events-auto"/>
          </div>

          <Status
              :class=" tutorialStep === 3 ? 'z-205' : ''"
              v-if="activeStatus.show "
              :status="true"
              :text="activeStatus.text"
              :image="activeStatus.image"
              :additional="activeStatus.additional"
              :bg-color="activeStatus.bgColor"
              class="pointer-events-auto"
          />

          <PetStinky :class=" tutorialStep === 6 || tutorialStep === 7 ? 'z-205' : ''"/>
          <PetFoam :status-foam="statusFoam" :class=" tutorialStep === 6 || tutorialStep === 7 ? 'z-205' : ''"/>
          <PetSmoke :status-smoke="statusSmoke"/>
          <PetShower :status-shower="statusShower" :class=" tutorialStep === 6 || tutorialStep === 7 ? 'z-205' : ''"/>

          <!-- Включаем клики обратно для Poop и PhotoFrame -->
          <Poop
              v-show="gameData.isPooped && (location==='home' || location==='food')"
              class="pointer-events-auto"
          />


        </div>
        <PhotoFrame
            class="z-10 pointer-events-auto"
            v-show="(location==='home' || location==='food')"
        />
      </div>
      <PetSideMenu/>
    </div>

    <!-- Меню -->
    <div class="mt-auto pb-4 shrink-0">
      <PetMenu/>

    </div>
    <TutorialOverlay/>

  </div>
</template>


<style scoped>
.fade-sun-enter-active,
.fade-sun-leave-active {
  transition: opacity 1s ease;
}

.fade-sun-enter-from,
.fade-sun-leave-to {
  opacity: 0;
  transform: scale(1);
}

.animate-dark-base {
  /* Фиксирует начальное состояние до запуска анимации */
  filter: brightness(1);
}
@keyframes animateDarkIn {
  0% {
    filter: brightness(1);
  }
  /* Убраны промежуточные кадры (15%, 45%) — cubic-bezier сделает перепад между 1 и 0.3 идеально плавным */
  100% {
    filter: brightness(0.3);
  }
}

@keyframes animateDarkOut {
  0% {
    filter: brightness(0.3);
  }
  100% {
    filter: brightness(1);
  }
}

.animate-dark-in,
.animate-dark-out {
  /* Жесткий форс GPU без перерисовок */
  will-change: filter;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;

  /* Изоляция слоя: предотвращает артефакты размытия по краям */
  contain: paint;
  isolation: isolate;
}

.animate-dark-in {
  /* Кривая cubic-bezier(0.16, 1, 0.3, 1) даёт ультра-плавный "доводчик" в конце */
  animation: animateDarkIn 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-dark-out {
  animation: animateDarkOut 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}


@keyframes moonFlash {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 0.45; /* Быстро проявилась */
  }
  45% {
    opacity: 0.45; /* Висит в полной яркости */
  }

  100% {
    opacity: 0; /* Плавно затухает на протяжении 55% времени (0.55 сек) */
  }
}

.animate-moonFlash {
  /* Заменяем ease-in-out на cubic-bezier для шелковистого затухания */
  animation: moonFlash 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

/* 1. Твоя анимация покачивания (бесконечный цикл, пока висит плашка) */
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

/* 2. Плавное появление и плавное растворение во Vue Transition */
.combo-fade-enter-active,
.combo-fade-leave-active {
  transition: opacity 1s ease, transform 0.5s ease;
}

/* Состояние до появления и после исчезновения */
.combo-fade-enter-from,
.combo-fade-leave-to {
  opacity: 0;
  transform: scale(0.6) translateY(10px);
}


@keyframes coinFly {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 1;
    /* Монетка слегка взлетает вверх относительно точки клика */
    transform: translate(0, -30px) scale(1.2);
  }
  100% {
    /* Финальный прилёт в угол (счётчик) */
    transform: translate(120px, -200px) scale(0.3);
    opacity: 0;
  }
}

.animate-coinFly {
  animation: coinFly 0.7s cubic-bezier(0.25, 1, 0.5, 1) both;
  will-change: transform, opacity;
  pointer-events: none;
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

.moon-glow {
  box-shadow: 0 0 20px 8px rgba(240, 244, 248, 0.5),
  0 0 40px 15px rgba(203, 213, 225, 0.2);
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

@keyframes thoughtCloudAppearAndFloat {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(10px);
  }
  70% {
    transform: scale(1.05) translateY(-2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes cloudFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.02);
  }
}

.animate-thought-cloud {
  animation: thoughtCloudAppearAndFloat 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
  cloudFloat 3s ease-in-out 0.4s infinite;
  transform-origin: center bottom;
}


</style>