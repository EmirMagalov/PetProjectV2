<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import { addCoin } from "@/scripts/actions.js";
import { APP_VERSION } from "@/scripts/imageVersion.js";

const isLoading = ref(true);

// --- СОСТОЯНИЕ ИГРЫ ---
const gameState = ref('MENU') // 'MENU' | 'PLAYING' | 'GAMEOVER'
const score = ref(0)
const coinsEarned = ref(0)
const highScore = ref(Number(localStorage.getItem('food_catch_highscore')) || 0)
const lives = ref(3)
const maxLives = 3
const combo = ref(0)

// --- ВСПЛЫВАЮЩИЙ ТЕКСТ (HTML-попап) ---
const showPopup = ref(false)
const popupType = ref('perfect') // 'perfect' | 'normal' | 'miss'
const popupTitle = ref('')
const popupPoints = ref(0)
const popupCoins = ref(0)
let popupTimeout = null

// Состояния для вспышек пола
const isMissedFlash = ref(false)
let missFlashTimeout = null

const isComboFlash = ref(false)
let comboFlashTimeout = null

const triggerPopup = (type, title = '', points = 0, coins = 0) => {
  popupType.value = type
  popupTitle.value = title
  popupPoints.value = points
  popupCoins.value = coins
  showPopup.value = true

  if (popupTimeout) clearTimeout(popupTimeout)
  popupTimeout = setTimeout(() => {
    showPopup.value = false
  }, 1000)

  if (type === 'miss') {
    isMissedFlash.value = true
    if (missFlashTimeout) clearTimeout(missFlashTimeout)
    missFlashTimeout = setTimeout(() => {
      isMissedFlash.value = false
    }, 400)
  }
}

// --- CANVAS & RENDERING ---
const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let lastTime = 0
const FRAME_TIME = 1000 / 60
let isLoopRunning = false

// --- ИГРОВЫЕ ОБЪЕКТЫ И НАСТРОЙКИ ---
const FOOD_IMAGE_PATHS = [
  '/food/banana.webp',
  '/food/fri.webp',
  '/food/hotdog.webp',
  '/food/tako.webp',
  '/food/grape.webp',
  '/food/kiwi.webp',
  '/food/pizza.webp',
  '/food/burger.webp',
  '/food/lasagna.webp',
  '/food/lasagna.webp',
  '/food/salmon_roll.webp',
]

let loadedImages = []
let cartImage = null

let cart = {
  x: 90,
  y: 90,
  width: 90,
  height: 90,
  targetX: 0
}

let foods = []
let particles = []
let lastSpawnTime = 0
let spawnInterval = 1200
let isDragging = false
let pointerX = null

let audioCtx = null

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
}

const preloadAssets = () => {
  const foodPromises = FOOD_IMAGE_PATHS.map((path) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = path
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
    })
  })

  const cartPromise = new Promise((resolve) => {
    cartImage = new Image()
    cartImage.src = '/gamePlay/cart_icon.webp'
    cartImage.onload = () => {
      if (cartImage.naturalWidth > 0 && cartImage.naturalHeight > 0) {
        const ratio = cartImage.naturalHeight / cartImage.naturalWidth
        cart.height = cart.width * ratio
      }
      resolve(cartImage)
    }
    cartImage.onerror = () => resolve(null)
  })

  return Promise.all([Promise.all(foodPromises), cartPromise]).then(([imgs]) => {
    loadedImages = imgs.filter(img => img !== null)
  })
}

// --- Управление циклом ---
const startLoop = () => {
  if (isLoopRunning) return
  isLoopRunning = true
  lastTime = 0
  animationFrameId = requestAnimationFrame(loop)
}

