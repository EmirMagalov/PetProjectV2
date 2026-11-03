<script setup>
import {ref, computed, onMounted, nextTick} from 'vue'

const BOARD_SIZE = computed(() => (level.value < 10 ? 6 : 8))

const CANDIES = [
  '/food/banana.webp',
  '/food/apple.webp',
  '/food/watermelon.webp',
  '/food/strawberry.webp',
  '/food/grape.webp',
  '/food/pomegranate.webp',
]

const rainbowImage = '/food/dragonfruit.webp'
const obstacleImage = '/gamePlay/a_crate_of_fruit.webp'
const stoneImage = '/gamePlay/ice_cube.webp'

let nextId = 1
let calculatedMoves = 0
const level = ref(15)
const score = ref(0)
const moves = ref(10)
const board = ref([])
const isProcessing = ref(false)
const isLevelPassed = ref(false)

let activeCell = ref(null)
let startX = 0
let startY = 0

const remainingObstacles = computed(() => {
  let count = 0
  for (let r = 0; r < BOARD_SIZE.value; r++) {
    for (let c = 0; c < BOARD_SIZE.value; c++) {
      if (board.value[r]?.[c]?.obstacle) count++
    }
  }
  return count
})

const flatBoard = computed(() => {
  const list = []
  for (let r = 0; r < BOARD_SIZE.value; r++) {
    for (let c = 0; c < BOARD_SIZE.value; c++) {
      const cell = board.value[r]?.[c]
      if (cell) {
        list.push({...cell, r, c})
      }
    }
  }
  return list
})

function createCell(type = null, obstacle = null, isRainbow = false, unbreakable = false, chained = false) {
  return {
    id: nextId++,
    type: type,
    obstacle: obstacle,
    isRainbow: isRainbow,
    unbreakable: unbreakable,
    chained: chained
  }
}

function initLevel() {
  isLevelPassed.value = false
  score.value = 0
  activeCell.value = null

  let tempBoard = []
  let targetObstaclesCount = 0

  do {
    tempBoard = Array.from({length: BOARD_SIZE.value}, () =>
        Array.from({length: BOARD_SIZE.value}, () => createCell(null, null))
    )

    let targetStones = 0
    // 🧊 Спавн неразрушимых блоков (начиная с 10 уровня)
    if (level.value >= 10) {
      let spawnedStones = 0
      const minStones = 2
      const maxStonesLimit = 6
      targetStones = Math.min(
          maxStonesLimit,
          minStones + Math.floor((level.value - 10) / 3)
      )

      while (spawnedStones < targetStones) {
        const r = Math.floor(Math.random() * BOARD_SIZE.value)
        const c = Math.floor(Math.random() * BOARD_SIZE.value)
        if (!tempBoard[r][c].obstacle && !tempBoard[r][c].unbreakable) {
          tempBoard[r][c].unbreakable = true
          tempBoard[r][c].type = null
          spawnedStones++
        }
      }
    }

    // 📦 Спавн обычных препятствий (коробок)
    if (level.value >= 2) {
      const minObstacles = 3
      const maxGlobalLimit = 12
      targetObstaclesCount = Math.min(
          maxGlobalLimit,
          minObstacles + Math.floor((level.value - 2) / 2)
      )

      let spawned = 0
      while (spawned < targetObstaclesCount) {
        const r = Math.floor(Math.random() * BOARD_SIZE.value)
        const c = Math.floor(Math.random() * BOARD_SIZE.value)

        if (!tempBoard[r][c].obstacle && !tempBoard[r][c].unbreakable) {
          tempBoard[r][c].obstacle = true
          tempBoard[r][c].type = null
          spawned++
        }
      }
    }

    for (let r = 0; r < BOARD_SIZE.value; r++) {
      for (let c = 0; c < BOARD_SIZE.value; c++) {
        if (!tempBoard[r][c].obstacle && !tempBoard[r][c].unbreakable) {
          tempBoard[r][c].type = CANDIES[Math.floor(Math.random() * CANDIES.length)]
        }
      }
    }

    // ⛓️ Спавн цепей (начиная с 15 уровня)
    if (level.value >= 15) {
      let spawnedChains = 0
      const targetChains = Math.min(4, 1 + Math.floor((level.value - 15) / 3))

      let attempts = 0
      while (spawnedChains < targetChains && attempts < 100) {
        attempts++
        const r = Math.floor(Math.random() * BOARD_SIZE.value)
        const c = Math.floor(Math.random() * BOARD_SIZE.value)
        const cell = tempBoard[r][c]
        if (!cell.obstacle && !cell.unbreakable && !cell.chained && cell.type) {
          cell.chained = true
          spawnedChains++
        }
      }
    }

  } while (findMatchGroups(tempBoard).matches.length > 0)

  board.value = tempBoard

  // 📐 РАСЧЕТ ХОДОВ:
  if (level.value === 1) {
    moves.value = 10
  } else {
    const activeStones = level.value >= 10 ? Math.min(6, 2 + Math.floor((level.value - 10) / 3)) : 0
    const activeChains = level.value >= 15 ? Math.min(4, 1 + Math.floor((level.value - 15) / 3)) : 0

    calculatedMoves = Math.ceil(15 + (targetObstaclesCount * 1.3) + (activeStones * 1.5) + (activeChains * 1.5))
    moves.value = calculatedMoves
  }

  shuffleBoardIfDeadlock()
}

