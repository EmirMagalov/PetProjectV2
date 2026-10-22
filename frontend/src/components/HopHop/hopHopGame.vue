<script setup>
import {ref, onMounted, onUnmounted, computed} from 'vue'
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import {addCoin} from "@/scripts/actions.js";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {tgId} from "@/scripts/api.js";
import {isAdmin} from "@/scripts/useGameStore.js";

const isLoading = ref(true);

// --- НАСТРОЙКИ ПОЗИЦИЙ ---
const config = {
  shelfOffsetFromBottom: 140,
  trampolineVisualOffset: 200,
  bounceSurfaceOffset: 130,
  playerSpawnHeight: 60
}

// --- ИЗОБРАЖЕНИЯ ИГРЫ ---
const images = {
  player: new Image(),
  trampoline: new Image(),
  coin: new Image(),
  bun: new Image(),
  hotdog: new Image()
}

const imagesLoaded = {
  player: false,
  trampoline: false,
  coin: false,
  bun: false,
  hotdog: false
}

onMounted(() => {
  images.player.src = `/jumpGame/jumping_sausage.webp?v=${APP_VERSION}`;
  images.player.onload = () => {
    imagesLoaded.player = true
  };

  images.trampoline.src = `/jumpGame/trampoline.webp?v=${APP_VERSION}`;
  images.trampoline.onload = () => {
    imagesLoaded.trampoline = true
  };

  images.coin.src = `/gamePlay/coin.webp?v=${APP_VERSION}`;
  images.coin.onload = () => {
    imagesLoaded.coin = true
  };

  images.bun.src = `/jumpGame/hot_dog_bun.webp?v=${APP_VERSION}`;
  images.bun.onload = () => {
    imagesLoaded.bun = true
  };

  images.hotdog.src = `/jumpGame/hot_dog.webp?v=${APP_VERSION}`;
  images.hotdog.onload = () => {
    imagesLoaded.hotdog = true
  };

  setTimeout(() => {
    isLoading.value = false;
  }, 800);
});

// --- СОСТОЯНИЕ ИГРЫ ---
const gameState = ref('MENU')
const level = ref(1)
const score = ref(0)
const coinsEarned = ref(0)
const highScore = ref(Number(localStorage.getItem('flippy_highscore')) || 0)
const gameOverReason = ref('')

// --- CANVAS & РЕНДЕР ---
const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let lastTime = 0
let fps = 0
let frameCount = 0
let fpsTimer = 0
const FRAME_TIME = 1000 / 60
const SPEED = 2

// --- ИГРОК (СОСИСКА) ---
const player = {
  x: 180,
  y: 400,
  width: 60,
  height: 60,
  vy: 0,
  rotation: 0,
  vRot: 0,
  bounceForce: 3,
  maxBounceForce: 6
}

let shelfY = 480
let passTimer = 0
const trampolineWidth = 120
const bunWidth = 80
const bunHeight = 80
let particlesList = []
let coinsList = []
let trampolineBounceAnim = 0

// Управление
let isHolding = false
let holdTimer = null
let completedFlips = ref(0)

const isLevelGoalReached = computed(() => completedFlips.value >= level.value)

// Спавн 3 монет над батутом
const spawnCoins = (centerX, currentShelfY) => {
  coinsList = []
  const trampolineSurfaceY = currentShelfY - config.bounceSurfaceOffset
  for (let i = 0; i < 3; i++) {
    coinsList.push({
      x: centerX,
      y: trampolineSurfaceY - 270 - (i * 40),
      radius: 14,
      collected: false,
      floatOffset: Math.random() * Math.PI
    })
  }
}

// Запуск игры
const startGame = () => {
  level.value = 1
  score.value = 0
  coinsEarned.value = 0
  passTimer = 0
  trampolineBounceAnim = 0
  isHolding = false
  completedFlips.value = 0
  gameOverReason.value = ''
  if (holdTimer) clearTimeout(holdTimer)

  const canvas = canvasRef.value
  const logicalWidth = canvas ? canvas.clientWidth : 360
  const logicalHeight = canvas ? canvas.clientHeight : 600

  shelfY = logicalHeight - config.shelfOffsetFromBottom

  player.x = logicalWidth / 2
  player.bounceForce = 4.5
  const trampolineSurfaceY = shelfY - config.bounceSurfaceOffset
  player.y = trampolineSurfaceY - config.playerSpawnHeight
  player.vy = -player.bounceForce
  player.rotation = 0
  player.vRot = 0

  particlesList = []
  spawnCoins(logicalWidth / 2, shelfY)
  gameState.value = 'PLAYING'
  lastTime = 0
}

