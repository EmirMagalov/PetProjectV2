<script setup>
import PetMenu from "@/components/PetMenu.vue";
import PetFoam from "@/components/PetFoam.vue";
import PetShower from "@/components/PetShower.vue";
import {ref, onMounted, onUnmounted, watch} from "vue"
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import CloudMessage from "@/components/CloudMessage.vue";
import PetStinky from "@/components/PetStinky.vue";
import PetHeadwear from "@/components/PetHeadwear.vue";
import {
  animKey, coinAnimKey,
  comboAnimKey,
  comboMultiplier,
  isCoinAnimating,
  isComboAnimating,
  spawnHeart, sunMoonAnimating, sunMoonAnimKey
} from "@/scripts/actions.js";
import Status from "@/components/Status.vue";
import {levelStatus} from "@/scripts/level.js";
import {statusSmoke} from "@/scripts/dragAndDrop.js";
import PetSmoke from "@/components/PetSmoke.vue";
import {initGameData, isLoading} from "@/scripts/api.js";
import {
  mouth,
  lowEnergy,
  isVibrating, lastFedItem, isBadMood, isAnimating, gameData, blink, statusShower, statusFoam, feedStatus,
  locationUrl, location, dropZoneRef, body, isGameOver, lifeStatus, isLosingLifeStatus
} from "@/scripts/useGameStore.js";
import Poop from "@/components/Poop.vue";
import {preloadImages} from "@/scripts/preloadImages.js";
import PhotoFrame from "@/components/PhotoFrame.vue";
import {computed} from 'vue'
import PetSideMenu from "@/components/PetSideMenu.vue";
import {foodList} from "@/scripts/objectItems.js";

const activeStatus = computed(() => {
  // Приоритет 1: Смерть питомца
  if (isGameOver.value) {
    return {
      show: true,
      text: "Питомец погиб!",
      image: "/gamePlay/grave.webp",
      bgColor: "bg-[#808080]"
    }
  }

  // Приоритет 2: Повышение уровня
  if (levelStatus.value) {
    return {
      show: true,
      text: "Уровень повышен",
      additional: gameData.level,
      image: null // или дефолтная иконка уровня
    }
  }

  // Приоритет 3: Потеря жизни (-1)
  if (isLosingLifeStatus.value) {
    return {
      show: true,
      text: "- 1 жизнь!",
      image: "/gamePlay/heart-broken.svg"
    }
  }

  // Приоритет 4: Получение жизни (+1)
  if (lifeStatus.value) {
    return {
      show: true,
      text: "+ 1 жизнь!",
      image: "/gamePlay/heart.svg"
    }
  }

  // Приоритет 5: Кормежка (ням-ням)
  if (feedStatus.value) {
    // Находим сам объект еды по ID, который сохранен в lastFedItem
    const fedItemObj = foodList.find(item => item.id === lastFedItem.value)

    return {
      show: true,
      text: "Ням-ням!",
      image: "/gamePlay/hunger.webp",
      additional: `+${fedItemObj?.foodGain || 0}`
    }
  }

  // Если ничего не происходит
  return {show: false}
})


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
const pupilOffset = ref({x: 0, y: 0})
let blinkInterval = null
let lookInterval = null