function nextLevelOrRestart() {
  if (isLevelPassed.value) {
    level.value++
  }
  initLevel()
}

function hasValidMoves(currentBoard) {
  const rows = currentBoard.length
  const cols = currentBoard[0].length

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = currentBoard[r][c]
      if (cell.obstacle || cell.unbreakable || cell.chained || (!cell.type && !cell.isRainbow)) continue

      const directions = [{dr: 0, dc: 1}, {dr: 1, dc: 0}]
      for (let dir of directions) {
        const nr = r + dir.dr
        const nc = c + dir.dc

        if (nr < rows && nc < cols) {
          const neighbor = currentBoard[nr][nc]
          if (neighbor.obstacle || neighbor.unbreakable || neighbor.chained || (!neighbor.type && !neighbor.isRainbow)) continue

          const tempType = cell.type
          const tempRainbow = cell.isRainbow

          cell.type = neighbor.type
          cell.isRainbow = neighbor.isRainbow
          neighbor.type = tempType
          neighbor.isRainbow = tempRainbow

          const matchCheck = findMatchGroups(currentBoard)
          const hasMatch = matchCheck.matches.length > 0 || matchCheck.fiveInRowMatches.length > 0

          neighbor.type = cell.type
          neighbor.isRainbow = cell.isRainbow
          cell.type = tempType
          cell.isRainbow = tempRainbow

          if (hasMatch) return true
        }
      }
    }
  }
  return false
}

function shuffleBoardIfDeadlock() {
  let safetyCounter = 0
  while (!hasValidMoves(board.value) && safetyCounter < 10) {
    safetyCounter++
    const candyItems = []

    for (let r = 0; r < BOARD_SIZE.value; r++) {
      for (let c = 0; c < BOARD_SIZE.value; c++) {
        const cell = board.value[r][c]
        if (!cell.obstacle && !cell.unbreakable && !cell.chained && (cell.type || cell.isRainbow)) {
          candyItems.push({type: cell.type, isRainbow: cell.isRainbow})
        }
      }
    }

    for (let i = candyItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candyItems[i], candyItems[j]] = [candyItems[j], candyItems[i]]
    }

    let index = 0
    for (let r = 0; r < BOARD_SIZE.value; r++) {
      for (let c = 0; c < BOARD_SIZE.value; c++) {
        const cell = board.value[r][c]
        if (!cell.obstacle && !cell.unbreakable && !cell.chained && (cell.type || cell.isRainbow)) {
          const item = candyItems[index++]
          board.value[r][c] = {
            ...cell,
            id: nextId++,
            type: item.type,
            isRainbow: item.isRainbow
          }
        }
      }
    }
  }

  if (!hasValidMoves(board.value)) {
    initLevel()
  }
}

