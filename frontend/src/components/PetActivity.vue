<script setup>
import {useRouter} from "vue-router";
import {gameData, location, tutorialStep} from "@/scripts/useGameStore.js";
import {isFortuneOpen} from "@/scripts/fortune.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {currentBet} from "@/scripts/saloonScripts/twentyOneGame.js";
import i18n from "@/scripts/locales/i18n.js";

const router = useRouter();
function goToSaloon() {
  const coins = Number(gameData?.value?.coins ?? gameData?.coins) || 0;
  if (coins < 50 && !currentBet.value) {
    alert(i18n.global.t('minigames_access.jackpot_min_coins'));
    return;
  }
  if (gameData.foodLevel < 3) {
    alert(i18n.global.t('minigames_access.jackpot_fed'));
    return;
  }
  if (gameData.energy < 3) {
    alert(i18n.global.t('minigames_access.jackpot_energy'));
    return;
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    window.location.href = '/saloon';
  } else {
    // router.push('/saloon');
    window.location.href = '/saloon';
  }
}

function goToCatchTheFood() {
  if (gameData.foodLevel < 3) {
    alert(i18n.global.t('minigames_access.food_catch_fed'));
    return;
  }
  if (gameData.energy < 3) {
    alert(i18n.global.t('minigames_access.food_catch_energy'));
    return;
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    window.location.href = '/thefoodgame';
  } else {
    // router.push('/thefoodgame');
    window.location.href = '/thefoodgame';
  }
}

function Match3Game() {
  if (gameData.foodLevel < 3) {
    alert(i18n.global.t('minigames_access.fruit_fresh_fed'));
    return;
  }
  if (gameData.energy < 3) {
    alert(i18n.global.t('minigames_access.fruit_fresh_energy'));
    return;
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    window.location.href = '/match3game';
  } else {
    window.location.href = '/match3game';
  }
}
</script>

<template>
  <div v-show="gameData.level>1" class="absolute gap-1 z-40 flex flex-col right-1 top-30">
    <div @click="isFortuneOpen = true" class="bg-purple-300/50 overflow-hidden rounded-4xl border-2 border-purple-400 cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
      <div class="h-8 w-8 bg-contain bg-no-repeat bg-center" :style="{ backgroundImage: `url('/gamePlay/fortune_icons.webp?v=${APP_VERSION}')` }"></div>
    </div>
    <div class="relative rounded-4xl overflow-hidden cursor-pointer z-40" @click="gameData.level >= 10 && goToSaloon()">
      <div v-if="gameData.level < 10" class="absolute inset-0 z-30 bg-slate-950/50 flex flex-col items-center justify-center text-center pointer-events-none">
        <span class="text-amber-400 font-bold text-[7px] tracking-wide leading-tight">🔒 10 lvl</span>
      </div>
      <div class="bg-red-300/50 overflow-hidden rounded-4xl border-2 border-red-600" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
        <div class="h-8 w-8 bg-contain bg-no-repeat bg-center" :style="{ backgroundImage: `url('/gamePlay/jackpot_icon.webp?v=${APP_VERSION}')` }"></div>
      </div>
    </div>
    <div @click="goToCatchTheFood()" class="bg-orange-300/50 overflow-hidden rounded-4xl border-2 border-orange-400 cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
      <div class="h-8 w-8 bg-contain bg-no-repeat bg-center" :style="{ backgroundImage: `url('/gamePlay/cart_for_game.webp?v=${APP_VERSION}')` }"></div>
    </div>
    <div @click="Match3Game()" class="bg-green-300/50 relative overflow-hidden rounded-4xl border-2 border-yellow-400 cursor-pointer" style="box-shadow: inset 0 -4px 1px -1px rgba(0, 0, 0, 0.2);">
      <div class="h-8 w-8 bg-contain bg-no-repeat bg-center" :style="{ backgroundImage: `url('/gamePlay/fruit_fresh_icon.webp?v=${APP_VERSION}')` }"></div>
      <div class="absolute inset-0 z-20 flex flex-col items-center justify-end pb-0.5 text-center pointer-events-none bg-black/10">
        <span class="text-amber-400 font-bold text-[7px] text-shadow-md text-shadow-black">Beta</span>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>