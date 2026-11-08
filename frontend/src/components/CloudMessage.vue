<script setup>
import {cloudShow, energyFull, showHunger, gameData, lowEnergy} from "@/scripts/useGameStore.js";
import {computed} from "vue";
import {APP_VERSION} from "@/scripts/imageVersion.js";

const activeItems = computed(() => {
  let items = 0
  if (showHunger.value) {
    items += 1
  }
  if (energyFull.value || lowEnergy.value) {
    items += 1
  }
  return items
})
</script>

<template>
  <!-- Внешний позиционирующий контейнер -->
  <div class="absolute -top-40 inset-0 flex items-center justify-center pointer-events-none opacity-80 overflow-visible z-30">

    <!-- Vue Transition с классами для перелета -->
    <Transition name="cloud-fly">
      <div
          v-show="cloudShow && !gameData.sleep"
          class="relative flex items-center justify-center z-50 pointer-events-auto"
      >
        <!-- Само облако -->
        <img :src="`/gamePlay/cloud_message.webp?v=${APP_VERSION}`" class="relative w-30 block" alt="cloud">

        <!-- 🌧️ СЛОЙ ДОЖДЯ (появляется с задержкой, исчезает мгновенно при уходе облака) -->
        <div class="absolute inset-x-4 -bottom-10 h-14 pointer-events-none overflow-visible z-40 rain-wrapper">
          <span class="rain-drop drop-1"></span>
          <span class="rain-drop drop-2"></span>
          <span class="rain-drop drop-3"></span>
          <span class="rain-drop drop-4"></span>
          <span class="rain-drop drop-5"></span>
          <span class="rain-drop drop-6"></span>
          <span class="rain-drop drop-7"></span>
          <span class="rain-drop drop-8"></span>
        </div>

        <!-- Контейнер для иконки внутри облака -->
<!--        <div class="absolute inset-0 flex gap-2 items-center justify-center z-50">-->

<!--          &lt;!&ndash; Hunger (Бургер) &ndash;&gt;-->
<!--          <div v-show="showHunger" class="flex items-center justify-center w-9">-->
<!--            <img :src="`/food/burger.webp?v=${APP_VERSION}`" class="w-full object-contain" alt="hunger">-->
<!--          </div>-->

<!--          &lt;!&ndash; Energy (Энергия) &ndash;&gt;-->
<!--          <div v-show="energyFull || lowEnergy" class="flex items-center justify-center gap-1 w-10">-->
<!--            <img-->
<!--                :src="lowEnergy ? `/gamePlay/energy_low.webp?v=${APP_VERSION}` : ''"-->
<!--                class="w-full object-contain"-->
<!--                alt="energy"-->
<!--            >-->
<!--          </div>-->

<!--        </div>-->
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* ✈️ Настройка перелета (появление слева -> центр -> уход налево) */
.cloud-fly-enter-active {
  transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 1.2s ease;
}

.cloud-fly-leave-active {
  transition: transform 0.4s cubic-bezier(0.5, 0, 0.75, 1), opacity 0.4s ease; /* Ускорили уход, чтобы дождь не успевал "висеть" */
}

/* Откуда начинает лететь (далеко слева и слегка уменьшено) */
.cloud-fly-enter-from {
  transform: translateX(-350px) scale(0.6);
  opacity: 0;
}

/* Куда улетает при исчезновении (снова налево) */
.cloud-fly-leave-to {
  transform: translateX(-200px) scale(0.6);
  opacity: 0;
}

/* ⏱️ Дождь появляется с задержкой 1.1с, но при исчезновении контейнера (.cloud-fly-leave-active) сбрасывается мгновенно */
@keyframes fadeInRain {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.rain-wrapper {
  opacity: 0;
  animation: fadeInRain 0.3s ease-in-out 0.1s forwards;
}

/* Когда компонент начинает уходить, скрываем дождь моментально без задержек */
.cloud-fly-leave-active .rain-wrapper {
  opacity: 0 !important;
  transition: opacity 0.1s ease;
}

/* 🌧️ Стили и анимация быстрого дождя */
.rain-drop {
  position: absolute;
  top: -35px;
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, transparent, rgba(174, 214, 241, 0.9));
  animation: fallRain linear infinite;
  will-change: transform;
}

.drop-1 { left: 22%; animation-duration: 0.28s; animation-delay: 0.05s; }
.drop-2 { left: 42%; animation-duration: 0.22s; animation-delay: 0.15s; }
.drop-3 { left: 65%; animation-duration: 0.32s; animation-delay: 0.1s; }
.drop-4 { top: 20px; left: 82%; animation-duration: 0.25s; animation-delay: 0.2s; }
.drop-5 { top: 20px; left: 22%; animation-duration: 0.28s; animation-delay: 0.05s; }
.drop-6 { top: 20px; left: 42%; animation-duration: 0.22s; animation-delay: 0.15s; }
.drop-7 { top: 20px; left: 65%; animation-duration: 0.32s; animation-delay: 0.1s; }
.drop-8 { left: 82%; animation-duration: 0.25s; animation-delay: 0.2s; }

@keyframes fallRain {
  0% {
    transform: translateY(0) rotate(10deg);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translateY(50px) rotate(10deg);
    opacity: 0;
  }
}
</style>