function findMatchGroups(currentBoard) {
  const allMatchedCoords = new Set()
  const fiveInRowMatches = []

  for (let r = 0; r < BOARD_SIZE.value; r++) {
    let c = 0
    while (c < BOARD_SIZE.value) {
      const currentType = currentBoard[r][c]?.type
      if (!currentType || currentBoard[r][c]?.isRainbow || currentBoard[r][c]?.obstacle || currentBoard[r][c]?.unbreakable || currentBoard[r][c]?.chained) {
        c++
        continue
      }
      let length = 1
      while (c + length < BOARD_SIZE.value && currentBoard[r][c + length]?.type === currentType && !currentBoard[r][c + length]?.isRainbow && !currentBoard[r][c + length]?.obstacle && !currentBoard[r][c + length]?.unbreakable && !currentBoard[r][c + length]?.chained) {
        length++
      }
      if (length >= 3) {
        const matchCoords = []
        for (let i = 0; i < length; i++) {
          matchCoords.push({r, c: c + i})
          allMatchedCoords.add(`${r},${c + i}`)
        }
        if (length >= 4) {
          fiveInRowMatches.push({coords: matchCoords, center: {r, c: c + 2}})
        }
      }
      c += length
    }
  }

  for (let c = 0; c < BOARD_SIZE.value; c++) {
    let r = 0
    while (r < BOARD_SIZE.value) {
      const currentType = currentBoard[r][c]?.type
      if (!currentType || currentBoard[r][c]?.isRainbow || currentBoard[r][c]?.obstacle || currentBoard[r][c]?.unbreakable || currentBoard[r][c]?.chained) {
        r++
        continue
      }
      let length = 1
      while (r + length < BOARD_SIZE.value && currentBoard[r + length][c]?.type === currentType && !currentBoard[r + length][c]?.isRainbow && !currentBoard[r + length][c]?.obstacle && !currentBoard[r + length][c]?.unbreakable && !currentBoard[r + length][c]?.chained) {
        length++
      }
      if (length >= 3) {
        const matchCoords = []
        for (let i = 0; i < length; i++) {
          matchCoords.push({r: r + i, c})
          allMatchedCoords.add(`${r + i},${c}`)
        }
        if (length >= 4) {
          fiveInRowMatches.push({coords: matchCoords, center: {r: r + 2, c}})
        }
      }
      r += length
    }
  }

  const matches = Array.from(allMatchedCoords).map(str => {
    const [r, c] = str.split(',').map(Number)
    return {r, c}
  })

  return {matches, fiveInRowMatches}
}

function onTouchStart(e, r, c) {
  if (isProcessing.value || isLevelPassed.value || moves.value <= 0) return
  if (board.value[r][c].chained) return
  const touch = e.touches[0]
  startX = touch.clientX
  startY = touch.clientY
  activeCell.value = {r, c}
}

function onTouchMove(e) {
  if (!activeCell.value || isProcessing.value) return
  e.preventDefault()
}

async function onTouchEnd(e) {
  if (!activeCell.value || isProcessing.value) return
  const touch = e.changedTouches[0]
  await evaluateSwipe(touch.clientX - startX, touch.clientY - startY)
}

function onMouseDown(e, r, c) {
  if (isProcessing.value || isLevelPassed.value || moves.value <= 0) return
  if (board.value[r][c].chained) return
  startX = e.clientX
  startY = e.clientY
  activeCell.value = {r, c}
  window.addEventListener('mouseup', onMouseUp)
}

