<script setup>
import {ref, nextTick, computed} from "vue";
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
} from "@/scripts/saloon/twentyOneGame.js";
import {gameData} from "@/scripts/useGameStore.js";

const userCoins = computed(() => {
  return gameData.value !== undefined ? gameData.value.coins : gameData.coins;
});

const emit = defineEmits(["animate-draw"]);
const playerCardsZone = ref(null);

const selectedBet = ref(50);
const betOptions = [50, 100, 250, 500];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Пошаговая раздача с проверкой баланса
async function handleStartGame() {
  if (userCoins.value < 50) {
    alert("Недостаточно монет для начала игры! Минимальная ставка: 50");
    return;
  }

  // Сбрасываем ставки перед началом раздачи
  currentBet.value = null; // или 0, если у вас в JS используется другое базовое значение
  bettingPhase.value = false;

  startGame();
  isDealing.value = true; // Включаем статус "Идет раздача"

  await nextTick();

  // Раздаем карту Игроку (открытая)
  emit("animate-draw", { targetEl: playerCardsZone.value, isDealer: false });
  await sleep(500);
  addPlayerCard();

  // Раздаем карту Дилеру (закрытая)
  emit("animate-draw", { isDealer: true });
  await sleep(500);
  addDealerCard();

  // Завершаем раздачу — активируем фазу ставок
  isDealing.value = false;
  bettingPhase.value = true;
}

// 2. Игрок подтверждает ставку
function handleConfirmBet() {
  if (userCoins.value < selectedBet.value) return;
  placeBet(selectedBet.value);
}

// 3. Игрок берет карту («Ещё»)
async function handleHit() {
  isDealing.value = true;
  emit("animate-draw", {targetEl: playerCardsZone.value, isDealer: false});
  await sleep(500);
  hit();
  isDealing.value = false;

  if (playerScore.value >= 21 && !gameFinished.value) {
    await handleStand();
  }
}

// 4. Игрок завершает ход («Хватит») -> Дилер ходит по очереди
async function handleStand() {
  isDealing.value = true;

  while (dealerScore.value < 17) {
    emit("animate-draw", {isDealer: true});
    await sleep(500);
    addDealerCard();
    await sleep(400);
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
  currentBet.value = null; // Очищаем текущую ставку
  bettingPhase.value = false;

  nextTick(() => {
    handleStartGame();
  });
}
</script>

<template>
  <div
      class="rounded-4xl p-4 mx-5 bg-[#fff6ef] h-65 mt-1 border-2 border-[#f7c9a5] flex flex-col items-center justify-between relative overflow-hidden"
  >
    <RouterLink to="/">
      <div
          class="bg-[#fff6ef] absolute left-2 h-15 w-15 flex flex-col items-center p-0.5 rounded-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer"
          style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);"
      >
        <div
            class="w-10 h-10 bg-contain bg-no-repeat bg-center"
            style="background-image: url('/gamePlay/back_icon.webp')"
        ></div>
        <button class="text-xs font-bold text-gray-600 pointer-events-none">Назад</button>
      </div>
    </RouterLink>

    <div class="w-full flex justify-center items-center px-2 text-sm font-bold text-amber-900">
      <div v-if="gameStarted && currentBet" class="bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
        Ставка: {{ currentBet }}
      </div>
    </div>

    <!-- Игровая область игрока -->
    <div v-if="gameStarted" class="flex flex-col items-center gap-2 my-auto">
      <div v-show="playerScore > 0" class="inline-flex items-center justify-center">
        <span class="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
          Ты: {{ playerScore }}
        </span>
      </div>

      <!-- Зона карт игрока -->
      <div ref="playerCardsZone" class="flex items-center justify-center min-h-[62px] relative">
        <TransitionGroup name="card-list">
          <div
              v-for="(card, index) in playerCards"
              :key="card.suit + card.name + index"
              class="w-20 h-20 -ml-10 first:ml-0 transition-all duration-300 hover:-translate-y-1"
          >
            <img
                :src="card.image"
                :alt="`${card.name} of ${card.suit}`"
                loading="eager"
                decoding="sync"
                class="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        </TransitionGroup>
      </div>
    </div>
    <!--    <div-->

    <!--        class="absolute inset-0 z-30 flex items-center justify-center text-amber-900/30 font-bold text-xl animate-pulse pointer-events-none"-->
    <!--    >-->
    <!--      Раздаем карты...-->
    <!--    </div>-->
    <!--    &lt;!&ndash; ТЕКСТ ВО ВРЕМЯ АНИМАЦИИ СДАЧИ (Абсолютное центрирование по верстке) &ndash;&gt;-->
    <!--    <div-->
    <!--        v-if="isDealing && !gameFinished"-->
    <!--        class="absolute inset-0 z-30 flex items-center justify-center text-amber-900 font-bold text-xl animate-pulse pointer-events-none"-->
    <!--    >-->
    <!--      Раздаем карты...-->
    <!--    </div>-->

    <!-- 1. ФАЗА СТАВОК -->
    <div
        v-if="gameStarted && !currentBet && (bettingPhase || isDealing)"
        class="flex flex-col items-center gap-2 mb-2 duration-300"
    >
      <div class="flex gap-2">
        <button
            v-for="bet in betOptions"
            :key="bet"
            @click="selectedBet = bet"
            :disabled="userCoins < bet || isDealing"
            :class="[
          'px-3 py-1 rounded-lg font-bold text-sm transition border',
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
        'px-6 py-1.5 rounded-xl transition text-white font-bold shadow-md mt-1',
        (userCoins < selectedBet || isDealing)
          ? 'bg-gray-400 opacity-60 cursor-not-allowed'
          : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 cursor-pointer'
      ]"
      >
        Поставить
      </button>
    </div>

    <!-- 2. ФАЗА ДОБОРА -->
    <div v-else-if="gameStarted && !bettingPhase && !gameFinished" class="flex gap-3 mb-2">
      <button
          @click="handleHit"
          :disabled="isDealing"
          class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition text-white text-lg font-bold shadow-md cursor-pointer disabled:opacity-50"
      >
        Ещё
      </button>

      <button
          @click="handleStand"
          :disabled="isDealing"
          class="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-95 transition text-white text-lg font-bold shadow-md cursor-pointer disabled:opacity-50"
      >
        Хватит
      </button>
    </div>

    <!-- 3. КНОПКИ ПЕРЕЗАПУСКА И СТАРТА -->
    <button
        v-if="gameFinished"
        @click="handleRestart"
        :disabled="userCoins < 50"
        :class="[
          'w-35 h-12 mb-2 rounded-lg font-bold text-md shadow-lg transition',
          userCoins < 50
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            : 'bg-yellow-400 hover:bg-yellow-300 active:scale-95 cursor-pointer'
        ]"
    >
      {{ userCoins >= 50 ? ' Ещё раз' : 'Минимальная ставка 50' }}
    </button>

    <button
        v-if="!gameStarted"
        @click="handleStartGame"
        :disabled="userCoins < 50"
        :class="[
          'w-35 h-12 my-auto rounded-2xl font-bold text-md shadow-lg transition',
          userCoins < 50
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            : 'bg-yellow-400 hover:bg-yellow-300 active:scale-95 cursor-pointer'
        ]"
    >
      {{ userCoins >= 50 ? ' Играть' : 'Минимальная ставка 50' }}
    </button>
  </div>
</template>

<style scoped>
.card-list-enter-active {
  transition: all 0.4s ease-out;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.5);
}

.card-list-leave-active {
  position: absolute;
  display: none;
}
</style>