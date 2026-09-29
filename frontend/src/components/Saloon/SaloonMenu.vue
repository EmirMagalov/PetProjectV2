<script setup>
import {ref, nextTick, computed, onMounted, onUnmounted} from "vue";
import {
  gameFinished,
  gameStarted,
  bettingPhase,
  hit,
  playerCards,
  playerScore,
  dealerScore,
  startGame,
  addPlayerCard,
  addDealerCard,
  placeBet,
  determineWinner,
  currentBet,
  isDealing
} from "@/scripts/saloonScripts/twentyOneGame.js";
import {gameData} from "@/scripts/useGameStore.js";

// Безопасный расчет монет
const userCoins = computed(() => {
  if (!gameData) return 0;
  const coins = gameData?.coins;
  return Number(coins) || 0;
});

const emit = defineEmits(["animate-draw"]);
const playerCardsZone = ref(null);

const selectedBet = ref(50);
const betOptions = [50, 100, 250, 500];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Гарантированный сброс состояния при входе/выходе для SPA
function resetGameState() {
  gameStarted.value = false;
  gameFinished.value = false;
  bettingPhase.value = false;
  isDealing.value = false;
  currentBet.value = null;
  playerCards.value = [];
}

// onMounted(() => {
//   resetGameState();
// });

// onUnmounted(() => {
//   resetGameState();
// });

async function handleStartGame() {
  if (userCoins.value < 50) {
    alert("Недостаточно монет для начала игры! Минимальная ставка: 50");
    return;
  }

  currentBet.value = null;
  bettingPhase.value = false;

  startGame();
  isDealing.value = true;

  await nextTick();
  await sleep(100);

  emit("animate-draw", {targetEl: playerCardsZone.value, isDealer: false});
  await sleep(400);
  addPlayerCard();

  emit("animate-draw", {isDealer: true});
  await sleep(400);
  addDealerCard();

  isDealing.value = false;
  bettingPhase.value = true;
}

function handleConfirmBet() {
  if (userCoins.value < selectedBet.value) return;
  handleHit()
  placeBet(selectedBet.value);
}

async function handleHit() {
  isDealing.value = true;
  emit("animate-draw", {targetEl: playerCardsZone.value, isDealer: false});
  await sleep(400);
  hit();
  isDealing.value = false;
}

async function handleStand() {
  isDealing.value = true;

  while (dealerScore.value < 17) {
    emit("animate-draw", {isDealer: true});
    await sleep(400);
    addDealerCard();
    await sleep(300);
  }

  isDealing.value = false;
  determineWinner();
}

function handleRestart() {
  if (userCoins.value < 50) {
    alert("Недостаточно монет для начала игры!");
    return;
  }

  playerCards.value = [];
  currentBet.value = null;
  bettingPhase.value = false;

  nextTick(() => {
    handleStartGame();
  });
}
</script>