async function onMouseUp(e) {
  window.removeEventListener('mouseup', onMouseUp)
  if (!activeCell.value || isProcessing.value) return
  await evaluateSwipe(e.clientX - startX, e.clientY - startY)
}

async function evaluateSwipe(diffX, diffY) {
  const threshold = 15
  const {r, c} = activeCell.value

  if (Math.abs(diffX) < threshold && Math.abs(diffY) < threshold) {
    activeCell.value = null
    return
  }

  let targetR = r, targetC = c
  if (Math.abs(diffX) > Math.abs(diffY)) {
    targetC = diffX > 0 ? c + 1 : c - 1
  } else {
    targetR = diffY > 0 ? r + 1 : r - 1
  }

  activeCell.value = null

  if (targetR >= 0 && targetR < BOARD_SIZE.value && targetC >= 0 && targetC < BOARD_SIZE.value) {
    const cell1 = board.value[r][c]
    const cell2 = board.value[targetR][targetC]
    if (!cell1.obstacle && !cell1.unbreakable && !cell1.chained &&
        !cell2.obstacle && !cell2.unbreakable && !cell2.chained &&
        (cell1.type || cell1.isRainbow) && (cell2.type || cell2.isRainbow)) {
      await trySwap(r, c, targetR, targetC)
    }
  }
}

async function trySwap(r1, c1, r2, c2) {
  isProcessing.value = true

  const cell1 = board.value[r1][c1]
  const cell2 = board.value[r2][c2]

  let rainbowActivated = false
  let targetFruitType = null

  if (cell1.isRainbow && !cell2.obstacle && !cell2.unbreakable && !cell2.chained && cell2.type) {
    rainbowActivated = true
    targetFruitType = cell2.type
  } else if (cell2.isRainbow && !cell1.obstacle && !cell1.unbreakable && !cell1.chained && cell1.type) {
    rainbowActivated = true
    targetFruitType = cell1.type
  }

  swapCellObjects(r1, c1, r2, c2)
  await sleep(400)

  if (rainbowActivated) {
    moves.value--
    await processRainbowActivation(
        targetFruitType,
        cell1.isRainbow ? {r: r2, c: c2} : {r: r1, c: c1}
    )

    if (level.value > 1 && remainingObstacles.value === 0) {
      isLevelPassed.value = true
      isProcessing.value = false
      return
    }

    applyGravityAndSpawn()
    await sleep(420)
    await processMatchesAndDrop()
  } else {
    const group = findMatchGroups(board.value)
    if (group.matches.length > 0 || group.fiveInRowMatches.length > 0) {
      moves.value--
      await sleep(50)
      await processMatchesAndDrop()
    } else {
      swapCellObjects(r1, c1, r2, c2)
      await sleep(300)
    }
  }
  isProcessing.value = false
}

async function processRainbowActivation(fruitType, rainbowPos) {
  const matchesToRemove = [rainbowPos]

  for (let r = 0; r < BOARD_SIZE.value; r++) {
    for (let c = 0; c < BOARD_SIZE.value; c++) {
      const cell = board.value[r][c]
      if (cell?.type === fruitType && !cell?.unbreakable && !cell?.chained) {
        matchesToRemove.push({r, c})
      }
    }
  }

  const obstaclesToDamage = new Set()
  matchesToRemove.forEach(m => {
    const neighbors = [
      {r: m.r - 1, c: m.c},
      {r: m.r + 1, c: m.c},
      {r: m.r, c: m.c - 1},
      {r: m.r, c: m.c + 1}
    ]
    neighbors.forEach(n => {
      if (n.r >= 0 && n.r < BOARD_SIZE.value && n.c >= 0 && n.c < BOARD_SIZE.value) {
        if (board.value[n.r][n.c]?.obstacle) {
          obstaclesToDamage.add(`${n.r},${n.c}`)
        }
      }
    })
  })

  matchesToRemove.forEach(m => {
    board.value[m.r][m.c] = createCell(null, null)
  })

  obstaclesToDamage.forEach(str => {
    const [r, c] = str.split(',').map(Number)
    board.value[r][c].obstacle = null
    score.value += 50
  })

  await nextTick()
  await sleep(380)
}

