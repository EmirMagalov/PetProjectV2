<script setup>
import {ref, computed, onMounted, nextTick} from 'vue'

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
const level = ref(80)
const score = ref(0)
const moves = ref(10)
const board = ref([])
const isProcessing = ref(false)
const isLevelPassed = ref(false)
const isShuffling = ref(false)

// 📢 Система динамических плашек со своими цветами и тенями
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

    if (level.value >= 10 && level.value % 10 !== 0) {
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
  if (isLevelPassed.value) {
    level.value++
  }
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

// 🔀 Стильное перемешивание фишек без темного оверлея
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
    showFloatingBadge("Сочный взрыв!", "text-cyan-300", "0 4px 15px rgba(6, 182, 212, 0.6)")
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

    // Проверяем сочные комбо для плашек со своими цветами и тенями
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
      isLevelPassed.value = true
      break
    }

    if (level.value === 1 && moves.value <= 0) {
      isLevelPassed.value = true
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
    <div class="flex bg-gray-900 justify-between w-full max-w-sm mb-2 px-2 text-lg font-bold">
      <div>Уровень: <span class="text-pink-400">{{ level }}</span></div>
      <div>Очки: <span class="text-yellow-400">{{ score }}</span></div>
      <div>Ходы: <span class="text-red-400">{{ moves }}</span></div>
    </div>

    <!-- Цель уровня -->
    <div class="text-sm bg-gray-900 text-gray-400 mb-4 px-2">
      <span v-if="level === 1">Цель: Сделать 10 ходов и заработать очки</span>
      <span v-else>Цель: Разбить все коробки (Осталось: <span class="text-cyan-400 font-bold">{{ remainingObstacles }}</span>)</span>
    </div>

    <!-- Игровое поле -->
    <div class="relative bg-[#D3E9F0] p-3 rounded-xl shadow-2xl border-4 border-gray-700 overflow-hidden flex items-center justify-center"
         style="width: 480px; height: 480px; background-image: url('/gamePlay/match3_game_background.webp'); background-size: 500px; background-position: bottom;background-repeat: no-repeat;">

      <!-- Слой 1: Статичная сетка подложек (исправлена) -->
      <div class="absolute inset-0 pointer-events-none p-3">
        <template v-for="(row, r) in board" :key="'bg-row-' + r">
          <template v-for="(cell, c) in row" :key="'bg-' + r + '-' + c">
            <div
                v-if="cell !== null && cell !== undefined && r < gridRows && c < gridCols"
                class="absolute rounded-xl bg-blue-300/80 border border-white/10"
                :style="{
                width: '44px',
                height: '44px',
                left: `${c * 46 + Math.max(0, (456 - gridCols * 44) / 2)}px`,
                top: `${r * 46 + Math.max(0, (456 - gridRows * 44) / 2)}px`
              }"
            ></div>
          </template>
        </template>
      </div>

      <!-- Слой 2: Фрукты -->
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
            class="flex items-center justify-center rounded-xl  cursor-grab active:cursor-grabbing absolute select-none z-10"
            :class="{
              'bg-yellow-300/10 z-30': activeCell?.r === cell.r && activeCell?.c === cell.c,
              'animate-shake': isShuffling && !cell.obstacle && !cell.unbreakable && !cell.chained
            }"
            :style="{
              width: '44px',
              height: '44px',
              left: `${cell.c * 46 + Math.max(0, (456 - gridCols * 44) / 2)}px`,
              top: `${cell.r * 46 + Math.max(0, (456 - gridRows * 44) / 2)}px`
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
              class="w-10 h-10 animate-bounce brightness-200 object-contain drop-shadow-md pointer-events-none"
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

      <!-- 📢 Динамическая плашка со своими цветами и тенями -->
      <transition name="badge-fade" :key="badgeKey">
        <div
            v-if="activeBadgeText"
            class="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden"
        >
          <div
              class="floating-up text-shadow-md text-shadow-white font-black text-3xl uppercase px-5 py-3 flex items-center gap-2"
              :class="activeBadgeColor"

          >
            <span>{{ activeBadgeText }}</span>
          </div>
        </div>
      </transition>

      <!-- 🏆 ПОБЕДНЫЙ ЭКРАН -->
      <transition name="badge-fade">
        <div
            v-if="isLevelPassed"
            class="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
        >
          <div class="text-2xl font-black text-yellow-400 mb-2 animate-bounce">Уровень пройден!</div>
          <p class="text-gray-300 text-sm mb-6">Великолепная работа!</p>

          <div class="bg-gray-800 border-2 border-gray-700 rounded-xl p-4 w-full max-w-xs mb-6 text-left space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-400">Уровень:</span>
              <span class="font-bold text-pink-400">{{ level }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Заработано очков:</span>
              <span class="font-bold text-yellow-400">{{ score }}</span>
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

    <!-- Кнопка перезапуска под полем -->
    <button
        @click="initLevel"
        class="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 font-bold rounded-full shadow-lg active:scale-95 transition-all text-sm"
    >
      Перезапустить уровень 🔄
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

/* Мягкое появление и исчезновение плашки */
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

/* Строго одноразовый плавный полет вверх до конца */
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

/* Эффект дрожания фишек перед перемешиванием */
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