<template>
  <!-- Главный контейнер меню с фиксом для Safari -->
  <div
      class="saloon-container rounded-4xl p-4 mx-5 bg-[#fff6ef] h-65 border-2 border-[#f7c9a5] flex flex-col mt-1 items-center justify-between relative"
      style="background-image: url('/gamePlay/poker_table.webp'); background-size: cover; "
  >
    <!-- Кнопка "Назад" -->
    <RouterLink to="/" class="z-30">
      <div
          class="bg-[#fff6ef] absolute left-2 top-2 h-15 w-15 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer z-30"
          style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);"
      >
        <div
            class="w-10 h-10 bg-contain bg-no-repeat bg-center"
            style="background-image: url('/gamePlay/back_icon.webp')"
        ></div>
        <span class="text-xs font-bold text-gray-600 pointer-events-none">Назад</span>
      </div>
    </RouterLink>

    <!-- Текст ставки -->
    <div class="w-full flex justify-center items-center px-2 text-sm font-bold text-amber-900 z-20">
      <div v-if="gameStarted && currentBet" class="bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
        Ставка: {{ currentBet }}
      </div>
    </div>

    <!-- Игровая область карт -->
    <div v-if="gameStarted" class="flex flex-col items-center gap-2 my-auto z-20 w-full">
      <div v-show="playerScore > 0" class="inline-flex items-center justify-center">
        <span class="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          Ты: {{ playerScore }}
        </span>
      </div>

      <div ref="playerCardsZone" class="flex items-center justify-center min-h-[80px] w-full relative z-20">
        <div
            v-for="(card, index) in playerCards"
            :key="card.suit + card.name + index"
            class="card-render-wrapper w-16 h-20 -ml-6 first:ml-0 relative shrink-0"
        >
          <img
              :src="card.image"
              :alt="`${card.name} of ${card.suit}`"
              loading="eager"
              decoding="sync"
              class="w-full h-full object-contain drop-shadow-md pointer-events-none"
          />
        </div>
      </div>
    </div>

    <!-- 1. ФАЗА СТАВОК -->
    <div
        v-if="gameStarted && !currentBet && (bettingPhase || isDealing)"
        class="flex flex-col items-center gap-2 mb-2 duration-300 z-20"
    >
      <div class="flex gap-2">
        <button
            v-for="bet in betOptions"
            :key="bet"
            @click="selectedBet = bet"
            :disabled="userCoins < bet || isDealing"
            :class="[
          'px-3 py-1 rounded-lg font-bold text-md transition border',
          (userCoins < bet || isDealing)
            ? 'opacity-40 bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
            : selectedBet === bet
              ? 'bg-amber-500 text-white border-amber-600 scale-105 cursor-pointer'
              : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50 cursor-pointer',
        ]"
        >
          {{ bet }}
        </button>
      </div>

      <button
          @click="handleConfirmBet"
          :disabled="userCoins < selectedBet || isDealing"
          :class="[
        'w-35 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition text-white text-lg font-bold shadow-md cursor-pointer disabled:opacity-50',
        (userCoins < selectedBet || isDealing)
          ? 'bg-gray-400 opacity-60 cursor-not-allowed'
          : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 cursor-pointer'
      ]"
      >
        Поставить
      </button>
    </div>

    <!-- 2. ФАЗА ДОБОРА ("ЕЩЁ" / "ХВАТИТ") -->
    <div v-else-if="gameStarted && !bettingPhase && !gameFinished" class="flex gap-3  mb-2 z-20">

      <button
          @click="handleStand"
          :disabled="isDealing"
          class="w-25 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-95 transition text-white text-lg font-bold shadow-md cursor-pointer disabled:opacity-50"
      >
        Хватит
      </button>
      <button
          @click="handleHit"
          :disabled="isDealing"
          class=" w-25 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition text-white text-lg font-bold shadow-md cursor-pointer disabled:opacity-50"
      >
        Ещё
      </button>
    </div>

    <!-- 3. КНОПКИ ПЕРЕЗАПУСКА И СТАРТА -->
    <button
        v-if="gameFinished"
        @click="handleRestart"
        :disabled="userCoins < 50"
        :class="[
          'w-35 h-12 mb-2 rounded-lg font-bold text-md shadow-lg transition z-20',
          userCoins < 50
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            : 'bg-yellow-400 hover:bg-yellow-300 active:scale-95 cursor-pointer'
        ]"
    >
      {{ userCoins >= 50 ? 'Ещё раз' : 'Минимальная ставка 50' }}
    </button>

    <button
        v-if="!gameStarted && !gameFinished"
        @click="handleStartGame"
        :disabled="userCoins < 50"
        :class="[
          'w-32 h-25 my-auto font-bold text-md shadow-lg transition bg-[#fff6ef] rounded-4xl border-2 border-[#f7c9a5] z-20',
          userCoins < 50
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            : 'hover:bg-yellow-300 active:scale-95 cursor-pointer'
        ]"
        style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);"
    >
      {{ userCoins >= 50 ? 'Играть' : 'Минимальная ставка 50' }}
    </button>
  </div>
</template>

<style scoped>
/* Принудительное включение GPU-слоя для родителя без урезания детей */
.saloon-container {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  isolation: isolate;
}


.card-render-wrapper {
  animation: cardAppear 0.3s ease-out forwards;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

@keyframes cardAppear {
  0% {
    opacity: 0;
    transform: translateY(-15px) scale(0.7);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>