function applyGravityAndSpawn() {
  for (let c = 0; c < BOARD_SIZE.value; c++) {
    let segments = []
    let currentSegment = []

    for (let r = 0; r < BOARD_SIZE.value; r++) {
      const cell = board.value[r][c]
      if (cell.obstacle || cell.unbreakable || cell.chained) {
        if (currentSegment.length > 0) {
          segments.push(currentSegment)
          currentSegment = []
        }
        segments.push([cell])
      } else {
        currentSegment.push(cell)
      }
    }
    if (currentSegment.length > 0) {
      segments.push(currentSegment)
    }

    let newColumnCells = []
    for (let seg of segments) {
      if (seg.length === 1 && (seg[0].obstacle || seg[0].unbreakable || seg[0].chained)) {
        newColumnCells.push(seg[0])
      } else {
        let candiesInSeg = seg.filter(cell => cell.type !== null || cell.isRainbow)
        let emptyCount = seg.length - candiesInSeg.length

        let spawnedCandies = []
        for (let i = 0; i < emptyCount; i++) {
          const randomCandy = CANDIES[Math.floor(Math.random() * CANDIES.length)]
          spawnedCandies.push(createCell(randomCandy, null))
        }

        let combined = [...spawnedCandies, ...candiesInSeg]
        newColumnCells.push(...combined)
      }
    }

    for (let r = 0; r < BOARD_SIZE.value; r++) {
      board.value[r][c] = newColumnCells[r]
    }
  }
}

function swapCellObjects(r1, c1, r2, c2) {
  const temp = board.value[r1][c1]
  board.value[r1][c1] = board.value[r2][c2]
  board.value[r2][c2] = temp
}

