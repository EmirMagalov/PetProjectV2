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
import Nameplate from "@/components/Nameplate.vue";
import PetSideMenu from "@/components/PetSideMenu.vue";
import TutorialOverlay from "@/components/TutorialOverlay.vue";

import {
  mouth,
  lowEnergy,
  isVibrating, isBadMood, gameData, blink, statusShower, statusFoam,
  location, dropZoneRef, tutorialStep, isPopping, bodyType, activeStatus
} from "@/scripts/useGameStore.js";
import {
  activeCoins, activeExp,
  comboMultiplier, handleMultiTouch,
  isComboAnimating, isUserLooking, pupilOffset, resetEyeLook,
  sunAnimating, updateEyeLook
} from "@/scripts/actions.js";
import PetCostume from "@/components/PetCostume.vue";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import FortuneWheel from "@/components/FortuneWheel.vue";

let blinkInterval = null
let lookInterval = null
let isDragging = false


function getHornAsset(level) {
  if (level >= 50) return `/horns/50lvl.webp?v=${APP_VERSION}`
  if (level >= 45) return `/horns/45lvl.webp?v=${APP_VERSION}`
  if (level >= 40) return `/horns/40lvl.webp?v=${APP_VERSION}`
  if (level >= 35) return `/horns/35lvl.webp?v=${APP_VERSION}`
  if (level >= 30) return `/horns/30lvl.webp?v=${APP_VERSION}`
  if (level >= 25) return `/horns/25lvl.webp?v=${APP_VERSION}`
  if (level >= 20) return `/horns/20lvl.webp?v=${APP_VERSION}`
  if (level >= 15) return `/horns/15lvl.webp?v=${APP_VERSION}`
  if (level >= 10) return `/horns/10lvl.webp?v=${APP_VERSION}`
  if (level >= 5) return `/horns/5lvl.webp?v=${APP_VERSION}`
  return `/horns/1lvl.webp?v=${APP_VERSION}`
}

function getCombo() {
  if (comboMultiplier.value >= 5) return `/gamePlay/x5_combo_icons.webp?v=${APP_VERSION}`
  if (comboMultiplier.value >= 3) return `/gamePlay/x3_combo_icons.webp?v=${APP_VERSION}`
  if (comboMultiplier.value >= 2) return `/gamePlay/x2_combo_icons.webp?v=${APP_VERSION}`
  return `/gamePlay/x1_combo_icons.webp?v=${APP_VERSION}`
}

