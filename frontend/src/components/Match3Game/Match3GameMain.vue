<script setup>
import {ref, computed, onMounted, onUnmounted, nextTick} from 'vue'
import PetHeaderMenu from "@/components/PetHeaderMenu.vue";
import {APP_VERSION} from "@/scripts/imageVersion.js";
import {gameData} from "@/scripts/useGameStore.js";

const isLoading = ref(true);
const MAX_SIZE = 8

const CANDIES = [
  '/food/banana.webp',
  '/food/apple.webp',
  '/food/watermelon.webp',
  '/food/strawberry.webp',
  '/food/grape.webp',
  '/food/pomegranate.webp',
  '/food/orange.webp',
]

const rainbowImage = '/food/dragonfruit.webp'
const obstacleImage = '/gamePlay/a_crate_of_fruit.webp'
const stoneImage = '/gamePlay/ice_cube.webp'

let nextId = 1
let calculatedMoves = 0
const level = computed(() => gameData.match3_level)
const score = ref(0)
const moves = ref(10)
const board = ref([])
const isProcessing = ref(false)
const isLevelPassed = ref(false)
const isShuffling = ref(false)

// 📢 Система динамических плашек
const activeBadgeText = ref('')
const activeBadgeColor = ref('text-pink-300')
const activeBadgeShadow = ref('0 4px 15px rgba(236, 72, 153, 0.6)')
const badgeKey = ref(0)

function showFloatingBadge(text, colorClass = 'text-pink-300', shadowStyle = '0 4px 15px rgba(236, 72, 153, 0.6)') {
  activeBadgeText.value = text
  activeBadgeColor.value = colorClass
  activeBadgeShadow.value = shadowStyle
  badgeKey.value++
}

let activeCell = ref(null)
let startX = 0
let startY = 0

const gridRows = ref(8)
const gridCols = ref(8)

// ====================== АДАПТИВНЫЙ РАЗМЕР ПОЛЯ ======================
const boardPixelSize = ref(360)

// Берём максимальную сторону текущего уровня (6, 7 или 8)
const maxDim = computed(() => Math.max(gridRows.value, gridCols.value, 1))

const cellStep = computed(() => {
  const usable = boardPixelSize.value - 20
  // Чем меньше клеток — тем крупнее шаг
  return Math.floor(usable / maxDim.value)
})

const cellSize = computed(() => Math.max(30, cellStep.value - 2))

// Центрирование под текущий размер сетки
const gridOffsetX = computed(() => {
  const totalWidth = gridCols.value * cellStep.value
  return Math.max(0, (boardPixelSize.value - 20 - totalWidth) / 2)
})

const gridOffsetY = computed(() => {
  const totalHeight = gridRows.value * cellStep.value
  return Math.max(0, (boardPixelSize.value - 20 - totalHeight) / 2)
})

function updateBoardSize() {
  // На телефонах берём почти всю ширину, но ограничиваем сверху
  const maxAllowed = Math.min(window.innerWidth - 24, 440)
  const minAllowed = 280
  boardPixelSize.value = Math.max(minAllowed, Math.floor(maxAllowed))
}
// =====================================================================

const remainingObstacles = computed(() => {
  let count = 0
  for (let r = 0; r < gridRows.value; r++) {
    for (let c = 0; c < gridCols.value; c++) {
      if (board.value[r]?.[c]?.obstacle) count++
    }
  }
  return count
})