// --- УПРАВЛЕНИЕ ЗАЖАТИЕМ ---
const startFlip = (e) => {
  if (e) e.preventDefault()
  if (gameState.value !== 'PLAYING') return

  if (holdTimer) clearTimeout(holdTimer)
  holdTimer = setTimeout(() => {
    isHolding = true
  }, 100)
}

const stopFlip = (e) => {
  if (e) e.preventDefault()
  if (holdTimer) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
  isHolding = false
}

// Эффект разлома платформы
const createTrampolineShards = (x, y) => {
  for (let i = 0; i < 22; i++) {
    particlesList.push({
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 8 + 2,
      size: 4 + Math.random() * 6,
      alpha: 1,
      color: Math.random() > 0.5 ? '#0284c7' : '#f59e0b'
    })
  }
}

// Физический цикл
const updateGame = (dt = 1) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const logicalWidth = canvas.clientWidth || 360
  const logicalHeight = canvas.clientHeight || 600
  const targetShelfY = logicalHeight - config.shelfOffsetFromBottom

  const realDt = dt * SPEED

  if (trampolineBounceAnim > 0) trampolineBounceAnim -= 0.1 * realDt

  if (gameState.value === 'PLAYING') {
    player.vy += 0.06 * realDt
    player.y += player.vy * realDt

    if (isHolding) {
      player.vRot += 0.015 * realDt
      if (player.vRot > 0.10) player.vRot = 0.10
    } else {
      player.vRot *= Math.pow(0.8, realDt)
    }
    player.rotation += player.vRot * realDt

    completedFlips.value = Math.floor((Math.abs(player.rotation) + 0.25) / (Math.PI * 2))

    // Сбор монет
    coinsList.forEach(coin => {
      if (!coin.collected) {
        const dx = player.x - coin.x
        const floatY = coin.y + Math.sin(Date.now() * 0.006 + coin.floatOffset) * 4
        const dy = player.y - floatY
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < coin.radius + player.width / 2) {
          coin.collected = true
          addCoin(1)
          coinsEarned.value += 1
        }
      }
    })

    const trampolineSurfaceY = shelfY - config.bounceSurfaceOffset

    // Касание батута
    if (player.vy > 0 && player.y + player.height / 2 >= trampolineSurfaceY) {
      const centerX = logicalWidth / 2

      const distanceToCenter = Math.abs(player.x - centerX)
      const isOnTrampoline = distanceToCenter <= trampolineWidth / 2 + 5

      let normalizedAngle = player.rotation % (Math.PI * 2)
      if (normalizedAngle < 0) normalizedAngle += Math.PI * 2

      const isUpright = normalizedAngle < 0.6 || normalizedAngle > (Math.PI * 2 - 0.6)
      const isHeadLanding = Math.abs(normalizedAngle - Math.PI) < 1.2
      const isLeftSideLanding = Math.abs(normalizedAngle - (Math.PI * 1.2)) < 0.75

      if (isOnTrampoline) {
        if (isHeadLanding || isLeftSideLanding) {
          player.y = trampolineSurfaceY - player.height / 2
          triggerGameOver('Ударился головой!')
          return
        }

        if (!isHeadLanding && !isLeftSideLanding && completedFlips.value >= level.value) {
          score.value++
          level.value++
          addCoin(2)
          coinsEarned.value += 2

          gameState.value = 'PASSING'
          passTimer = 160
          createTrampolineShards(centerX, trampolineSurfaceY)

          // Подпрыгиваем вверх перед полётом в булочку
          player.vy = -6.2
          // player.vRot = 0
        } else {
          trampolineBounceAnim = 1
          player.y = trampolineSurfaceY - player.height / 2

          const targetFlips = level.value
          const halfFlipsNeeded = Math.ceil(targetFlips / 2) // Округляем вверх (для 3 уровней половина это 2)

          const reachedHalf = completedFlips.value >= halfFlipsNeeded || isHolding

          player.vRot = 0

          if (player.bounceForce < player.maxBounceForce) {
            if (reachedHalf) {
              // Набил половину или больше (или держал палец) — хороший буст к высоте
              player.bounceForce += 0.35
            } else {
              // Набил меньше половины — слабый прирост
              player.bounceForce += 0.2
            }
          }


          player.vy = -player.bounceForce
        }
      } else {
        player.y = trampolineSurfaceY - player.height / 2
        triggerGameOver('Промазал мимо батута!')
      }
    }
  }

  // ФАЗА УСПЕШНОГО ПРОХОЖДЕНИЯ
  if (gameState.value === 'PASSING') {
    passTimer -= realDt

    // Гравитация + полёт
    player.vy += 0.12 * realDt
    player.y += player.vy * realDt
    player.vRot = 0.09
    player.rotation += player.vRot * realDt
    // Плавный поворот в горизонталь (в булочку)
    // const targetAngle = Math.PI / 2
    // player.rotation += (targetAngle - player.rotation) * 0.12 * realDt
    // player.vRot = 0

    // Цель — центр булочки
    const bunTargetY = shelfY - config.bounceSurfaceOffset + 78

    // Когда долетели — останавливаем
    if (player.y >= bunTargetY) {
      player.y = bunTargetY
      player.vy = 0
    }

    if (passTimer <= 0) {
      shelfY = targetShelfY
      const newTrampolineSurfaceY = shelfY - config.bounceSurfaceOffset

      player.x = logicalWidth / 2
      player.y = newTrampolineSurfaceY - config.playerSpawnHeight
      player.bounceForce = 4.5
      player.vy = -player.bounceForce
      player.rotation = 0
      player.vRot = 0
      completedFlips.value = 0
      isHolding = false

      spawnCoins(logicalWidth / 2, targetShelfY)
      gameState.value = 'PLAYING'
    }
  }

  // Частицы
  for (let i = particlesList.length - 1; i >= 0; i--) {
    let p = particlesList[i]
    p.x += p.vx * realDt
    p.y += p.vy * realDt
    p.alpha -= 0.04 * realDt
    if (p.alpha <= 0) particlesList.splice(i, 1)
  }
}

