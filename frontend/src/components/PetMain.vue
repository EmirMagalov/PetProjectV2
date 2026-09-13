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
  locationUrl, location, dropZoneRef, body, isGameOver
} from "@/scripts/useGameStore.js";

import {addCoins} from "@/scripts/actions.js";

import CloudMessage from "@/components/CloudMessage.vue";
import PetStinky from "@/components/PetStinky.vue";
import PetHeadwear from "@/components/PetHeadwear.vue";
import {giveCoinToggle} from "@/scripts/basket.js";
import {spawnHeart} from "@/scripts/actions.js";
import Status from "@/components/Status.vue";
import {levelStatus} from "@/scripts/level.js";
import {statusSmoke} from "@/scripts/dragAndDrop.js";
import PetSmoke from "@/components/PetSmoke.vue";
import {initGameData} from "@/scripts/api.js";


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
      :class="['bg-[#DBEAFE] min-h-dvh transition-colors duration-3000', gameData.sleep ? 'bg-linear-to-r from-blue-800 via-blue-900 to-blue-950':'bg-linear-65 from-yellow-300 via-yellow-600 to-orange-600']">
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

             :class="[
               'absolute inset-0 z-30 flex justify-center mt-5 items-center cursor-pointer transition-transform',
               isAnimating ? 'animate-pop' : ''
             ]">
          <div  @click="spawnHeart" class="absolute top-30 z-120 w-25 h-25"></div>
          <img v-show="hearts" :src=" isBadMood? '/gamePlay/angry.svg':'/gamePlay/kiss.svg'" :style="{

      }" :class="['absolute text-2xl w-5 select-none z-20',hearts?'animate-float-heart':'']" alt="">
          <div v-show="gameData.sleep"
               class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
            <div class="absolute text-[#00BFFF]  font-extrabold text-xl z-1 drop-shadow-md">Z</div>
            <div class="absolute text-[#00BFFF] font-bold text-sm z-2 left-4 -top-3 drop-shadow-md">z</div>
          </div>
          <p class="bg-[#fbf3e0]"></p>

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
            <!-- 1. Внешний блок зрачков ТОЖЕ моргает вместе с глазами, но без смещения -->
            <div class="absolute inset-0 flex justify-center items-center  pointer-events-none">
              <!-- 2. Внутренний блок отвечает ТОЛЬКО за рандомный взгляд -->
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
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-30">
            <CloudMessage/>


            <img v-show="isAnimating && giveCoinToggle" :class="['absolute w-5 z-50',isAnimating?'animate-coinFly ':'']"
                 src="/gamePlay/coin.svg" alt="">


          </div>
          <!-- Индикатор успешного кормления   -->
          <Status v-if="!levelStatus && feedStatus" :status="feedStatus" text="Ням-ням!" image="/gamePlay/hunger.webp"
                  :additional="`+${lastFedItem?.foodGain}`"/>
          <Status :status="levelStatus" text="Уровеь повышен" :additional="gameData.level"/>
          <Status :status="isGameOver" text="💀 Питомец погиб!" image="/gamePlay/grave.webp" bg-color="bg-[#808080]"/>
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
      <!--      <PetMenu-->
      <!--          v-model:mouth="mouth"-->
      <!--          v-model:feedStatus="feedStatus"-->
      <!--          v-model:location="location"-->
      <!--          v-model:currentDraggedItem="currentDraggedItem"-->
      <!--          v-model:sleep="sleep"-->
      <!--          v-model:statusFoam="statusFoam"-->
      <!--          v-model:statusShower="statusShower"-->
      <!--          :dropZoneRef="dropZoneRef"-->
      <!--          @feed-success="spawnHeart"-->
      <!--      />-->
      <PetMenu/>
    </div>


  </div>
</template>


<style scoped>
@keyframes floatHeart {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  50% {
    /* Летит на случайную ширину по X и чуть выше по Y */
    transform: translate(-40px, -30px) scale(1.5);
  }
  100% {
    /* Улетает в финальную случайную точку и растворяется */
    transform: translate(-40px, -30px) scale(0.8);
    opacity: 0;
  }
}

.animate-float-heart {
  animation: floatHeart 0.8s ease-out forwards;
}

/* Новая анимация для персонажа при клике */
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
  animation: popCharacter 0.5s;
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
  /* Вибрирует очень быстро, 0.05 секунды на цикл, 16 раз за 0.8с */
  animation: vibrate 0.50s linear infinite;
  /* Важно: чтобы вибрация не влияла на другие элементы */
  display: inline-block;
}


/* Плавный переход для рандомного взгляда зрачков */
.pupils-look {
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Эффект лунного свечения (серебристо-белое) */
.moon-glow {
  box-shadow: 0 0 20px 8px rgba(240, 244, 248, 0.5),
  0 0 40px 15px rgba(203, 213, 225, 0.2);
}

/* Плавное покачивание / «дыхание» во время сна */
@keyframes sleep-breath {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.03) translateY(2px);
  }
}

/* Анимация всплывающих буковок Zzz */
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

/* Класс для «дыхания» персонажа */
.animate-sleep {
  animation: sleep-breath 3s ease-in-out infinite;
}

/* Классы для буковок Zzz */
.zzz-container {
  position: absolute;
  top: 20%;
  right: 25%;
  pointer-events: none;
  z-index: 30;
}

.z-1 {
  animation: float-z 2.5s ease-in-out infinite;
}

.z-2 {
  animation: float-z 2.5s ease-in-out infinite;
  animation-delay: 1.2s; /* Вторая буковка летит с задержкой */
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

/* Бесконечное легкое покачивание после появления */
@keyframes cloudFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.02);
  }
}

.animate-thought-cloud {
  /* Сначала срабатывает появление (0.4с), затем бесконечно запускается покачивание (3с) */
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
    /* Летит на 30 пикселей влево/вверх и чуть увеличивается */
    transform: translate(30px, -50px) scale(1.2);
  }
  100% {
    /* Улетает еще выше и растворяется */
    transform: translate(120px, -150px) scale(0.8);
    opacity: 1;
  }
}

.animate-coinFly {
  animation: coinFly 0.6s ease-out forwards;
}

</style>