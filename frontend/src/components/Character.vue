<script setup>

import Tails from "@/components/Tails.vue";
import PetHeadwear from "@/components/PetHeadwear.vue";
import PetClothes from "@/components/PetClothes.vue";
import {
  blink,
  bodyType,
  characterPath, FatPlayCount,
  gameData,
  isBadMood,
  isPopping,
  isVibrating,
  lifeStage, lowEnergy, mouth
} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {batheStatus, isHovered} from "@/scripts/dragAndDrop.js";
import {addCoin, comboClicks, comboMultiplier, isComboAnimating, pupilOffset} from "@/scripts/actions.js";
import {addExp} from "@/scripts/level.js";
import {ref} from "vue";
import Cloud from "@/components/Cloud.vue";


const isFlips = ref(false)
const isEggShaking = ref(false)

function triggerPop() {
  isPopping.value = true

  setTimeout(() => {
    isPopping.value = false

  }, 200)
}


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
let vibrateTimer = null
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
  if (gameData.isFat) {
    FatPlayCount.value++
    if ((gameData.fatCount - FatPlayCount.value) <= 0) {
      gameData.isFat = false
      FatPlayCount.value = 0
      gameData.fastfoodStreak = 0
      addExp(10)
      addCoin(10)
    }
  }
}
function getEggsAsset() {
  if (gameData.exp >= 80) return `/character/egg_pahse_five.webp?v=${APP_VERSION}`
  if (gameData.exp >= 60) return `/character/egg_pahse_four.webp?v=${APP_VERSION}`
  if (gameData.exp >= 40) return `/character/egg_pahse_three.webp?v=${APP_VERSION}`
  if (gameData.exp >= 20) return `/character/egg_pahse_two.webp?v=${APP_VERSION}`
  return `/character/egg_pahse_one.webp?v=${APP_VERSION}`
}

</script>

<template>
<!--  <Cloud class="absolute top-0"/>-->
  <!-- Персонаж (исходный контейнер w-45 h-45, ничего не сжимается) -->
  <div v-if="gameData.level>1"
       class="absolute flex justify-center items-center w-45 h-45 pointer-events-none"
       :class="[isPopping ? 'animate-pop' : '']">

    <!-- 🎯 Точечная кликабельная зона поверх персонажа (размер w-24 h-24, клик работает строго по центру) -->
    <div
        @pointerdown="handleCharacterClick"
        class="absolute z-30 w-20 h-20  top-25 cursor-pointer pointer-events-auto"
    ></div>
    <Tails class="z-0 pointer-events-none"/>
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

    <img v-show="isBadMood && lifeStage === 'adult'" src="/character/claws.webp"
         class="absolute w-45 z-10 pointer-events-none" alt="">
    <img v-show="isBadMood && lifeStage === 'adult' && isHovered && !batheStatus" src="/character/fangs.webp"
         class="absolute w-45 z-10 pointer-events-none" alt="">
    <img :src="`${characterPath}/ears.webp?v=${APP_VERSION}`"
         class="absolute z-5 w-45 pointer-events-none" alt="">

    <img v-show="gameData.sick" :src="`${characterPath}/drunk.webp?v=${APP_VERSION}`"
         class="absolute z-6 w-45 pointer-events-none" alt="">
    <!--                  <img v-show="gameData.sick && bodyType==='fat'" :src="`${characterPath}/sick_fat.webp?v=${APP_VERSION}`"-->
    <!--                       class="absolute w-45 z-10 pointer-events-none" alt="">-->
    <img v-show="gameData.sick" :src="`${characterPath}/sick.webp?v=${APP_VERSION}`"
         class="absolute w-45 pointer-events-none" alt="">

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
          <img :src="`${characterPath}/eye_pupils_left.webp?v=${APP_VERSION}`" class="absolute w-45"
               alt=""/>
          <img :src="`${characterPath}/eye_pupils_right.webp?v=${APP_VERSION}`" class="absolute w-45"
               alt=""/>
        </div>
      </div>
    </div>
    <img v-else-if="isVibrating" :src="`${characterPath}/eye_close.webp?v=${APP_VERSION}`"
         class="absolute w-45 pointer-events-none" alt="">
    <img v-else-if="!isVibrating" :src="`${characterPath}/eye_close.webp?v=${APP_VERSION}`"
         class="absolute w-45 pointer-events-none" alt="">
    <img :src="mouth" :class="isVibrating ? 'animate-vibrate' : ''"
         class="absolute w-45 pointer-events-none"
         alt="">
    <!--                  <img :src="getTailAsset(gameData.level)" class=" w-45 pointer-events-none" alt="">-->

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
</template>

<style scoped>
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