watch(location, (newLocation) => {
  if (newLocation === 'home') {
    if (statusFoam) {
      statusFoam.value = false;
    }
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
  triggerPop()
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

onMounted(async () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
  }
  // localStorage.removeItem('pet_nextSpinAt')
  document.addEventListener('visibilitychange', handleVisibilityChange)

  location.value = 'home'

  startRandomLooking()
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

})

onUnmounted(() => {
  clearInterval(lookInterval)
  clearInterval(blinkInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (clockInterval) clearInterval(clockInterval);
})



</script>

<template>
  <div
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative', gameData.sleep ? 'bg-linear-to-r from-blue-900 via-blue-800 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']">

    <PetHeaderMenu/>

    <!-- Холст -->
    <div class="relative flex justify-center w-full">

      <div :class="[
  'relative w-[320px] h-[270px] border-2 border-red-400 overflow-hidden rounded-2xl object-cover transition-colors duration-1000',
  gameData.sleep ? 'bg-[#0F175C]' : 'bg-amber-200',
]">

        <!-- Солнце -->
        <div
            :class="[
         'relative brightness-130 w-15 h-15 bg-yellow-300 rounded-full sun-glow pointer-events-none  transition-all duration-1000 ease-in-out',
         gameData.sleep ? '-top-20 left-[-50px] opacity-0 scale-50' : 'top-0 left-0 opacity-100 scale-100'
       ]">
          <Transition name="fade-sun">
            <img
                v-if="sunAnimating"
                :src="isBadMood ? `/gamePlay/sun_angry.webp?v=${APP_VERSION}` : `/gamePlay/sun_smile.webp?v=${APP_VERSION}`"
                class="absolute top-1 left-2 w-12 opacity-45"
                alt=""
            >
          </Transition>
        </div>

        <!-- Луна -->
        <div
            :class="[
             'absolute brightness-130 w-15 h-15 bg-[#f4f6f0] rounded-full moon-glow pointer-events-none  transition-all duration-1000 ease-in-out',
             gameData.sleep ? 'top-0 left-0 opacity-100 scale-100' : '-top-20 left-[-50px] opacity-0 scale-50'
            ]">
          <Transition name="fade-sun">
            <img
                v-if="sunAnimating"
                :src="isBadMood ? `/gamePlay/sad_moon.webp?v=${APP_VERSION}` : `/gamePlay/happy_moon.webp?v=${APP_VERSION}`"
                class="absolute left-2 top-1 w-12 opacity-45 pointer-events-none"
                alt=""
            >
          </Transition>
        </div>

        <!-- Фон локации -->
        <div class="absolute inset-0  pointer-events-none transition-all duration-1000 ease-in-out "
             :class="gameData.sleep ? 'brightness-30' : 'brightness-100'">
          <img
              v-show="location==='home' || location === 'food'"
              :src="`/location/home.webp?v=${APP_VERSION}`"
              fetchpriority="high"
              decoding="sync"
              class="w-[320px] h-[270px] "

          />
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

        <!-- Табличка с именем -->
        <div
            class="absolute inset-0 z-11 pointer-events-none transition-all duration-1000 ease-in-out"
            :class="gameData.sleep ? 'brightness-30' : 'brightness-100'"
            v-show="(location === 'home' || location === 'food')"
        >
          <Nameplate class="pointer-events-auto"/>
        </div>

        <!-- Монетки / Опыт -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden"  :class="tutorialStep === 3 ? 'z-205' : ' z-50'">
          <template v-for="group in activeCoins" :key="group.id">
            <img
                v-for="coin in group.coins"
                :key="coin.id"
                :style="{
                      left: `${coin.x}px`,
                      top: `${coin.y}px`,
                      animationDelay: `${coin.delay}s`
                    }"
                :src="`/gamePlay/coin.webp?v=${APP_VERSION}`"
                class="absolute w-5 animate-coinFly pointer-events-none"
                alt=""
            />
          </template>
        </div>
        <div class="absolute inset-0 pointer-events-none overflow-hidden" :class="tutorialStep === 3 ? 'z-205' : ' z-50'">
          <template v-for="group in activeExp" :key="group.id">
            <img
                v-for="exp in group.exp"
                :key="exp.id"
                :style="{
                      left: `${exp.x}px`,
                      top: `${exp.y}px`,
                      animationDelay: `${exp.delay}s`
                    }"
                :src="`/gamePlay/exp.webp?v=${APP_VERSION}`"
                class="absolute w-5 animate-expFly pointer-events-none"
                alt=""
            />
          </template>
        </div>
        <Status
            :class="tutorialStep === 3 ? 'z-205' : ''"
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
               gameData.sleep ? 'brightness-30' : 'brightness-100',[3, 6, 7].includes(tutorialStep) ? ' z-205 ' : ''

             ]"
                >

          <div v-show="gameData.sleep"
               class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
            <div class="absolute text-[#00BFFF] font-extrabold text-xl z-1 drop-shadow-md">Z</div>
            <div class="absolute  text-[#00BFFF] font-bold text-sm z-2 left-4 -top-3 drop-shadow-md">z</div>
          </div>

          <!-- Персонаж -->
          <div :class="['absolute flex justify-center items-center w-45 h-45', isPopping ? 'animate-pop' : '',tutorialStep === 3 ? 'animate-quick-pulse' : '']">
            <PetHeadwear/>
            <PetCostume/>
            <div class="absolute w-45 h-45 pointer-events-none">
              <!-- Худое тело -->
              <img
                  :src="`/character/skinny_body.webp?v=${APP_VERSION}`"
                  alt="skinny body"
                  class="absolute inset-0 w-full h-full object-contain body-fade"
                  :class="bodyType === 'skinny' ? 'opacity-100' : 'opacity-0'"
              />

              <!-- Нормальное тело -->
              <img
                  :src="`/character/main_body.webp?v=${APP_VERSION}`"
                  alt="normal body"
                  class="absolute inset-0 w-full h-full object-contain body-fade"
                  :class="bodyType === 'normal' ? 'opacity-100' : 'opacity-0'"
              />

              <!-- Толстое тело -->
              <img
                  :src="`/character/fat_body.webp?v=${APP_VERSION}`"
                  alt="fat body"
                  class="absolute inset-0 w-full h-full object-contain body-fade"
                  :class="bodyType === 'fat' ? 'opacity-100' : 'opacity-0'"
              />
            </div>
            <img :src="getHornAsset(gameData.level)" class="absolute w-45" alt="">
            <img v-show="gameData.sick" src="/character/drunk.webp" class="absolute w-45" alt="">
            <img v-show="gameData.sick && bodyType==='fat'" src="/character/sick_fat.webp" class="absolute w-45 z-10"
                 alt="">
            <img v-show="gameData.sick && bodyType!=='fat'" :src="`/character/sick.webp?v=${APP_VERSION}`" class="absolute w-45 z-10"
                 alt="">

            <div v-if="!blink && !gameData.sleep">
              <div v-show="lowEnergy" class="absolute inset-0 flex justify-center items-center z-10">
                <img :src="`/character/bags_left.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
                <img :src="`/character/bags_right.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
              </div>

              <div class="absolute inset-0 flex justify-center items-center pointer-events-none">
                <img :src="`/character/eye_left.webp?v=${APP_VERSION}`" class="absolute w-45" alt="">
                <img :src="`/character/eye_right.webp?v=${APP_VERSION}`" class="absolute w-45" alt="">
              </div>

              <!-- Зрачки -->
              <div class="absolute inset-0 flex justify-center items-center pointer-events-none">
                <div
                    class="absolute inset-0 flex justify-center items-center pupils-look"
                    :style="{ transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)` }"
                >
                  <img :src="`/character/eye_pupils_left.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
                  <img :src="`/character/eye_pupils_right.webp?v=${APP_VERSION}`" class="absolute w-45" alt=""/>
                </div>
              </div>
            </div>

            <img v-else src="/character/eye_close.webp" class="absolute w-45" alt="">
            <img :src="mouth" :class="isVibrating ? 'animate-vibrate' : ''" class="absolute w-45" alt="">
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
                    'z-205': tutorialStep === 3 || tutorialStep === 6 || tutorialStep === 7
                  }"
                  alt="">
            </Transition>

            <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-30">
              <CloudMessage class="pointer-events-auto"/>
            </div>


            <PetStinky/>
            <PetFoam :status-foam="statusFoam"/>
            <PetSmoke :status-smoke="statusSmoke"/>
            <PetShower :status-shower="statusShower"/>

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
  transition: opacity 150ms ease-in-out !important;
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

@keyframes coinFly {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
    transform: translate(0, -30px) scale(1.2);
  }
  25% {
    opacity: 1;
    transform: translate(0px, -70px) scale(1.2);
  }
  100% {
    transform: translate(0px, -250px) scale(0.3);
    opacity: 0;
  }
}

.animate-coinFly {
  animation: coinFly 0.7s cubic-bezier(0.25, 1, 0.5, 1) both;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes coinExp {
  0% {
    transform: translate(0, 0) scale(0.3);
    opacity: 0;
  }
  20% {
    opacity: 0.5;
    transform: translate(0, -30px) scale(1.2);
  }
  25% {
    opacity: 1;
    transform: translate(0px, -70px) scale(1.2);
  }
  100% {
    transform: translate(0px, -250px) scale(0.3);
    opacity: 0;
  }
}

.animate-expFly {
  animation: coinExp 0.7s cubic-bezier(0.25, 1, 0.5, 1) both;
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

</style>