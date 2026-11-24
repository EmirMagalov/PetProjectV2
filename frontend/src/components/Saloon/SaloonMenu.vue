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
  isDealing,
  betOptions,
  selectedBet,
  playerScoreText
} from "@/scripts/saloonScripts/twentyOneGame.js";
import {gameData} from "@/scripts/useGameStore.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import i18n from "@/scripts/locales/i18n.js";

// Безопасный расчет монет
const userCoins = computed(() => {
  if (!gameData) return 0;
  const coins = gameData?.coins;
  return Number(coins) || 0;
});

const emit = defineEmits(["animate-draw"]);
const playerCardsZone = ref(null);

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

async function handleStartGame() {
  if (userCoins.value < 50) {
    alert(i18n.global.t('saloon.not_enough_coins_for_game'));
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
  handleHit();
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
    alert(i18n.global.t('saloon.not_enough_coins_generic'));
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
      class="saloon-container rounded-4xl p-2 bg-[#fff6ef] h-55 border-2 border-[#f7c9a5] flex flex-col mt-1 items-center relative w-full max-w-[300px] mx-auto z-30"
      :style="{backgroundImage: `url('/gamePlay/poker_table.webp?v=${APP_VERSION}')`, backgroundSize: `cover`}"
  >
    <!-- Кнопка "Назад" -->
    <RouterLink to="/" class="z-30">
      <div
          class="bg-[#fff6ef] absolute -left-2 top-1/2 -translate-y-1/2 h-15 w-10 flex flex-col items-center justify-center p-0.5 rounded-l-4xl border-2 border-[#f7c9a5] transition-transform duration-50 active:scale-95 cursor-pointer z-30"
          style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);"
      >
        <div
            class="w-10 h-10 bg-contain bg-no-repeat bg-center"
            :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"
        ></div>
        <span class="text-xs font-bold text-gray-600 pointer-events-none"></span>
      </div>
    </RouterLink>

    <!-- Игровая область карт -->
    <div v-if="gameStarted" class="flex flex-col items-center my-2 w-full">
      <div ref="playerCardsZone" class="flex items-center justify-center -top-12 w-full absolute">
        <!-- Пустышка, пока карт ещё нет -->
        <div
            v-if="!playerCards || playerCards.length === 0"
            class="card-render-wrapper w-12 h-17 relative shrink-0 rounded-sm border-2 border-dashed border-amber-300/70 bg-amber-950/20 pointer-events-none select-none"
        ></div>

        <!-- Сами карты, когда они появляются -->
        <template v-else>
          <div
              v-for="(card, index) in playerCards"
              :key="card.suit + card.name + index"
              class="card-render-wrapper w-16 h-17 -ml-10 first:ml-0 relative shrink-0"
          >
            <img
                :src="card.image"
                :alt="`${card.name} of ${card.suit}`"
                loading="eager"
                decoding="sync"
                class="w-full h-full object-contain drop-shadow-md pointer-events-none"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Бейдж счёта игрока + заглушка -->
    <div class="inline-flex items-center justify-center my-1 h-4">
      <span
          v-if="playerScore > 0"
          class="px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all"
          :class="typeof playerScoreText === 'string' ? 'bg-amber-950 text-amber-300 border border-amber-400' : 'bg-black/80 text-white'"
      >
        {{ typeof playerScoreText === 'string' ? $t(playerScoreText) : playerScoreText }}
      </span>

      <span
          v-else
          class="px-3 py-1 rounded-full text-xs font-bold bg-black/25 text-white/40 border border-white/10 select-none pointer-events-none"
      >
        0
      </span>
    </div>

    <div class="flex flex-col mt-1">

      <!-- БЛОК СТАВОК И УПРАВЛЕНИЯ РАУНДОМ (остаётся и в конце игры) -->
      <div
          v-if="gameStarted"
          class="flex flex-col items-center gap-2 duration-300 z-20"
      >
        <!-- Кнопки выбора суммы ставки: приглушены и некликабельны после ставки и в конце игры -->
        <div class="grid grid-cols-3 gap-1">
          <button
              v-for="bet in betOptions"
              :key="bet"
              type="button"
              @click="selectedBet = bet"
              :disabled="Boolean(currentBet) || gameFinished || !bettingPhase || isDealing || userCoins < bet"
              :class="[
                'px-3 py-1 rounded-lg font-bold text-sm transition border',
                (Boolean(currentBet) || gameFinished || !bettingPhase || isDealing || userCoins < bet)
                  ? ['pointer-events-none  ', bet === currentBet?'bg-amber-500 text-white border-amber-600 scale-105':'border-gray-200/40 bg-gray-200/40 text-amber-900/40']
                  : selectedBet === bet
                    ? 'bg-amber-500 text-white border-amber-600 scale-105 cursor-pointer'
                    : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50 cursor-pointer',
              ]"
          >
            {{ bet }}
          </button>
        </div>

        <!-- 1. До подтверждения ставки — кнопка "Поставить ставку" -->
        <button
            v-if="!gameFinished && !currentBet && (bettingPhase || isDealing)"
            type="button"
            @click="handleConfirmBet"
            :disabled="userCoins < selectedBet || isDealing"
            :class="[
              'w-35 px-5 py-1 rounded-xl transition text-white text-lg font-bold shadow-md disabled:opacity-50',
              (userCoins < selectedBet || isDealing)
                ? 'bg-gray-400 opacity-60 cursor-not-allowed pointer-events-none'
                : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 cursor-pointer'
            ]"
        >
          {{ $t('jackpot.place_bet_btn') }}
        </button>

        <!-- 2. В конце игры — кнопка "Начать заново" -->
        <button
            v-else-if="gameFinished"
            type="button"
            @click="handleRestart"
            :disabled="userCoins < 50"
            :class="[
              'w-35 h-10 rounded-lg font-bold text-sm shadow-lg transition z-20',
              userCoins < 50
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                : 'bg-yellow-400 hover:bg-yellow-300 active:scale-95 cursor-pointer'
            ]"
        >
          {{ userCoins >= 50 ? $t('jackpot.play_again_btn') : $t('jackpot.min_bet_50') }}
        </button>

        <!-- 3. Во время добора после ставки — Hit и Stand -->
        <div v-else class="flex gap-3 z-20">
          <button
              type="button"
              @click="handleHit"
              :disabled="isDealing"
              class="w-25 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition text-white text-lg font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {{ $t('jackpot.hit_btn') }}
          </button>

          <button
              type="button"
              @click="handleStand"
              :disabled="isDealing"
              class="w-25 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 active:scale-95 transition text-white text-lg font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {{ $t('jackpot.stand_btn') }}
          </button>
        </div>
      </div>

      <!-- КНОПКА СТАРТА (до начала партии) -->
      <button
          v-if="!gameStarted && !gameFinished"
          type="button"
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
        {{ userCoins >= 50 ? $t('jackpot.play_btn') : $t('jackpot.min_bet_50') }}
      </button>
    </div>
    <!-- Текст ставки -->
    <div class="w-21 h-15 absolute text-center -bottom-6 left-4 my-1 text-[10px] font-bold text-amber-900 z-20 ">
      <div
          v-if="gameStarted && currentBet"
          class="bg-amber-100  py-1 px-2 rounded-full border border-amber-300"
      >
        {{ $t('jackpot.bet_label', {bet: currentBet}) }}
      </div>
      <div
          v-else
          class="bg-amber-100/60 text-amber-900/60  py-1 px-2 rounded-full border border-amber-300/60 select-none pointer-events-none"
      >
        {{ $t('jackpot.bet_label', {bet: 0}) }}
      </div>
    </div>

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
```[cite: 6, 7]

Проверь теперь в финале раунда — кнопки ставок остаются полупрозрачными и заблокированными, а рядом появляется кнопка перезапуска[cite: 6, 7]?