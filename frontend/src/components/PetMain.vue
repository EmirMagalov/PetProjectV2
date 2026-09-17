<script setup>
import {useDraggable} from "@vueuse/core"
import PetMenu from "@/components/PetMenu.vue";
import PetFoam from "@/components/PetFoam.vue";
import PetShower from "@/components/PetShower.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import {ref, onMounted, onUnmounted, watch} from "vue"
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import {
  mouth,
  lowEnergy,
  hearts, isVibrating, lastFedItem, isBadMood, isAnimating, gameData, blink, statusShower, statusFoam, feedStatus,
  locationUrl, location, dropZoneRef, body, isGameOver, lifeStatus
} from "@/scripts/useGameStore.js";

import CloudMessage from "@/components/CloudMessage.vue";
import PetStinky from "@/components/PetStinky.vue";
import PetHeadwear from "@/components/PetHeadwear.vue";
import {animKey, spawnHeart} from "@/scripts/actions.js";
import Status from "@/components/Status.vue";
import {levelStatus} from "@/scripts/level.js";
import {statusSmoke} from "@/scripts/dragAndDrop.js";
import PetSmoke from "@/components/PetSmoke.vue";
import {initGameData, isLoading} from "@/scripts/api.js"; // <--- Импортируем isLoading


const pupilOffset = ref({x: 0, y: 0})
let blinkInterval = null
let lookInterval = null


function getHornAsset(level) {
  if (level >= 20) return '/horns/20lvl.webp'
  if (level >= 15) return '/horns/15lvl.webp'
  if (level >= 10) return '/horns/10lvl.webp'
  if (level >= 5) return '/horns/5lvl.webp'
  return '/horns/1lvl.webp'
}

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

watch(location, (newLocation) => {
  if (newLocation === 'home') {
    locationUrl.value = '/location/home.webp'

  } else if (newLocation === 'bath') {
    locationUrl.value = '/location/bath.webp'
    gameData.sleep = false
  }
})
// Запускаем рандомный взгляд при монтировании компонента
onMounted(() => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp

    // Отключаем вертикальные свайпы для закрытия/сворачивания
    if (typeof tg.disableVerticalSwipes === 'function') {
      tg.disableVerticalSwipes()
    }
  }
  initGameData()
  location.value = 'home'
  startRandomLooking()
})

// Очищаем интервал при уходе со страницы, чтобы не было утечек памяти
onUnmounted(() => {
  clearInterval(lookInterval)
  clearInterval(blinkInterval)
})


</script>

<template>
  <div
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000 relative', gameData.sleep ? 'bg-linear-to-r from-blue-800 via-blue-900 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']">

    <!-- 🛑 ОВЕРЛЕЙ ЗАГРУЗКИ (БЛОКИРУЕТ ИНТЕРФЕЙС, ПОКА ДАННЫЕ НЕ ПРИШЛИ) -->
    <div v-if="isLoading" class="fixed inset-0 z-200 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
      <div class="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-white font-bold text-sm tracking-wide">Загрузка...</p>
    </div>

    <PetHeaderMenu/>

    <!-- Холст -->
    <div class="relative flex justify-center w-full  ">


      <div
          :class="[
      'relative w-[280px] h-[270px] overflow-hidden border-2 border-red-400 rounded-2xl object-cover transition-colors duration-1000',
      gameData.sleep ? 'bg-[#0F175C]' : 'bg-amber-200'
    ]">

        <!-- Солнце с плавной анимацией появления/исчезновения и движения -->
        <div
            :class="[
         'absolute w-20 h-20 bg-yellow-300 rounded-full sun-glow pointer-events-none z-0 transition-all duration-1000 ease-in-out',
         gameData.sleep ? '-top-20 left-[-50px] opacity-0 scale-50' : 'top-0 left-2 opacity-100 scale-100'
       ]"></div>

        <!-- Луна с плавной анимацией появления/исчезновения и движения -->
        <div
            :class="[
         'absolute w-20 h-20 bg-[#f4f6f0] rounded-full moon-glow pointer-events-none z-0 transition-all duration-1000 ease-in-out',
         gameData.sleep ? 'top-0 left-2 opacity-100 scale-100' : '-top-20 left-[-50px] opacity-0 scale-50'
       ]"></div>
        <img :src="locationUrl"
             class="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"/>

        <!-- Зона персонажа (сюда перетаскиваем яблоко) -->

        <div ref="dropZoneRef"
             class="absolute inset-0 z-30 flex justify-center  items-center cursor-pointer">

          <div @click="spawnHeart" class="absolute top-30 z-120 w-25 h-25"></div>

          <!-- Сердечко с key для перезапуска анимации на каждый клик -->
          <img
              :key="animKey"
              :src="isBadMood ? '/gamePlay/angry_icon.webp' : '/gamePlay/happy_icon.webp'"
              class="absolute text-2xl w-5 select-none z-20 animate-float-heart"
              alt="">

          <div v-show="gameData.sleep"
               class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
            <div class="absolute text-[#00BFFF]  font-extrabold text-xl z-1 drop-shadow-md">Z</div>
            <div class="absolute text-[#00BFFF] font-bold text-sm z-2 left-4 -top-3 drop-shadow-md">z</div>
          </div>
          <p class="bg-[#fbf3e0]"></p>

          <!-- Персонаж (тело и рога обернуты с :key для мгновенного отклика анимации pop) -->
          <div :key="animKey" class="absolute flex justify-center items-center animate-pop w-45 h-45">
            <img :src="body" class="absolute w-45" alt="">
            <img :src="getHornAsset(gameData.level)" class="absolute w-45" alt="">
            <img v-show="gameData.isDrunk" src="/character/drunk.webp" class="absolute w-45" alt="">
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
            <img v-show="isAnimating" :key="animKey"
                 class="absolute w-5 z-50 animate-coinFly"
                 src="/gamePlay/coin.svg" alt="">
          </div>

          <!-- Индикаторы статусов -->
          <Status v-if="!levelStatus && feedStatus" :status="feedStatus" text="Ням-ням!" image="/gamePlay/hunger.webp"
                  :additional="`+${lastFedItem?.foodGain}`"/>
          <Status v-if="!levelStatus && lifeStatus" :status="lifeStatus" text="+ 1 жизнь!" image="/gamePlay/heart.svg"/>
          <Status :status="levelStatus" text="Уровеь повышен" :additional="gameData.level"/>
          <Status :status="isGameOver" text="Питомец погиб!" image="/gamePlay/grave.webp" bg-color="bg-[#808080]"/>
          <PetStinky/>
          <PetFoam :status-foam="statusFoam"/>
          <PetSmoke :status-smoke="statusSmoke"/>
          <PetShower :status-shower="statusShower"/>
          <PetHeadwear/>
        </div>
      </div>
    </div>

    <!-- Меню -->
    <div class="mt-auto pb-4 shrink-0">
      <PetMenu/>
    </div>


  </div>
</template>


<style scoped>
@keyframes floatHeart {
  0% {
    transform: translate(-15px, -15px) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-40px, -30px) scale(1.5);
  }
  100% {
    transform: translate(-40px, -30px) scale(0.8);
    opacity: 0;
  }
}

.animate-float-heart {
  animation: floatHeart 0.5s ease-out forwards;
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

@keyframes coinFly {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(5px, -50px) scale(1.2);
  }
  100% {
    transform: translate(5px, -100px) scale(0.8);
    opacity:0;
  }
}

.animate-coinFly {
  animation: coinFly 0.2s ease-out forwards;
}
</style>