const triggerGameOver = (reason = 'Не справился!') => {
  if (gameState.value === 'GAMEOVER') return
  gameState.value = 'GAMEOVER'
  gameOverReason.value = reason
  isHolding = false
  if (holdTimer) clearTimeout(holdTimer)
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('flippy_highscore', score.value)
  }
}

// Отрисовка
const drawGame = () => {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  const logicalWidth = canvas.clientWidth || 360
  const logicalHeight = canvas.clientHeight || 600

  ctx.clearRect(0, 0, logicalWidth, logicalHeight)

  const centerX = logicalWidth / 2
  const platformWidth = trampolineWidth + 500
  const platformHeight = 20
  const platformX = centerX - platformWidth / 2
  const platformY = shelfY - config.trampolineVisualOffset + 75

  ctx.save()

  ctx.fillStyle = '#C0C0C0'
  ctx.beginPath()
  ctx.roundRect(platformX, platformY, platformWidth, platformHeight, 10)
  ctx.fill()

  ctx.fillStyle = '#99CCFF'
  ctx.beginPath()
  ctx.roundRect(platformX, platformY, platformWidth, 5, [10, 10, 0, 0])
  ctx.fill()

  ctx.restore()

  // Булочка / хот-дог
  const bunX = centerX - bunWidth / 2
  const bunY = shelfY - config.bounceSurfaceOffset + 43
  const bunTargetY = shelfY - config.bounceSurfaceOffset + 78
  const isSausageLanded = gameState.value === 'PASSING' && player.y >= bunTargetY - 2

  if (isSausageLanded && imagesLoaded.hotdog) {
    ctx.drawImage(images.hotdog, bunX, bunY, bunWidth, bunHeight)
  } else if (imagesLoaded.bun) {
    ctx.drawImage(images.bun, bunX, bunY, bunWidth, bunHeight)
  }

  // Батут
  if (gameState.value !== 'PASSING' || passTimer > 12) {
    const trampX = centerX - trampolineWidth / 2
    const trampY = shelfY - config.trampolineVisualOffset + (trampolineBounceAnim * 4)

    if (imagesLoaded.trampoline) {
      ctx.drawImage(images.trampoline, trampX, trampY, trampolineWidth, 80)
    } else {
      ctx.fillStyle = '#0284c7'
      ctx.fillRect(trampX, trampY, trampolineWidth, 8)
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(trampX + 4, trampY - 2, trampolineWidth - 8, 4)
    }
  }

  // Монеты
  coinsList.forEach(coin => {
    if (!coin.collected) {
      ctx.save()
      const floatY = coin.y + Math.sin(Date.now() * 0.006 + coin.floatOffset) * 4

      if (imagesLoaded.coin) {
        ctx.drawImage(
            images.coin,
            coin.x - coin.radius,
            floatY - coin.radius,
            coin.radius * 2,
            coin.radius * 2
        )
      } else {
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.arc(coin.x, floatY, coin.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      ctx.restore()
    }
  })

  // Частицы
  particlesList.forEach(p => {
    ctx.save()
    ctx.globalAlpha = Math.max(0, p.alpha)
    ctx.fillStyle = p.color || '#f59e0b'
    ctx.fillRect(p.x, p.y, p.size, p.size)
    ctx.restore()
  })

  // Сосиска
  if (!isSausageLanded) {
    ctx.save()
    ctx.translate(player.x, player.y)
    ctx.rotate(player.rotation)

    if (imagesLoaded.player) {
      ctx.drawImage(
          images.player,
          -player.width / 2,
          -player.height / 2,
          player.width,
          player.height
      )
    } else {
      ctx.fillStyle = '#f97316'
      ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height)
    }

    ctx.restore()

    if (isAdmin.value) {
      ctx.fillStyle = '#00ff88'
      ctx.font = 'bold 14px monospace'
      ctx.fillText(`FPS: ${fps}`, 18, 100)
    }
  }
}

// Главный цикл
const loop = (timestamp) => {
  if (!lastTime) lastTime = timestamp

  const delta = timestamp - lastTime

  // Пропускаем лишние кадры, если телефон даёт 90/120 Гц
  if (delta < FRAME_TIME * 0.9) {
    animationFrameId = requestAnimationFrame(loop)
    return
  }

  lastTime = timestamp

  // Подсчёт FPS
  frameCount++
  fpsTimer += delta
  if (fpsTimer >= 1000) {
    fps = Math.round(frameCount * 1000 / fpsTimer)
    frameCount = 0
    fpsTimer = 0
  }

  const dt = Math.min(delta / FRAME_TIME, 3)

  updateGame(dt)
  drawGame()
  animationFrameId = requestAnimationFrame(loop)
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const container = canvas.parentElement
  const width = container.clientWidth || 360
  const height = container.clientHeight || 600
  const dpr = window.devicePixelRatio || 1

  canvas.width = width * dpr
  canvas.height = height * dpr
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
}

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    ctx = canvas.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    animationFrameId = requestAnimationFrame(loop)
  }
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (holdTimer) clearTimeout(holdTimer)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <div
      class="relative w-full max-w-[420px] bg-yellow-100 h-screen max-h-[800px] mx-auto overflow-hidden shadow-2xl select-none touch-none bg-slate-900 flex flex-col">
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
          Прыг-Скок...
        </span>
        <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    </Transition>

    <PetHeaderMenu/>
    <RouterLink to="/" class="absolute z-20 left-2 top-30 opacity-80">
      <div
          class="bg-[#fff6ef] h-15 w-15 flex flex-col items-center justify-center p-0.5 rounded-xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
        <div class="w-10 h-10 bg-contain bg-no-repeat bg-center"
             :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
      </div>
    </RouterLink>
    <div v-if="gameState === 'PASSING'" class="absolute inset-x-0 top-36 z-30 flex justify-center pointer-events-none">
      <div
          class="bg-emerald-500/90 text-white font-black text-2xl px-6 py-2 rounded-2xl shadow-xl animate-bounce border-2 border-emerald-300">
        В булочку! Отлично!
      </div>
    </div>

    <div class="absolute bottom-50 left-1/2 -translate-x-1/2 w-70 h-70">

      <img class="relative" :src="`/jumpGame/jumping_game_menu_background.webp?v=${APP_VERSION}`" alt="">
      <div class="absolute flex flex-col gap-1 mt-2 items-center top-10 right-10">
        <div>
          <span>Рекорд:</span>
          <span class="text-amber-400">{{ highScore }}</span>
        </div>

        <div v-if="gameState === 'PLAYING'" class="flex flex-col gap-1 items-center justify-center">
          <div class="text-xs font-black text-amber-400 uppercase tracking-widest">
            Уровень {{ level }}
          </div>
          <div
              class="text-xs p-1 rounded-2xl bg-slate-800/90 backdrop-blur-md font-extrabold transition-colors duration-150"
              :class="isLevelGoalReached ? 'text-emerald-400 animate-pulse' : 'text-slate-200'"
          >
            Сальто: {{ completedFlips }} / {{ level }}
          </div>
        </div>
      </div>
      <div class="absolute top-11 left-26 w-10 h-10">
        <img class="" src="/jumpGame/hop_hop_game_instructions_right.webp" alt="">
        <img class="" src="/jumpGame/hop_hop_game_instructions_wrong.webp" alt="">
      </div>
    </div>

    <div class="absolute inset-0 z-0 bg-transparent overflow-hidden pointer-events-none">
      <div
          class="absolute -bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-contain bg-bottom bg-no-repeat"
          :style="{
          backgroundImage: `url('/jumpGame/jumping_game_table_background.webp?v=${APP_VERSION}')`,
        }"
      ></div>
    </div>

    <canvas
        ref="canvasRef"
        class="relative z-10 flex-1 w-full h-full cursor-pointer bg-transparent"
        @mousedown="startFlip"
        @mouseup="stopFlip"
        @mouseleave="stopFlip"
        @touchstart="startFlip"
        @touchend="stopFlip"
        @touchcancel="stopFlip"
    ></canvas>

    <div v-if="gameState === 'MENU'"
         class="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-5 pointer-events-auto">
      <div
          class="bg-slate-800 border border-slate-700 w-full max-w-[300px] p-7 rounded-3xl text-center shadow-2xl flex flex-col gap-4 relative">
        <h1 class="text-2xl font-extrabold text-white m-0">Бунт Сосиски</h1>
        <p class="text-sm text-slate-400 m-0">Лови монетки в прыжке, делай сальто на ножки и запрыгивай в булочку!</p>

        <div v-if="highScore > 0" class="text-sm font-semibold text-slate-300 bg-slate-700/50 py-2 px-3 rounded-xl">
          Рекорд: <span class="text-amber-400 font-extrabold">{{ highScore }} уровней</span>
        </div>

        <button
            type="button"
            class="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base font-bold py-3 px-5 rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-transform cursor-pointer pointer-events-auto z-50"
            @click="startGame"
        >
          Играть
        </button>

        <RouterLink to="/" class="absolute -left-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
          <div
              class="bg-[#fff6ef] h-15 w-10 flex flex-col items-center justify-center p-0.5 rounded-l-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
            <div class="w-10 h-10 bg-contain bg-no-repeat bg-center"
                 :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
          </div>
        </RouterLink>
      </div>
    </div>

    <div v-if="gameState === 'GAMEOVER'"
         class="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-5 pointer-events-auto">
      <div
          class="bg-slate-800 border border-slate-700 w-full max-w-[300px] p-7 rounded-3xl text-center shadow-2xl flex flex-col gap-4 relative">
        <h2 class="text-2xl font-extrabold text-red-500 m-0">{{ gameOverReason }}</h2>

        <div class="flex flex-col gap-2 bg-slate-700/50 p-3 rounded-xl text-slate-300 text-sm">
          <div class="flex justify-between items-center">
            <span>Пройдено уровней:</span>
            <strong class="text-white text-lg">{{ score }}</strong>
          </div>
          <div class="flex justify-between items-center">
            <span>Монет получено:</span>
            <strong class="text-amber-400 text-lg">+{{ coinsEarned }}</strong>
          </div>
        </div>

        <button
            type="button"
            class="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-base font-bold py-3 px-5 rounded-2xl shadow-lg shadow-orange-500/30 active:scale-95 transition-transform cursor-pointer pointer-events-auto z-50"
            @click="startGame"
        >
          Ещё раз
        </button>

        <RouterLink to="/" class="absolute -left-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
          <div
              class="bg-[#fff6ef] h-15 w-10 flex flex-col items-center justify-center p-0.5 rounded-l-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
            <div class="w-10 h-10 bg-contain bg-no-repeat bg-center"
                 :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>