async function processMatchesAndDrop() {
  let group = findMatchGroups(board.value)

  while (group.matches.length > 0 || group.fiveInRowMatches.length > 0) {
    score.value += (group.matches.length + group.fiveInRowMatches.length * 5) * 10

    const obstaclesToDamage = new Set()
    const cellsToBreakChain = new Set()
    const rainbowSpawns = []

    group.fiveInRowMatches.forEach(five => {
      rainbowSpawns.push(five.center)
    })

    group.matches.forEach(m => {
      const neighbors = [
        {r: m.r - 1, c: m.c}, {r: m.r + 1, c: m.c},
        {r: m.r, c: m.c - 1}, {r: m.r, c: m.c + 1}
      ]
      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < BOARD_SIZE.value && n.c >= 0 && n.c < BOARD_SIZE.value) {
          if (board.value[n.r][n.c].obstacle) {
            obstaclesToDamage.add(`${n.r},${n.c}`)
          }
          if (board.value[n.r][n.c].chained) {
            cellsToBreakChain.add(`${n.r},${n.c}`)
          }
        }
      })
    })

    group.matches.forEach(m => {
      const isRainbowTarget = rainbowSpawns.some(rCell => rCell.r === m.r && rCell.c === m.c)
      if (!isRainbowTarget) {
        board.value[m.r][m.c] = createCell(null, null)
      }
    })

    rainbowSpawns.forEach(pos => {
      board.value[pos.r][pos.c] = createCell(null, null, true)
    })

    obstaclesToDamage.forEach(str => {
      const [r, c] = str.split(',').map(Number)
      board.value[r][c].obstacle = null
      score.value += 50
    })

    cellsToBreakChain.forEach(str => {
      const [r, c] = str.split(',').map(Number)
      if (board.value[r][c]) {
        board.value[r][c].chained = false
      }
    })

    if (level.value > 1 && remainingObstacles.value === 0) {
      isLevelPassed.value = true
      break
    }

    if (level.value === 1 && moves.value <= 0) {
      isLevelPassed.value = true
      break
    } else if (level.value > 1 && moves.value <= 0) {
      break
    }

    applyGravityAndSpawn()

    await sleep(400)
    group = findMatchGroups(board.value)
  }

  if (level.value > 1 && remainingObstacles.value === 0) {
    isLevelPassed.value = true
  }

  shuffleBoardIfDeadlock()

  if (level.value === 1 && moves.value <= 0) {
    isLevelPassed.value = true
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

onMounted(() => {
  initLevel()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-white p-4 select-none">
    <!-- Шапка игры -->
    <div class="flex  bg-gray-900 justify-between w-full max-w-sm mb-2 px-2 text-lg font-bold">
      <div>Уровень: <span class="text-pink-400">{{ level }}</span></div>
      <div>Очки: <span class="text-yellow-400">{{ score }}</span></div>
      <div>Ходы: <span class="text-red-400">{{ moves }}</span></div>
    </div>

    <!-- Цель уровня -->
    <div class="text-sm  bg-gray-900 text-gray-40000 mb-4">
      <span v-if="level === 1">Цель: Сделать 10 ходов и заработать очки</span>
      <span v-else>Цель: Разбить все коробки (Осталось: <span class="text-cyan-400 font-bold">{{
          remainingObstacles
        }}</span>)</span>
    </div>

    <!-- Игровое поле 8x8 (Строго в рамках 384px) -->
    <div class="relative bg-gray-800 p-2 rounded-xl shadow-2xl border-4 border-gray-700 overflow-hidden"
         style="width: 384px; height: 384px;">

      <!-- Слой 1: Статичная сетка подложек -->
      <!-- Слой 1: Статичная сетка подложек (чистая, без фонов) -->
      <div class="absolute inset-0 grid grid-cols-8 gap-1 bg-blue-200 p-2">
        <template v-for="(row, r) in board" :key="r">
          <div
              v-for="(cell, c) in row"
              class="w-full h-full flex items-center justify-center transition-all duration-300"
          ></div>
        </template>
      </div>

      <!-- Слой 2: Фрукты с идеальным позиционированием -->
      <TransitionGroup
          name="candy"
          tag="div"
          class="absolute inset-0 pointer-events-auto p-3"
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
            }"
            :style="{
              width: '44px',
              height: '44px',
              left: `${cell.c * 42 + (level < 10?60:20)}px`,
              top: `${cell.r * 42 + (level < 10?60:20)}px`
            }"
        >
          <img
              v-if="cell.unbreakable"
              :src="stoneImage"
              class="w-9 h-9 object-contain drop-shadow-md pointer-events-none opacity-90"
              alt="unbreakable"
          />
          <img
              v-else-if="cell.obstacle"
              :src="obstacleImage"
              class="w-11 h-11 p-0.5 object-contain drop-shadow-md pointer-events-none"
              alt="obstacle"
          />
          <img
              v-else-if="cell.isRainbow"
              :src="rainbowImage"
              class="w-9 h-9 animate-bounce brightness-200 object-contain drop-shadow-md pointer-events-none"
              alt="rainbow"
          />
          <div v-else-if="cell.type" class="relative w-full h-full flex items-center justify-center">
            <img
                :src="cell.type"
                class="w-11 h-11 object-contain drop-shadow-md pointer-events-none"
                alt="candy"
            />
            <div v-if="cell.chained" class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <span class="w-7"><img class="opacity-80" src="/gamePlay/lock.webp" alt=""></span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Кнопка перезапуска / следующего уровня -->
    <button
        @click="nextLevelOrRestart"
        class="mt-6 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 font-bold rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all"
    >
      {{ isLevelPassed ? 'Следующий уровень 🚀' : 'Перезапустить' }}
    </button>
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
</style>