const stopLoop = () => {
  isLoopRunning = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// --- ЛОГИКА ИГРЫ ---
const startGame = async () => {
  initAudio()

  if (loadedImages.length === 0) {
    await preloadAssets()
  }

  score.value = 0
  coinsEarned.value = 0
  lives.value = maxLives
  combo.value = 0
  foods = []
  particles = []
  showPopup.value = false
  isMissedFlash.value = false
  isComboFlash.value = false
  spawnInterval = 1200

  const canvas = canvasRef.value
  if (canvas) {
    const logicalWidth = canvas.clientWidth || 360
    const logicalHeight = canvas.clientHeight || 600

    cart.x = logicalWidth / 2 - cart.width / 2
    cart.targetX = cart.x
    cart.y = logicalHeight - cart.height - 230
  }

  gameState.value = 'PLAYING'
  lastSpawnTime = performance.now()
  startLoop()
}

const spawnFood = (timestamp) => {
  const canvas = canvasRef.value
  if (!canvas || loadedImages.length === 0) return

  const logicalWidth = canvas.clientWidth || 360
  const currentInterval = Math.max(700, spawnInterval - score.value * 4)

  if (timestamp - lastSpawnTime > currentInterval) {
    const imgObj = loadedImages[Math.floor(Math.random() * loadedImages.length)]
    const radius = 24
    const x = Math.random() * (logicalWidth - radius * 2) + radius

    const speedBonus = Math.floor(score.value / 500) * 0.8
    const maxBonusSpeed = 6
    const currentSpeedBonus = Math.min(speedBonus, maxBonusSpeed)

    const speed = 1.5 + Math.random() * 1.0 + currentSpeedBonus

    foods.push({
      x,
      y: -radius,
      radius,
      image: imgObj,
      speed,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.05
    })

    lastSpawnTime = timestamp
  }
}

const addParticles = (x, y, count = 8) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      size: 4 + Math.random() * 4,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`
    })
  }
}

const updateGame = (timestamp) => {
  const canvas = canvasRef.value
  if (!canvas || gameState.value !== 'PLAYING') return

  const logicalWidth = canvas.clientWidth || 360
  const logicalHeight = canvas.clientHeight || 600

  cart.x += (cart.targetX - cart.x) * 0.25
  cart.x = Math.max(0, Math.min(logicalWidth - cart.width, cart.x))

  spawnFood(timestamp)

  for (let i = foods.length - 1; i >= 0; i--) {
    const item = foods[i]
    item.y += item.speed
    item.rotation += item.rotSpeed

    const hitBoxPaddingX = 5
    const cartLeft = cart.x + hitBoxPaddingX
    const cartRight = (cart.x + cart.width) - hitBoxPaddingX
    const cartTop = cart.y + 15
    const cartBottom = cart.y + 20

    const isInsideX = item.x >= cartLeft && item.x <= cartRight
    const isInsideY = item.y + item.radius >= cartTop && item.y - item.radius <= cartBottom

    if (isInsideX && isInsideY) {
      const centerOffset = Math.abs(item.x - (cartLeft + (cartRight - cartLeft) / 2))
      const isPerfect = centerOffset < 15

      if (isPerfect) {
        combo.value++

        if (combo.value > 1) {
          isComboFlash.value = true
          if (comboFlashTimeout) clearTimeout(comboFlashTimeout)
          comboFlashTimeout = setTimeout(() => {
            isComboFlash.value = false
          }, 600)
        }

        const points = 10 * combo.value + 5
        score.value += points

        const earnedCoins = 2 * combo.value
        addCoin(earnedCoins)
        coinsEarned.value += earnedCoins

        triggerPopup('perfect', `+${points}`, points, earnedCoins)
        addParticles(item.x, item.y, 14)
      } else {
        combo.value = 1
        const points = 10
        score.value += points

        const earnedCoins = 1
        addCoin(earnedCoins)
        coinsEarned.value += earnedCoins

        triggerPopup('normal', `+${points}`, points, earnedCoins)
        addParticles(item.x, item.y, 8)
      }

      foods.splice(i, 1)
      continue
    }

    if (item.y - item.radius > cart.y + 60) {
      foods.splice(i, 1)
      combo.value = 0
      lives.value--
      triggerPopup('miss', 'ПРОМАХ!')

      if (lives.value <= 0) {
        if (score.value > highScore.value) {
          highScore.value = score.value
          localStorage.setItem('food_catch_highscore', score.value)
        }

        gameState.value = 'GAMEOVER'
        stopLoop()
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.alpha -= 0.02
    if (p.alpha <= 0) particles.splice(i, 1)
  }
}

// --- ОТРИСОВКА НА CANVAS ---
const drawGame = () => {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  const logicalWidth = canvas.clientWidth || 360
  const logicalHeight = canvas.clientHeight || 600

  ctx.clearRect(0, 0, logicalWidth, logicalHeight)

  ctx.save()
  if (cartImage && cartImage.complete && cartImage.naturalWidth > 0) {
    ctx.drawImage(cartImage, cart.x, cart.y, cart.width, cart.height)
  } else {
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(cart.x, cart.y, cart.width, cart.height)
  }
  ctx.restore()

  foods.forEach((item) => {
    ctx.save()
    ctx.translate(item.x, item.y)
    ctx.rotate(item.rotation)

    if (item.image) {
      const size = item.radius * 2
      ctx.drawImage(item.image, -size / 2, -size / 2, size, size)
    }

    ctx.restore()
  })

  particles.forEach((p) => {
    ctx.save()
    ctx.globalAlpha = Math.max(0, p.alpha)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

}

const loop = (timestamp) => {
  if (!isLoopRunning) return

  if (!lastTime) lastTime = timestamp
  const delta = timestamp - lastTime

  // Ограничиваем ~60 FPS
  if (delta < FRAME_TIME * 0.92) {
    animationFrameId = requestAnimationFrame(loop)
    return
  }

  lastTime = timestamp

  if (gameState.value === 'PLAYING') {
    updateGame(timestamp)
    drawGame()
  }

  animationFrameId = requestAnimationFrame(loop)
}

// --- УПРАВЛЕНИЕ ---
const handleTouchStart = (e) => {
  if (e.touches.length > 0) {
    isDragging = true
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    pointerX = e.touches[0].clientX - rect.left
  }
}

const handleTouchMove = (e) => {
  if (!isDragging || e.touches.length === 0) return
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const currentX = e.touches[0].clientX - rect.left

  const diffX = currentX - pointerX
  cart.targetX += diffX
  pointerX = currentX
}

const handleTouchEnd = () => {
  isDragging = false
  pointerX = null
}

const handleMouseDown = (e) => {
  isDragging = true
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  pointerX = e.clientX - rect.left
}

const handleMouseMove = (e) => {
  if (!isDragging) return
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const currentX = e.clientX - rect.left

  const diffX = currentX - pointerX
  cart.targetX += diffX
  pointerX = currentX
}

const handleMouseUp = () => {
  isDragging = false
  pointerX = null
}

const handleKeyDown = (e) => {
  if (gameState.value !== 'PLAYING') return
  const speed = 35
  if (e.key === 'ArrowLeft' || e.key === 'a') cart.targetX -= speed
  else if (e.key === 'ArrowRight' || e.key === 'd') cart.targetX += speed
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

  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
}

onMounted(() => {
  const canvas = canvasRef.value

  if (canvas) {
    ctx = canvas.getContext('2d')
    resizeCanvas()
    preloadAssets()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mouseup', handleMouseUp)
  }
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})

onUnmounted(() => {
  stopLoop()
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mouseup', handleMouseUp)
  if (popupTimeout) clearTimeout(popupTimeout)
  if (missFlashTimeout) clearTimeout(missFlashTimeout)
  if (comboFlashTimeout) clearTimeout(comboFlashTimeout)
})
</script>

<template>
  <div class="relative w-full max-w-[420px] h-screen max-h-[800px] mx-auto overflow-hidden shadow-2xl select-none touch-none bg-slate-100">

    <!-- Экран загрузки -->
    <Transition name="fade">
      <div v-if="isLoading" class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#ABD7DD] via-[#ABD7DD] to-blue-300 text-[#D18900]">
        <div class="relative flex items-center justify-center mb-4">
          <div class="absolute w-24 h-24 rounded-full bg-amber-500/20 animate-ping"></div>
          <div class="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-2xl animate-bounce">
            <div class="w-full h-full bg-[#FADCCC] rounded-full flex items-center justify-center border border-amber-300/40">
              <img :src="`/gamePlay/logo_icons.webp?v=${APP_VERSION}`" class="w-10 h-10 object-contain drop-shadow-md" alt="Loading..." />
            </div>
          </div>
        </div>
        <span class="text-[#D18900] font-extrabold tracking-widest text-sm uppercase drop-shadow-md animate-pulse">
          Идем ловить еду...
        </span>
        <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    </Transition>

    <PetHeaderMenu/>

    <!-- Фон супермаркета -->
    <div class="absolute bottom-30 z-0 pointer-events-none">
      <img :src="`/gamePlay/food_game_background.webp?v=${APP_VERSION}`" alt="Supermarket Background" class="w-full h-full object-cover" />
    </div>
    <div class="absolute top-20 left-1/2 -translate-x-1/2 z-0 pointer-events-none w-full flex justify-center">
      <img :src="`/gamePlay/chandelier.webp?v=${APP_VERSION}`" alt="Chandelier" class="w-80 h-auto object-contain" />
    </div>

    <!-- Игровой Canvas -->
    <canvas
        ref="canvasRef"
        class="relative z-10 block w-full h-full"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="handleTouchEnd"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
    ></canvas>

    <!-- Всплывающий попап -->
    <transition name="fade-down">
      <div v-if="showPopup" class="absolute top-[25%] left-1/2 -translate-x-1/2 pointer-events-none z-30">
        <div class="px-5 py-2.5 text-center animate-pulse">
          <div v-if="combo > 1" class="absolute -top-6 right-0 bg-amber-500 text-white font-extrabold text-md px-3 py-1 rounded-full shadow-lg">
            COMBO x{{ combo }}
          </div>
          <p v-if="popupType === 'miss'" class="text-4xl text-shadow-md text-shadow-black font-extrabold text-red-500 whitespace-nowrap drop-shadow-sm">
            {{ popupTitle }}
          </p>
          <div v-else class="flex items-center justify-center gap-2 whitespace-nowrap">
            <span class="text-4xl text-shadow-md text-shadow-black font-extrabold" :class="combo > 1 ? 'text-amber-500' : 'text-blue-400'">
              {{ popupTitle }}
            </span>
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg">
              <img src="/gamePlay/coin.webp" alt="coin" class="w-5 h-5 object-contain" />
              <span class="text-amber-800 font-extrabold text-2xl text-shadow-md text-shadow-black">+{{ popupCoins }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- HUD -->
    <div v-if="gameState === 'PLAYING'" class="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col gap-2 mt-22">
      <div class="flex justify-between items-center">
        <div class="flex gap-1 flex-col">
          <div class="bg-white/85 backdrop-blur-sm px-3.5 py-1.5 rounded-xl flex flex-col shadow-sm">
            <span class="text-[11px] text-slate-600 font-semibold uppercase">Очки</span>
            <span class="text-xl font-extrabold text-slate-900">{{ score }}</span>

          </div>
          <RouterLink to="/" class="pointer-events-auto opacity-80">
            <div class="bg-[#fff6ef] h-15 w-15 flex flex-col items-center justify-center p-0.5 rounded-xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
              <div class="w-10 h-10 bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
            </div>
          </RouterLink>
        </div>

        <div class="flex gap-1.5 items-center bg-white/85 backdrop-blur-sm px-3 py-2 rounded-xl">
          <img
              v-for="i in maxLives"
              :key="i"
              src="/gamePlay/chicken.webp"
              alt="heart"
              class="w-[22px] h-[22px] object-contain opacity-30 scale-90 transition-all duration-200"
              :class="{ 'opacity-100 scale-110': i <= lives }"
          />
        </div>
      </div>
    </div>

    <!-- МЕНЮ СТАРТА -->
    <div v-if="gameState === 'MENU'" class="absolute inset-0 bg-black/45 backdrop-blur-md z-40 flex items-center justify-center p-5">
      <div class="bg-white w-full max-w-[300px] p-7 rounded-3xl text-center shadow-2xl flex flex-col gap-4 relative">
        <h1 class="text-[26px] font-extrabold text-slate-900 m-0">Поймай еду</h1>
        <p class="text-sm text-slate-500 m-0">Лови падающую еду в тележку!</p>

        <div v-if="highScore > 0" class="text-[15px] font-semibold text-slate-700 bg-slate-100 py-2 px-3 rounded-xl">
          Рекорд: <span class="text-slate-900 font-extrabold">{{ highScore }}</span>
        </div>

        <button class="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-base font-bold border-none py-3 px-5 rounded-2xl cursor-pointer shadow-lg shadow-blue-500/35 active:scale-95 transition-transform" @click="startGame">
          Играть
        </button>

        <RouterLink to="/" class="absolute -left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <div class="bg-[#fff6ef] h-15 w-10 flex flex-col items-center justify-center p-0.5 rounded-l-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
            <div class="w-10 h-10 bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- ЭКРАН ПРОИГРЫША -->
    <div v-if="gameState === 'GAMEOVER'" class="absolute inset-0 bg-black/45 backdrop-blur-md z-40 flex items-center justify-center p-5">
      <div class="bg-white w-full max-w-[300px] p-7 rounded-3xl text-center shadow-2xl flex flex-col gap-4 relative">
        <h2 class="text-2xl font-extrabold text-red-600 m-0">Игра окончена!</h2>

        <div class="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl">
          <div class="flex justify-between items-center text-[15px] text-slate-600">
            <span>Счёт:</span>
            <strong>{{ score }}</strong>
          </div>
          <div class="flex justify-between items-center text-[15px] text-slate-600">
            <span>Заработано монет:</span>
            <div class="flex items-center gap-1">
              <img src="/gamePlay/coin.webp" alt="coin" class="w-4 h-4 object-contain" />
              <strong class="text-amber-600">{{ coinsEarned }}</strong>
            </div>
          </div>
          <div class="flex justify-between items-center text-[15px] text-slate-600">
            <span>Рекорд:</span>
            <strong>{{ highScore }}</strong>
          </div>
        </div>

        <button class="bg-gradient-to-r from-blue-500 to-blue-700 text-white text-base font-bold border-none py-3 px-5 rounded-2xl cursor-pointer shadow-lg shadow-blue-500/35 active:scale-95 transition-transform" @click="startGame">
          Попробовать снова
        </button>

        <RouterLink to="/" class="absolute -left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <div class="bg-[#fff6ef] h-15 w-10 flex flex-col items-center justify-center p-0.5 rounded-l-4xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
            <div class="w-10 h-10 bg-contain bg-no-repeat bg-center" :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Кафельный пол -->
    <div
        class="absolute bottom-0 h-33.5 w-full flex flex-col z-20 pointer-events-none transition-all duration-300 shadow-[inset_0_8px_16px_rgba(0,0,0,0.25)]"
        :class="{
          'shadow-[inset_0_-15px_30px_rgba(245,158,11,0.8),0_-10px_25px_rgba(245,158,11,0.9)]': isComboFlash,
          'shadow-[inset_0_-15px_30px_rgba(239,68,68,0.9),0_-10px_25px_rgba(239,68,68,0.9)]': isMissedFlash
        }"
    >
      <div
          class="h-2.5 border-t shadow-md transition-colors duration-300"
          :class="isMissedFlash ? 'bg-red-600 border-red-400 shadow-red-500/80' : (isComboFlash ? 'bg-orange-500 border-yellow-300 shadow-orange-500/80' : 'bg-slate-700 border-slate-500')"
      ></div>

      <div class="flex-1 w-full relative overflow-hidden bg-[#f8fafc] border-t-2 border-slate-300 [background-image:linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:40px_40px] [background-position:0_0,0_20px,20px_-20px,-20px_0px]">
        <div v-if="isComboFlash" class="absolute inset-0 pointer-events-none bg-gradient-to-t from-[rgba(245,158,11,0.7)] via-[rgba(251,191,36,0.5)] to-transparent animate-[flameFlicker_0.4s_infinite_alternate_ease-in-out]"></div>
        <div v-if="isMissedFlash" class="absolute inset-0 pointer-events-none bg-red-600/60 transition-opacity duration-300"></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes flameFlicker {
  0% {
    opacity: 0.7;
    transform: scaleY(1);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.05);
  }
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.fade-down-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.fade-down-leave-to {
  opacity: 0;
  transform: translateY(25px) scale(1.1);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.1) translateY(0px);
  }
}

.animate-pulse {
  animation: pulse 0.7s ease-in-out infinite;
}
</style>