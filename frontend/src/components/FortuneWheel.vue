<script setup>

import {
  canSpin,
  formattedCooldown,
  fortuneRewards,
  getSectorStyle,
  isFortuneOpen,
  isSpinning, spinWheel,
  wheelRotation
} from "@/scripts/fortune.js";
import {gameData} from "@/scripts/useGameStore.js";
import {onMounted, watch} from "vue";


onMounted(() => {
  if (canSpin.value) {
    isFortuneOpen.value = true
  }
})

// Если таймер закончился, пока пользователь был в игре — тоже открываем
watch(canSpin, (newValue) => {
  if (newValue) {
    isFortuneOpen.value = true
  }
})

</script>

<template>
  <div class="fortune-overlay" v-if="isFortuneOpen">
    <div class="fortune-card">
      <button class="close-icon" @click="isFortuneOpen = false">✖</button>

      <h2 class="title">Колесо Фортуны</h2>
      <p class="subtitle">Крути каждый день и получай бонусы!</p>

      <!-- Стрелка-указатель -->
      <div class="pointer-wrapper">
        <div class="pointer"></div>
      </div>

      <!-- Вращающийся диск -->
      <div class="wheel-outer">
        <div
            class="wheel-inner"
            :style="{
    transform: `rotate(${wheelRotation}deg)`,
    transition: isSpinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
  }"
        >
          <!-- Секторы (кусочки пирога) -->
          <div
              v-for="(reward, index) in fortuneRewards"
              :key="reward.id"
              class="sector"
              :style="getSectorStyle(index)"
          >
            <div class="sector-content">
              <img :src="reward.icon" :alt="reward.name"/>
              <span>{{ reward.name }}</span>
            </div>
          </div>
        </div>
        <!-- Центральная заглушка -->
        <div class="wheel-center-cap"></div>
      </div>

      <!-- Кнопка вращения / Таймер -->
      <button
          class="spin-button"
          :disabled="(!canSpin && gameData.coins < 100) || isSpinning"
          @click="spinWheel"
      >
        <span v-if="isSpinning">Крутим...</span>
        <span v-else-if="canSpin">Бесплатный спин!</span>
        <div class="flex gap-1 justify-center items-center" v-else-if="gameData.coins >= 100">

            <img src="/gamePlay/coin.webp" class="w-5 h-5" alt="">
            <p>Покрутить за 100 монет</p>

   </div>
        <div class="flex gap-1 justify-center items-center" v-else>
          <img src="/gamePlay/coin.webp" class="w-5 h-5" alt="">
          <p>Мало монет</p>
  </div>
      </button>
      <p v-show="!canSpin">Бесплатно через: {{ formattedCooldown }}</p>
    </div>
  </div>
</template>

<style scoped>
.fortune-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.fortune-card {
  background: linear-gradient(135deg, #2b1055, #7597de);
  border: 4px solid #ffd700;
  border-radius: 24px;
  padding: 24px 16px;
  width: 320px;
  text-align: center;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  position: relative;
}

.close-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

.title {
  margin: 0;
  font-size: 22px;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.subtitle {
  font-size: 12px;
  margin: 4px 0 16px;
  opacity: 0.8;
}

.pointer-wrapper {
  position: relative;
  z-index: 10;
  height: 0;
}

.pointer {
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 26px solid #ff4757;
  margin: 0 auto;
  filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.6));
}

.wheel-outer {
  width: 250px;
  height: 250px;
  margin: 12px auto 20px;
  border-radius: 50%;
  border: 6px solid #ffd700;
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 215, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.wheel-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 50%;
}

/* Сектор-кусок пирога */
.sector {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transform-origin: 50% 50%;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.sector-content {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  width: 60px;
}

.sector-content img {
  width: 26px;
  height: 26px;
  margin-bottom: 2px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5));
}

/* Кружок по центру колеса */
.wheel-center-cap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: radial-gradient(circle, #ffd700, #b8860b);
  border: 3px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  z-index: 5;
}

.spin-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(180deg, #ff4757, #ff6b81);
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 71, 87, 0.4);
  transition: transform 0.1s, opacity 0.2s;
}

.spin-button:active {
  transform: scale(0.98);
}

.spin-button:disabled {
  background: #57606f;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.8;
}
</style>