// Функция рандомного взгляда
function startRandomLooking() {

  lookInterval = setInterval(() => {
    // Случайный выбор смещения зрачков (в пределах небольшой зоны, чтобы не вылезли из глаз)
    const directions = [
      {x: 0, y: 0},   // прямо
      {x: -3, y: -1}, // влево-вверх
      {x: 3, y: -1},  // вправо-вверх
      {x: -2, y: 2},  // влево-вниз
      {x: 2, y: 2},   // вправо-вниз
      {x: 0, y: -2}   // просто вверх
    ]


    // Выбираем случайное направление
    const randomDir = directions[Math.floor(Math.random() * directions.length)]
    pupilOffset.value = randomDir

  }, 2500) // Меняем взгляд каждые 2.5 секунды
  blinkInterval = setInterval(() => {
    blink.value = true
    setTimeout(() => {
      blink.value = false
    }, 150) // Глаза закрыты 150 миллисекунд
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
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative', gameData.sleep ? 'bg-linear-to-r from-blue-800 via-blue-900 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']">


    <PetHeaderMenu/>

    <!-- Холст -->
    <div class="relative flex justify-center w-full  ">


      <div
          :class="[
      'relative w-[320px] h-[270px] overflow-hidden border-2 border-red-400 rounded-2xl object-cover transition-colors duration-1000',
      gameData.sleep ? 'bg-[#0F175C]' : 'bg-amber-200'
    ]">

        <!-- Солнце с плавной анимацией появления/исчезновения и движения -->
        <div
            :class="[
         'relative w-20 h-20 bg-yellow-300 rounded-full sun-glow pointer-events-none z-0 transition-all duration-1000 ease-in-out',
         gameData.sleep ? '-top-20 left-[-50px] opacity-0 scale-50' : 'top-0 left-2 opacity-100 scale-100'
         
       ]">
          <Transition name="fade-moon">
            <img
                v-if="sunMoonAnimating"
                :src="isBadMood ? '/gamePlay/sun_moon_angry.webp' : '/gamePlay/sun_moon_smile.webp'"
                class="absolute left-2 w-17"
                alt=""
            >
          </Transition>
        </div>
        <!--        <img-->
        <!--            v-if="animKey > 0"-->
        <!--            :key="animKey"-->
        <!--            :src="isBadMood ? '/gamePlay/angry_icon.webp' : '/gamePlay/happy_icon.webp'"-->
        <!--            class="absolute text-2xl w-5 select-none z-20 animate-float-heart"-->
        <!--            alt="">-->
        <!-- Луна с плавной анимацией появления/исчезновения и движения -->
        <div
            :class="[
         'absolute w-20 h-20 bg-[#f4f6f0] rounded-full moon-glow pointer-events-none z-0 transition-all duration-1000 ease-in-out',
         gameData.sleep ? 'top-0 left-2 opacity-100 scale-100' : '-top-20 left-[-50px] opacity-0 scale-50'
       ]"></div>
        <img :src="locationUrl"
             class="absolute inset-0  z-20 pointer-events-none w-[320px] h-[270px]"/>

        <!-- Зона персонажа (сюда перетаскиваем яблоко) -->

        <div ref="dropZoneRef"
             class="absolute inset-0 z-30 flex justify-center

              items-center cursor-pointer">

          <!--          <div class="absolute z-120 w-40 h-40"></div>-->

          <!-- Сердечко с key для перезапуска анимации на каждый клик -->

          <Transition name="combo-fade">
            <img
                v-if="isComboAnimating"
                :src="getCombo()"
                class="absolute text-2xl  select-none z-50 animate-float-combo pointer-events-none"
                :class="{ 'w-12': comboMultiplier >= 1,'w-15': comboMultiplier >= 2,'w-20': comboMultiplier >= 3,'w-25': comboMultiplier >= 5 }"
                alt="">
          </Transition>
          <template v-if="isCoinAnimating">
            <img
                v-for="i in comboMultiplier"
                :key="`${coinAnimKey}-${i}`"
                :style="{ '--i': i - 1 }"
                src="/gamePlay/coin.webp"
                class="absolute w-5 z-50 animate-coinFly pointer-events-none"
                alt="">
          </template>
          <!--          <template v-if="isCoinAnimating">-->
          <!--            <img-->
          <!--                v-for="i in comboMultiplier"-->
          <!--                :key="`${coinAnimKey}-${i}`"-->
          <!--                :style="{-->
          <!--        '&#45;&#45;i': i - 1,-->
          <!--        animationDelay: `${(i - 1) * 0.04}s`-->
          <!--      }"-->
          <!--                src="/gamePlay/coin.webp"-->
          <!--                class="absolute w-5 z-50 animate-coinFly pointer-events-none"-->
          <!--                alt="">-->
          <!--          </template>-->


          <div v-show="gameData.sleep"
               class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
            <div class="absolute text-[#00BFFF]  font-extrabold text-xl z-1 drop-shadow-md">Z</div>
            <div class="absolute text-[#00BFFF] font-bold text-sm z-2 left-4 -top-3 drop-shadow-md">z</div>
          </div>
          <p class="bg-[#fbf3e0]"></p>
          <PhotoFrame v-show="(location==='home' || location==='food')"/>
          <!-- Персонаж (тело и рога обернуты с :key для мгновенного отклика анимации pop) -->
          <div :key="animKey"
               @click="spawnHeart"
               :class="['absolute flex justify-center items-center w-45 h-45', animKey > 0 ? 'animate-pop' : '']">

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

                <img src="/character/eye_left.webp" class="absolute w-45" alt="">
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
                  <img src="/character/pupils_left.webp" class="absolute w-45" alt=""/>
                  <img src="/character/pupils_right.webp" class="absolute w-45" alt=""/>

                </div>


              </div>
            </div>
            <img v-else src="/character/eye_close.webp" class="absolute w-45" alt="">
            <img :src="mouth" :class="isVibrating ? 'animate-vibrate' : ''" class="absolute w-45" alt="">
          </div>


          <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-30">
            <CloudMessage/>

            <!-- Монетка с key для перезапуска анимации на каждый клик -->

          </div>
          <Status
              v-if="activeStatus.show"
              :status="true"
              :text="activeStatus.text"
              :image="activeStatus.image"
              :additional="activeStatus.additional"
              :bg-color="activeStatus.bgColor"
          />

          <PetStinky/>
          <PetFoam :status-foam="statusFoam"/>
          <PetSmoke :status-smoke="statusSmoke"/>
          <PetShower :status-shower="statusShower"/>
          <Poop v-show="gameData.isPooped && (location==='home' || location==='food')"/>


        </div>
        <!-- Индикаторы статусов -->

      </div>
      <PetSideMenu/>
    </div>

    <!-- Меню -->
    <div class="mt-auto pb-4 shrink-0">
      <PetMenu/>
    </div>


  </div>
</template>


<style scoped>
.fade-moon-enter-active,
.fade-moon-leave-active {
  transition: opacity 1s ease;
}

.fade-moon-enter-from,
.fade-moon-leave-to {
  opacity: 0;
  transform: scale(1);
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
    transform: translate(calc(10px + (var(--i) * 10px)), -10px) scale(0.6);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translate(calc(30px + (var(--i) * 10px)), -30px) scale(1);
  }
  20% {
    transform: translate(calc(60px + (var(--i) * 10px)), -60px) scale(1.5);
  }
  30% {
    transform: translate(calc(65px + (var(--i) * 10px)), -65px) scale(1.7);
  }
  /* Короткое замедление/увеличение в воздухе */
  40% {
    transform: translate(calc(70px + (var(--i) * 10px)), -70px) scale(1.3);
  }
  70% {
    transform: translate(calc(180px + (var(--i) * 6px)), -180px) scale(0.9);
  }
  100% {
    /* Финальный прилет и уменьшение */
    transform: translate(310px, -320px) scale(0.4);
    opacity: 0;
  }
}

.animate-coinFly {
  /* Замени кривую без overshoot (1.2), чтобы не было залипания */
  animation: coinFly 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
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