const flatBoard = computed(() => {
  const list = []
  for (let r = 0; r < gridRows.value; r++) {
    for (let c = 0; c < gridCols.value; c++) {
      const cell = board.value[r]?.[c]
      if (cell !== null && cell !== undefined) {
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

function getLevelShape(lvl) {
  if (lvl % 10 === 0) {
    const shapeId = ((lvl / 10) - 1) % 8;
    switch (shapeId) {
      case 0: return { type: 'romance', rows: 8, cols: 8 };
      case 1: return { type: 'pyramid', rows: 7, cols: 7 };
      case 2: return { type: 'hourglass', rows: 8, cols: 8 };
      case 3: return { type: 'cross', rows: 8, cols: 8 };
      case 4: return { type: 'heart', rows: 8, cols: 8 };
      case 5: return { type: 'skull', rows: 8, cols: 8 };
      default: return { type: 'romance', rows: 8, cols: 8 };
    }
  }

  const size = lvl < 10 ? 6 : 8;
  return { type: 'rect', rows: size, cols: size };
}

function isInsideShape(r, c, shape) {
  if (shape.type === 'rect') {
    return r < shape.rows && c < shape.cols;
  }

  if (shape.type === 'romance') {
    const center = 3.5;
    return Math.abs(r - center) + Math.abs(c - center) <= 3.8;
  }

  if (shape.type === 'pyramid') {
    const mid = Math.floor(shape.cols / 2);
    const widthAtRow = r;
    return c >= (mid - widthAtRow) && c <= (mid + widthAtRow) && r < shape.rows;
  }

  if (shape.type === 'hourglass') {
    if (r === 0 || r === 7) return c >= 0 && c <= 7;
    if (r === 1 || r === 6) return c >= 1 && c <= 6;
    if (r === 2 || r === 5) return c >= 2 && c <= 5;
    return c >= 3 && c <= 4;
  }

  if (shape.type === 'cross') {
    const isMidRow = (r >= 2 && r <= 5);
    const isMidCol = (c >= 2 && c <= 5);
    return isMidRow || isMidCol;
  }

  if (shape.type === 'heart') {
    if (r === 0) return (c >= 1 && c <= 2) || (c >= 5 && c <= 6);
    if (r === 1 || r === 2) return c >= 0 && c <= 7;
    if (r === 3) return c >= 1 && c <= 6;
    if (r === 4) return c >= 2 && c <= 5;
    if (r === 5) return c >= 2 && c <= 5;
    if (r === 6) return c >= 3 && c <= 4;
    if (r === 7) return c === 3 || c === 4;
  }

  if (shape.type === 'skull') {
    if (r === 0) return c >= 2 && c <= 5;
    if (r >= 1 && r <= 3) return c >= 1 && c <= 6;
    if (r === 4) return c >= 2 && c <= 5;
    if (r === 5) return c >= 2 && c <= 5;
    if (r === 6 || r === 7) return c >= 2 && c <= 5;
  }

  return true;
}
function triggerVictory() {
  setTimeout(() => {
    isLevelPassed.value = true
    isProcessing.value = false
    gameData.match3_level++
  }, 1000) // Задержка 500 мс, чтобы игрок успел увидеть взрыв последней коробки
}
function initLevel() {
  isLevelPassed.value = false
  score.value = 0
  activeCell.value = null

  const shape = getLevelShape(level.value);
  gridRows.value = shape.rows || MAX_SIZE;
  gridCols.value = shape.cols || MAX_SIZE;

  let tempBoard = []
  let targetObstaclesCount = 0
  let targetStones = 0
  let targetChains = 0

  do {
    tempBoard = Array.from({length: MAX_SIZE}, (row, r) =>
        Array.from({length: MAX_SIZE}, (col, c) => {
          if (r >= gridRows.value || c >= gridCols.value || !isInsideShape(r, c, shape)) {
            return null;
          }
          return createCell(null, null);
        })
    )

    if (level.value >= 10 && level % 10 !== 0) {
      let spawnedStones = 0
      const minStones = 2
      const maxStonesLimit = 6
      targetStones = Math.min(
          maxStonesLimit,
          minStones + Math.floor((level.value - 10) / 3)
      )

      while (spawnedStones < targetStones) {
        const r = Math.floor(Math.random() * gridRows.value)
        const c = Math.floor(Math.random() * gridCols.value)
        const cell = tempBoard[r] && tempBoard[r][c]
        if (cell !== null && cell !== undefined && !cell.obstacle && !cell.unbreakable) {
          cell.unbreakable = true
          cell.type = null
          spawnedStones++
        }
      }
    }

    if (level.value >= 2) {
      const minObstacles = 3
      const maxGlobalLimit = 8
      targetObstaclesCount = Math.min(
          maxGlobalLimit,
          minObstacles + Math.floor((level.value - 2) / 2)
      )

      let spawned = 0
      while (spawned < targetObstaclesCount) {
        const r = Math.floor(Math.random() * gridRows.value)
        const c = Math.floor(Math.random() * gridCols.value)
        const cell = tempBoard[r] && tempBoard[r][c]

        if (cell !== null && cell !== undefined && !cell.obstacle && !cell.unbreakable) {
          cell.obstacle = true
          cell.type = null
          spawned++
        }
      }
    }

    for (let r = 0; r < gridRows.value; r++) {
      for (let c = 0; c < gridCols.value; c++) {
        const cell = tempBoard[r] && tempBoard[r][c]
        if (cell !== null && cell !== undefined && !cell.obstacle && !cell.unbreakable) {
          cell.type = CANDIES[Math.floor(Math.random() * CANDIES.length)]
        }
      }
    }

    if (level.value >= 15) {
      let spawnedChains = 0
      const maxChains = 5
      const minChains = 2
      targetChains = Math.min(
          maxChains,
          minChains + Math.floor((level.value - 15) / 2)
      )

      let attempts = 0
      while (spawnedChains < targetChains && attempts < 100) {
        attempts++
        const r = Math.floor(Math.random() * gridRows.value)
        const c = Math.floor(Math.random() * gridCols.value)
        const cell = tempBoard[r] && tempBoard[r][c]
        if (cell !== null && cell !== undefined && !cell.obstacle && !cell.unbreakable && !cell.chained && cell.type) {
          cell.chained = true
          spawnedChains++
        }
      }
    }

  } while (findMatchGroups(tempBoard).matches.length > 0 || !hasValidMoves(tempBoard))

  board.value = tempBoard

  if (level.value === 1) {
    moves.value = 10
  } else {
    const activeStones = level.value >= 10 ? Math.min(6, 2 + Math.floor((level.value - 10) / 3)) : 0
    const activeChains = level.value >= 15 ? Math.min(5, 2 + Math.floor((level.value - 15) / 2)) : 0

    calculatedMoves = Math.ceil(15 + (targetObstaclesCount * 1.3) + (activeStones * 1.5) + (activeChains * 1.5))
    moves.value = calculatedMoves
  }

  shuffleBoardIfDeadlock()
}

function nextLevelOrRestart() {

  initLevel()
}

function hasValidMoves(currentBoard) {
  const rows = gridRows.value
  const cols = gridCols.value

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = currentBoard[r]?.[c]
      if (!cell || cell === null || cell.obstacle || cell.unbreakable || cell.chained || (!cell.type && !cell.isRainbow)) continue

      const directions = [{dr: 0, dc: 1}, {dr: 1, dc: 0}]
      for (let dir of directions) {
        const nr = r + dir.dr
        const nc = c + dir.dc

        if (nr < rows && nc < cols) {
          const neighbor = currentBoard[nr]?.[nc]
          if (!neighbor || neighbor === null || neighbor.obstacle || neighbor.unbreakable || neighbor.chained || (!neighbor.type && !neighbor.isRainbow)) continue

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

async function shuffleBoardIfDeadlock() {
  let safetyCounter = 0

  if (!hasValidMoves(board.value)) {
    isShuffling.value = true
    showFloatingBadge("Выжимаем соки!", "text-amber-300", "0 4px 15px rgba(245, 158, 11, 0.6)")
    await sleep(400)
  }

  while (!hasValidMoves(board.value) && safetyCounter < 15) {
    safetyCounter++
    const candyItems = []

    for (let r = 0; r < gridRows.value; r++) {
      for (let c = 0; c < gridCols.value; c++) {
        const cell = board.value[r]?.[c]
        if (cell && cell !== null && !cell.obstacle && !cell.unbreakable && !cell.chained && (cell.type || cell.isRainbow)) {
          candyItems.push({type: cell.type, isRainbow: cell.isRainbow})
        }
      }
    }

    for (let i = candyItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candyItems[i], candyItems[j]] = [candyItems[j], candyItems[i]]
    }

    let index = 0
    for (let r = 0; r < gridRows.value; r++) {
      for (let c = 0; c < gridCols.value; c++) {
        const cell = board.value[r]?.[c]
        if (cell && cell !== null && !cell.obstacle && !cell.unbreakable && !cell.chained && (cell.type || cell.isRainbow)) {
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

  if (isShuffling.value) {
    await sleep(300)
    isShuffling.value = false
  }

  if (!hasValidMoves(board.value)) {
    initLevel()
  }
}

function findMatchGroups(currentBoard) {
  const allMatchedCoords = new Set()
  const fiveInRowMatches = []
  const rows = gridRows.value
  const cols = gridCols.value

  for (let r = 0; r < rows; r++) {
    let c = 0
    while (c < cols) {
      const currentCell = currentBoard[r]?.[c]
      if (!currentCell || currentCell === null || currentCell.isRainbow || currentCell.obstacle || currentCell.unbreakable || currentCell.chained || !currentCell.type) {
        c++
        continue
      }
      let length = 1
      while (c + length < cols) {
        const nextCell = currentBoard[r]?.[c + length]
        if (!nextCell || nextCell === null || nextCell.type !== currentCell.type || nextCell.isRainbow || nextCell.obstacle || nextCell.unbreakable || nextCell.chained) {
          break
        }
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

  for (let c = 0; c < cols; c++) {
    let r = 0
    while (r < rows) {
      const currentCell = currentBoard[r]?.[c]
      if (!currentCell || currentCell === null || currentCell.isRainbow || currentCell.obstacle || currentCell.unbreakable || currentCell.chained || !currentCell.type) {
        r++
        continue
      }
      let length = 1
      while (r + length < rows) {
        const nextCell = currentBoard[r + length]?.[c]
        if (!nextCell || nextCell === null || nextCell.type !== currentCell.type || nextCell.isRainbow || nextCell.obstacle || nextCell.unbreakable || nextCell.chained) {
          break
        }
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
  if (isProcessing.value || isLevelPassed.value || isShuffling.value || moves.value <= 0) return
  const cell = board.value[r]?.[c]
  if (!cell || cell === null || cell.chained) return
  const touch = e.touches[0]
  startX = touch.clientX
  startY = touch.clientY
  activeCell.value = {r, c}
}

function onTouchMove(e) {
  if (!activeCell.value || isProcessing.value || isShuffling.value) return
  e.preventDefault()
}

async function onTouchEnd(e) {
  if (!activeCell.value || isProcessing.value || isShuffling.value) return
  const touch = e.changedTouches[0]
  await evaluateSwipe(touch.clientX - startX, touch.clientY - startY)
}

function onMouseDown(e, r, c) {
  if (isProcessing.value || isLevelPassed.value || isShuffling.value || moves.value <= 0) return
  const cell = board.value[r]?.[c]
  if (!cell || cell === null || cell.chained) return
  startX = e.clientX
  startY = e.clientY
  activeCell.value = {r, c}
  window.addEventListener('mouseup', onMouseUp)
}

async function onMouseUp(e) {
  window.removeEventListener('mouseup', onMouseUp)
  if (!activeCell.value || isProcessing.value || isShuffling.value) return
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

  if (targetR >= 0 && targetR < gridRows.value && targetC >= 0 && targetC < gridCols.value) {
    const cell1 = board.value[r]?.[c]
    const cell2 = board.value[targetR]?.[targetC]
    if (cell1 && cell2 && cell1 !== null && cell2 !== null &&
        !cell1.obstacle && !cell1.unbreakable && !cell1.chained &&
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
    showFloatingBadge("Сочный взрыв!", "text-[#66FF66]", "0 4px 15px rgba(6, 182, 212, 0.6)")
    await processRainbowActivation(
        targetFruitType,
        cell1.isRainbow ? {r: r2, c: c2} : {r: r1, c: c1}
    )

    if (level.value > 1 && remainingObstacles.value === 0) {
      triggerVictory()
      return // Выходим из функции
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
  const rows = gridRows.value
  const cols = gridCols.value

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board.value[r]?.[c]
      if (cell && cell !== null && cell?.type === fruitType && !cell?.unbreakable && !cell?.chained) {
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
      if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols) {
        if (board.value[n.r]?.[n.c]?.obstacle) {
          obstaclesToDamage.add(`${n.r},${n.c}`)
        }
      }
    })
  })

  matchesToRemove.forEach(m => {
    if (board.value[m.r][m.c] !== null) {
      board.value[m.r][m.c] = createCell(null, null)
    }
  })

  obstaclesToDamage.forEach(str => {
    const [r, c] = str.split(',').map(Number)
    if (board.value[r][c] !== null) {
      board.value[r][c].obstacle = null
      score.value += 50
    }
  })

  await nextTick()
  await sleep(380)
}

function applyGravityAndSpawn() {
  const rows = gridRows.value
  const cols = gridCols.value

  for (let c = 0; c < cols; c++) {
    let colCells = []
    let indices = []

    for (let r = 0; r < rows; r++) {
      if (board.value[r]?.[c] !== undefined && board.value[r]?.[c] !== null) {
        indices.push(r)
        colCells.push(board.value[r][c])
      }
    }

    if (indices.length === 0) continue

    let segments = []
    let currentSegment = []

    for (let i = 0; i < colCells.length; i++) {
      const cell = colCells[i]
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

    let newColCells = []
    for (let seg of segments) {
      if (seg.length === 1 && (seg[0]?.obstacle || seg[0]?.unbreakable || seg[0]?.chained)) {
        newColCells.push(seg[0])
      } else {
        let candiesInSeg = seg.filter(cell => cell && (cell.type !== null || cell.isRainbow))
        let emptyCount = seg.length - candiesInSeg.length

        let spawnedCandies = []
        for (let i = 0; i < emptyCount; i++) {
          const randomCandy = CANDIES[Math.floor(Math.random() * CANDIES.length)]
          spawnedCandies.push(createCell(randomCandy, null))
        }

        let combined = [...spawnedCandies, ...candiesInSeg]
        newColCells.push(...combined)
      }
    }

    for (let i = 0; i < indices.length; i++) {
      const r = indices[i]
      board.value[r][c] = newColCells[i]
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
  const rows = gridRows.value
  const cols = gridCols.value

  while (group.matches.length > 0 || group.fiveInRowMatches.length > 0) {
    score.value += (group.matches.length + group.fiveInRowMatches.length * 5) * 10

    if (group.fiveInRowMatches.length > 0) {
      showFloatingBadge("Супер-фрукт!", "text-purple-400", "0 4px 15px rgba(168, 85, 247, 0.6)")
    } else if (group.matches.length >= 5) {
      showFloatingBadge("Великолепно!", "text-emerald-400", "0 4px 15px rgba(16, 185, 129, 0.6)")
    } else if (group.matches.length >= 4) {
      showFloatingBadge("Отлично!", "text-amber-400", "0 4px 15px rgba(245, 158, 11, 0.6)")
    }

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
        if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols) {
          if (board.value[n.r]?.[n.c]?.obstacle) {
            obstaclesToDamage.add(`${n.r},${n.c}`)
          }
          if (board.value[n.r]?.[n.c]?.chained) {
            cellsToBreakChain.add(`${n.r},${n.c}`)
          }
        }
      })
    })

    group.matches.forEach(m => {
      const isRainbowTarget = rainbowSpawns.some(rCell => rCell.r === m.r && rCell.c === m.c)
      if (!isRainbowTarget && board.value[m.r][m.c] !== null) {
        board.value[m.r][m.c] = createCell(null, null)
      }
    })

    rainbowSpawns.forEach(pos => {
      if (board.value[pos.r][pos.c] !== null) {
        board.value[pos.r][pos.c] = createCell(null, null, true)
      }
    })

    obstaclesToDamage.forEach(str => {
      const [r, c] = str.split(',').map(Number)
      if (board.value[r][c] !== null) {
        board.value[r][c].obstacle = null
        score.value += 50
      }
    })

    cellsToBreakChain.forEach(str => {
      const [r, c] = str.split(',').map(Number)
      if (board.value[r]?.[c]) {
        board.value[r][c].chained = false
      }
    })

    if (level.value > 1 && remainingObstacles.value === 0) {
      triggerVictory()
      break
    }

    if (level.value === 1 && moves.value <= 0) {
      triggerVictory()
      break
    } else if (level.value > 1 && moves.value <= 0) {
      showFloatingBadge("Кончились ходы!", "text-red-400", "0 4px 15px rgba(239, 68, 68, 0.6)")
      break
    }

    applyGravityAndSpawn()

    await sleep(400)
    group = findMatchGroups(board.value)
  }

  if (level.value > 1 && remainingObstacles.value === 0) {
    triggerVictory()
  }

  shuffleBoardIfDeadlock()

  if (level.value === 1 && moves.value <= 0) {
    triggerVictory()
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function restartLevel(){
  if(gameData.coins < 50){
    return
  }
  gameData.coins -= 50
  initLevel()
}

onMounted(() => {
  updateBoardSize()
  window.addEventListener('resize', updateBoardSize)

  initLevel()
  setTimeout(() => {
    isLoading.value = false
  }, 800)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateBoardSize)
})
</script>

<template>
  <div class="bg-green-300 min-h-screen">

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
          {{ $t('loading') }}
        </span>
        <div class="mt-4 w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    </Transition>

    <PetHeaderMenu/>

    <div class="flex flex-col items-center justify-center text-white select-none px-2">
      <RouterLink to="/" class="absolute z-20 left-2 top-28 opacity-80">
        <div class="bg-[#fff6ef] h-12 w-12 flex flex-col items-center justify-center p-0.5 rounded-xl border-2 border-[#f7c9a5] active:scale-95 cursor-pointer shadow-inner">
          <div class="w-8 h-8 bg-contain bg-no-repeat bg-center"
               :style="{backgroundImage: `url('/gamePlay/back_icon.webp?v=${APP_VERSION}')`}"></div>
        </div>
      </RouterLink>

      <!-- Шапка игры -->
      <div class="w-full flex justify-end">
        <div class="bg-linear-65 from-pink-300 to-pink-400 rounded-bl-4xl p-3 mb-1 flex flex-col items-end w-fit text-lg font-bold px-4">
          <div class="flex gap-1 flex-wrap justify-end">
            <div>Уровень: <span class="text-purple-400 text-shadow-sm text-shadow-black">{{ level }}</span></div>
            <div>Очки: <span class="text-yellow-400 text-shadow-sm text-shadow-black">{{ score }}</span></div>
            <div>Ходы: <span class="text-red-400 text-shadow-sm text-shadow-black">{{ moves }}</span></div>
          </div>
          <div class="text-right text-cyan-400 text-shadow-sm text-shadow-black text-sm">
            <span v-if="level === 1">Сделай 10 ходов</span>
            <span v-else>Разбей все коробки </span>
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

        <!-- Слой 2: Фрукты -->
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
                'animate-shake': isShuffling && !cell.obstacle && !cell.unbreakable && !cell.chained
              }"
              :style="{
                width: cellSize + 'px',
                height: cellSize + 'px',
                left: (cell.c * cellStep + 10 + gridOffsetX) + 'px',
                top: (cell.r * cellStep + 10 + gridOffsetY) + 'px'
              }"
          >
            <img
                v-if="cell.unbreakable"
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
              <span>{{ activeBadgeText }}</span>
            </div>
          </div>
        </transition>

        <!-- Победный экран -->
        <transition name="badge-fade">
          <div
              v-if="isLevelPassed"
              class="absolute inset-0 z-50 bg-linear-to-l from-purple-800 to-purple-950 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div class="text-2xl font-black text-yellow-400 mb-2 animate-bounce">Уровень пройден!</div>
            <p class="text-gray-300 text-sm mb-6">Великолепная работа!</p>

            <div class="bg-pink-300 border-2 border-gray-700 rounded-xl p-4 w-full max-w-xs mb-6 text-left space-y-2">
              <div class="flex justify-between">
                <span class="text-white">Уровень:</span>
                <span class="font-bold text-pink-400 text-shadow-md text-shadow-black">{{ level }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-white">Заработано очков:</span>
                <span class="font-bold text-yellow-400 text-shadow-md text-shadow-black">{{ score }}</span>
              </div>
            </div>

            <button
                @click="nextLevelOrRestart"
                class="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-lg rounded-full shadow-2xl hover:opacity-90 active:scale-95 transition-all"
            >
              Следующий уровень
            </button>
          </div>
        </transition>
      </div>

      <!-- Кнопка перезапуска -->
      <button
          @click="restartLevel"
          :disabled="gameData.coins < 50"
          class="mt-3 px-6 py-2.5 font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
          :class="gameData.coins < 50 ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60' : 'bg-red-300 text-shadow-sm text-shadow-pink-500 hover:bg-gray-600 text-white active:scale-95'"
      >
        <span>Перезапустить уровень</span>
        <div class="flex items-center gap-1">
          <span :class="gameData.coins < 50 ? 'text-red-400' : 'text-yellow-400'">50</span>
          <img class="w-5" src="/gamePlay/coin.webp" alt="">
        </div>
      </button>
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
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  20% { transform: translate(-2px, 1px) rotate(-3deg); }
  40% { transform: translate(2px, -1px) rotate(3deg); }
  60% { transform: translate(-2px, -1px) rotate(-2deg); }
  80% { transform: translate(2px, 1px) rotate(2deg); }
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
</style>