<script setup>
import {onMounted, onUnmounted, ref} from "vue";
import {
  activeBadgeColor,
  activeBadgeText,
  activeCell, badgeKey,
  board,
  boardPixelSize, cellSize, cellStep, flatBoard, flyingKivano,
  gameState, gridCols, gridOffsetX, gridOffsetY, gridRows,
  isGameOver, isJellyLevel,
  isLevelPassed, isShuffling, isVictoryTriggered, kivanoImage, level,
  levelButtonsRef, levelProgressPercent, moves, nextLevelOrRestart,
  obstacleImage, onMouseDown, onTouchEnd,
  onTouchMove, onTouchStart, rainbowImage, remainingTargets, restartLevel, // 🌟 И restartLevel сюда
  score,
  scrollToCurrentLevel, selectLevel, startGame, stoneImage,
  updateBoardSize
} from "@/scripts/Match3Game/fruitGame.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {gameData} from "@/scripts/useGameStore.js";
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";

const isLoading = ref(true);

onMounted(() => {
  updateBoardSize()
  window.addEventListener('resize', updateBoardSize)
  scrollToCurrentLevel()
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateBoardSize)
})

</script>

<template>
  <div class="bg-green-300 min-h-screen pb-10">

    <Transition name="fade">
      <div v-if="isLoading"
           class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#ABD7DD] via-[#ABD7DD] to-blue-300 text-[#D18900]">
        <div class="relative flex items-center justify-center mb-4">
          <div class="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-ping"></div>
          <div
              class="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-2xl animate-bounce">
            <div
                class="w-full h-full bg-[#FADCCC] rounded-full flex items-center justify-center border border-amber-300/40">
              <img :src="`/gamePlay/logo_icons.webp?v=${APP_VERSION}`" class="w-10 h-10 object-contain drop-shadow-md"
                   alt="Loading..."/>
            </div>
          </div>
        </div>
        <span class="text-[#D18900] font-extrabold tracking-widest text-sm uppercase drop-shadow-md animate-pulse">
          {{ $t('loading') }}
        </span>
        <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    </Transition>

    <PetHeaderMenu/>

    <div class="flex flex-col items-center justify-center text-white select-none px-2 relative ">
      <RouterLink to="/" class="z-20 absolute top-4 -left-2 opacity-80 ">
        <div
            class="bg-[#fff6ef] ml-3 h-12 w-12 flex flex-col items-center justify-center p-0.5 rounded-xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
          <div class="w-8 h-8 bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
        </div>
      </RouterLink>

      <!-- Шапка игры -->

      <div class="w-full my-1 max-w-[440px]">
        <div class="bg-gradient-to-r h-21 from-pink-300 to-pink-400 rounded-2xl border-2 border-amber-50 px-4 pt-3 pb-2 text-lg font-bold shadow-md flex flex-col justify-center">
          <div>
            <div class="flex items-center justify-between px-8 mb-1">

              <!-- Осталось ходов (фиксируем ширину, чтобы цифры не двигали макет) -->
              <div class="flex flex-col items-center w-16">
                <span class="text-xs text-pink-900 font-extrabold uppercase tracking-wider">{{ $t('match3.moves') }}</span>
                <span class="text-3xl text-shadow-md text-shadow-red-500 tabular-nums">{{ moves }}</span>
              </div>

              <!-- Цель уровня (коробки / варенье) — по центру -->
              <div class="text-cyan-400 text-shadow-sm rounded-2xl bg-amber-100 px-4 py-1 text-shadow-black text-sm h-[52px] flex items-center justify-center min-w-[64px] border border-amber-200">
                <div v-if="(!isGameOver && !isLevelPassed) && gameState !== 'MENU' && !isVictoryTriggered"
                     class="relative flex items-center justify-center">
                  <img
                      :src="level === 1
                    ? `/gamePlay/match_fruit_icon.webp`
                    : (isJellyLevel ? `/food/strawberry_jam.webp` : `/gamePlay/a_crate_of_fruit.webp`)"
                      class="object-contain"
                      :class="level === 1 ? 'w-10' : 'w-8'"
                      alt=""
                  />
                  <span
                      v-show="level > 1"
                      class="absolute -bottom-2 -right-2 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow">
                  {{ remainingTargets }}
                </span>
                </div>
              </div>

              <!-- Текущий счет (фиксируем ширину и выравниваем по центру/правому краю) -->
              <div class="flex flex-col items-center w-20">
                <span class="text-xs text-pink-900 font-extrabold uppercase tracking-wider">{{ $t('match3.score') }}</span>
                <span class="text-2xl text-shadow-md text-shadow-yellow-600 text-yellow-100 tabular-nums">{{ score }}</span>
              </div>

            </div>

            <!-- 📊 Прогресс-бар уровня -->
            <div class="w-full bg-black/20 rounded-full h-3.5 p-0.5 mb-1 overflow-hidden border border-white/30 shadow-inner">
              <div
                  class="bg-gradient-to-r from-yellow-400 to-amber-500 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  :style="{ width: levelProgressPercent + '%' }"
              ></div>
            </div>
          </div>

        </div>
      </div>

      <!-- Игровое поле (адаптивное) -->
      <div
          class="relative bg-[#D3E9F0] rounded-xl shadow-2xl border-4 border-gray-700 overflow-hidden flex items-center justify-center"
          :style="{
            width: boardPixelSize + 'px',
            height: boardPixelSize + 'px',
            backgroundImage: `url('/gamePlay/match3_game_background.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }"
      >
        <!-- Слой 1: Статичная сетка подложек -->
        <div class="absolute inset-0 pointer-events-none" style="padding: 10px;">
          <template v-for="(row, r) in board" :key="'bg-row-' + r">
            <template v-for="(cell, c) in row" :key="'bg-' + r + '-' + c">
              <div
                  v-if="cell !== null && cell !== undefined && r < gridRows && c < gridCols"
                  class="absolute rounded-xl bg-blue-300/80 border border-white/10"
                  :style="{
                    width: cellSize + 'px',
                    height: cellSize + 'px',
                    left: (c * cellStep + 10 + gridOffsetX) + 'px',
                    top: (r * cellStep + 10 + gridOffsetY) + 'px'
                  }"
              ></div>
            </template>
          </template>
        </div>

        <!-- Слой 2: Фрукты, Коробки, Лед и Варенье -->
        <TransitionGroup
            name="candy"
            tag="div"
            class="absolute inset-0 pointer-events-auto"
            style="padding: 10px;"
        >
          <div
              v-for="cell in flatBoard"
              :key="cell.id"
              @touchstart.prevent="onTouchStart($event, cell.r, cell.c)"
              @touchmove.prevent="onTouchMove($event)"
              @touchend.prevent="onTouchEnd($event)"
              @mousedown="onMouseDown($event, cell.r, cell.c)"
              class="flex items-center justify-center rounded-xl cursor-grab active:cursor-grabbing absolute select-none z-10"
              :class="{
                  'bg-yellow-300/10 z-30': activeCell?.r === cell.r && activeCell?.c === cell.c,
                  'animate-shake': isShuffling && !cell.obstacle && cell.jelly === 0 && !cell.unbreakable && !cell.chained,
                  'rainbow-blink': cell.isBlinking   /* ← добавить эту строку */
                }"
              :style="{
                width: cellSize + 'px',
                height: cellSize + 'px',
                left: (cell.c * cellStep + 10 + gridOffsetX) + 'px',
                top: (cell.r * cellStep + 10 + gridOffsetY) + 'px'
              }"
          >
            <div v-if="cell.jelly > 0" class="relative w-full h-full flex items-center justify-center">
              <img
                  :src="cell.jellyImage"
                  class="object-contain drop-shadow-md pointer-events-none rounded-lg border-2 border-pink-500"
                  :style="{ width: (cellSize * 0.95) + 'px', height: (cellSize * 0.95) + 'px' }"
                  alt="jelly block"
              />
            </div>
            <img
                v-else-if="cell.unbreakable"
                :src="stoneImage"
                class="object-contain drop-shadow-md pointer-events-none opacity-90"
                :style="{ width: (cellSize * 0.85) + 'px', height: (cellSize * 0.85) + 'px' }"
                alt="unbreakable"
            />
            <img
                v-else-if="cell.obstacle"
                :src="obstacleImage"
                class="object-contain drop-shadow-md pointer-events-none"
                :style="{ width: (cellSize * 0.95) + 'px', height: (cellSize * 0.95) + 'px' }"
                alt="obstacle"
            />
            <img
                v-else-if="cell.isRainbow"
                :src="rainbowImage"
                class="animate-bounce brightness-200 object-contain drop-shadow-md pointer-events-none"
                :style="{ width: (cellSize * 0.9) + 'px', height: (cellSize * 0.9) + 'px' }"
                alt="rainbow"
            />
            <img
                v-else-if="cell.isKivano"
                :src="kivanoImage"
                class="animate-bounce brightness-100 object-contain drop-shadow-md pointer-events-none"
                :style="{ width: (cellSize * 0.9) + 'px', height: (cellSize * 0.9) + 'px' }"
                alt="kivano"
            />
            <div v-else-if="cell.type" class="relative w-full h-full flex items-center justify-center">
              <img
                  :src="cell.type"
                  class="object-contain drop-shadow-md pointer-events-none"
                  :style="{ width: (cellSize * 0.92) + 'px', height: (cellSize * 0.92) + 'px' }"
                  alt="candy"
              />
              <div v-if="cell.chained" class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                <img class="opacity-80" :style="{ width: (cellSize * 0.55) + 'px' }" src="/gamePlay/lock.webp" alt="">
              </div>
            </div>
          </div>
        </TransitionGroup>

        <!-- Анимационный слой для летящего Кивано -->
        <div v-if="flyingKivano" class="absolute inset-0 pointer-events-none z-50" style="padding: 10px;">
          <img
              :src="kivanoImage"
              class="absolute object-contain drop-shadow-2xl kivano-flying-anim"
              :style="{
                width: (cellSize * 0.9) + 'px',
                height: (cellSize * 0.9) + 'px',
                '--start-x': (flyingKivano.startX * cellStep + gridOffsetX) + 'px',
                '--start-y': (flyingKivano.startY * cellStep + gridOffsetY) + 'px',
                '--end-x': (flyingKivano.endX * cellStep + gridOffsetX) + 'px',
                '--end-y': (flyingKivano.endY * cellStep + gridOffsetY) + 'px',
              }"
              alt="flying kivano"
          />
        </div>

        <!-- Плашка -->
        <transition name="badge-fade" :key="badgeKey">
          <div
              v-if="activeBadgeText"
              class="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden"
          >
            <div
                class="floating-up text-shadow-md text-shadow-white font-black text-3xl sm:text-4xl uppercase px-5 py-3 flex items-center gap-2 whitespace-nowrap"
                :class="activeBadgeColor"
            >
              <span>{{ $t(activeBadgeText) }}</span>
            </div>
          </div>
        </transition>

        <!-- Победный экран -->
        <transition name="badge-fade">
          <div
              v-if="isLevelPassed"
              class="absolute inset-0 z-50 bg-linear-to-l from-purple-800 to-purple-950 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div class="text-2xl font-black text-yellow-400 mb-2 animate-bounce">{{ $t('match3.level_passed') }}</div>

            <!-- ⭐ Вывод картинок-звезд на победном экране -->
            <div class="flex gap-2 mb-3 items-center justify-center">
              <img
                  v-for="s in 3"
                  :key="s"
                  :src="s <= (gameData.match3_stars?.[level - 1] || 1) ? '/gamePlay/star_icon.webp' : '/gamePlay/star_empty_icon.webp'"
                  class="w-8 h-8 object-contain drop-shadow-md"
                  alt="star"
              />
            </div>
            <p class="text-gray-300 text-sm mb-1">{{ $t('match3.great_job') }}</p>

            <div class="bg-pink-300 border-2 border-gray-700 rounded-xl p-4 w-full max-w-xs mb-6 text-left space-y-2">
              <div class="flex justify-between">
                <span class="text-white">{{ $t('match3.level_label') }}</span>
                <span class="font-bold text-pink-400 text-shadow-md text-shadow-black">{{ level - 1 }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white">{{ $t('match3.earned_score') }}</span>
                <span class="font-bold text-green-400 text-shadow-md text-shadow-black">{{ score }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white">{{ $t('match3.earned_score') }}</span>
                <span class="font-bold text-blue-400 text-shadow-md text-shadow-black">{{
                    Math.floor(score / 10)
                  }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white">{{ $t('match3.earned_coins') }}</span>
                <span class="font-bold text-yellow-400 text-shadow-md text-shadow-black">{{
                    Math.floor(score / 5)
                  }}</span>
              </div>
            </div>

            <button
                @click="nextLevelOrRestart"
                class="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-lg rounded-full shadow-2xl hover:opacity-90 active:scale-95 transition-all"
            >
              {{ $t('match3.next_level') }}
            </button>
          </div>
        </transition>

        <!-- Экран проигрыша -->
        <transition name="badge-fade">
          <div
              v-if="isGameOver"
              class="absolute inset-0 z-50 bg-linear-to-l from-red-900 to-purple-950 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div class="text-2xl font-black text-red-400 mb-2 animate-bounce">{{ $t('match3.no_moves') }}</div>

            <div
                class="bg-pink-300 border-2 border-gray-700 rounded-xl p-4 w-full max-w-xs mb-6 text-left space-y-2 mt-2">
              <div class="flex justify-between">
                <span class="text-white">{{ $t('match3.level_label') }}</span>
                <span class="font-bold text-pink-400 text-shadow-md text-shadow-black">{{ level }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white">{{ $t('match3.earned_score') }}</span>
                <span class="font-bold text-yellow-400 text-shadow-md text-shadow-black">{{ score }}</span>
              </div>
            </div>

            <button
                @click="restartLevel"
                class="px-8 py-3 bg-gradient-to-r from-amber-500 to-red-600 font-bold text-lg rounded-full shadow-2xl hover:opacity-90 active:scale-95 transition-all text-white"
            >
              {{ $t('match3.restart_level') }}
            </button>
          </div>
        </transition>

        <!-- МЕНЮ СТАРТА -->
        <div v-if="gameState === 'MENU'"
             class="absolute inset-0 bg-pink-200/50 backdrop-blur-md z-50 flex items-center justify-center p-5">
          <div
              class="bg-white w-full max-w-[300px] p-7 rounded-3xl text-center shadow-2xl flex flex-col gap-4 relative">
            <h1 class="text-[26px] font-extrabold text-shadow-md text-shadow-red-500 text-pink-300  m-0">
              {{ $t('match3.level_label') }} {{ level }}</h1>

            <button
                class="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-base font-bold border-none py-3 px-5 rounded-2xl cursor-pointer shadow-lg shadow-pink-500/35 active:scale-95 transition-transform"
                @click="startGame"
            >
              {{ $t('match3.play_btn') }}
            </button>

            <RouterLink to="/" class="absolute -left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
              <div
                  class="bg-[#fff6ef] h-15 w-10 flex flex-col items-center justify-center p-0.5 rounded-l-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
                <div class="w-10 h-10 bg-contain bg-no-repeat bg-center"
                     :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
              </div>
            </RouterLink>
          </div>
        </div>

      </div>

      <!-- 🎮 ЛЕНТА ПРОКРУТКИ УРОВНЕЙ СНИЗУ -->
      <div
          class="mt-4 w-full max-w-[440px] mx-auto bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg box-border">
        <div class="w-full overflow-hidden">
          <div
              class="flex gap-2 overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-pink-400 scrollbar-track-transparent w-full">
            <button
                v-for="i in gameData.match3_level"
                :key="i"
                :ref="el => { if (el) levelButtonsRef[i] = el }"
                @click="selectLevel(i)"
                class="min-w-[42px] h-[42px] rounded-xl flex items-center justify-center font-black text-sm shadow-md transition-all  shrink-0"
                :class="{
                  'bg-gradient-to-tr from-yellow-400 to-amber-500 text-white border border-yellow-200 scale-105': level === i,
                  'bg-gradient-to-tr from-pink-500 to-purple-600 text-white hover:opacity-90': level !== i
                }"
            >
              {{ i }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.candy-move {
  transition: transform 0.4s ease-in-out;
}

.candy-enter-active {
  transition: all 0.3s ease;
}

.candy-enter-from {
  opacity: 0;
  transform: scale(0);
}

.badge-fade-enter-active {
  transition: opacity 0.2s ease;
}

.badge-fade-leave-active {
  transition: opacity 0.3s ease;
}

.badge-fade-enter-from,
.badge-fade-leave-to {
  opacity: 0;
}

.badge-fade-enter-to,
.badge-fade-leave-from {
  opacity: 0.9;
}

.floating-up {
  animation: moveUp 1.8s cubic-bezier(0, 0.55, 0.45, 1) forwards;
}

@keyframes moveUp {
  0% {
    transform: translateY(20px) scale(0.8);
    opacity: 0;
  }
  20% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  80% {
    transform: translateY(-80px) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-120px) scale(0.9);
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  20% {
    transform: translate(-2px, 1px) rotate(-3deg);
  }
  40% {
    transform: translate(2px, -1px) rotate(3deg);
  }
  60% {
    transform: translate(-2px, -1px) rotate(-2deg);
  }
  80% {
    transform: translate(2px, 1px) rotate(2deg);
  }
}

.animate-shake {
  animation: shake 0.15s infinite;
}

@keyframes explode {
  0% {
    transform: scale(1);
    filter: brightness(1);
    opacity: 1;
  }
  40% {
    transform: scale(1.4);
    filter: brightness(2.5);
    opacity: 0.9;
  }
  100% {
    transform: scale(0);
    filter: brightness(1);
    opacity: 0;
  }
}

.candy-leave-active {
  animation: explode 0.35s ease-out forwards;
  position: absolute;
  z-index: 20;
}

/* Мигание перед взрывом драгонфрута */
@keyframes rainbowBlink {
  0%, 100% {
    opacity: 1;
    filter: brightness(1) drop-shadow(0 0 0 transparent);
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    filter: brightness(2.2) drop-shadow(0 0 8px #66ff66);
    transform: scale(1.08);
  }
}

.rainbow-blink {
  animation: rainbowBlink 0.3s ease-in-out 3; /* мигает 3 раза */
  z-index: 25 !important;
}

@keyframes kivanoFlight {
  0% {
    transform: translate(var(--start-x), var(--start-y)) scale(1) rotate(0deg);
  }
  40% {
    /* Быстро поднимаемся и проходим большую часть пути */
    transform: translate(
        calc(var(--start-x) + (var(--end-x) - var(--start-x)) * 0.55),
        calc(var(--start-y) + (var(--end-y) - var(--start-y)) * 0.55 - 40px)
    ) scale(1.15) rotate(140deg);
  }
  70% {
    /* Начинаем плавно снижаться */
    transform: translate(
        calc(var(--start-x) + (var(--end-x) - var(--start-x)) * 0.82),
        calc(var(--start-y) + (var(--end-y) - var(--start-y)) * 0.82 - 18px)
    ) scale(1.08) rotate(260deg);
  }
  100% {
    /* Медленный и мягкий финальный подлёт */
    transform: translate(var(--end-x), var(--end-y)) scale(1) rotate(360deg);
  }
}

.kivano-flying-anim {
  animation: kivanoFlight 1.6s cubic-bezier(0.33, 0.1, 0.25, 1) forwards;
  will-change: transform;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-10%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.animate-bounce {
  animation: bounce 0.9s infinite;
}
</style>