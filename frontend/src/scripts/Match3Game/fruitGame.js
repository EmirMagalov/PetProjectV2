import {ref, computed, nextTick, watch} from 'vue'
import {gameData} from "@/scripts/useGameStore.js";
import {addCoin} from "@/scripts/actions.js";
import {addExp} from "@/scripts/level.js";

// ================= LEVEL CONFIG: ПРАВИЛА И БАЛАНС =================
const LEVEL_CONFIG = {
    GRID_8X8_INTERVAL: 11,      // Каждые N уровней — сетка 8х8 (например, 11)
    JELLY_INTERVAL: 4,          // Каждые N уровней — варенье
    SHAPE_INTERVAL: 10,         // Каждые N уровней — фигурные уровни
    CHAINS_START_LEVEL: 11,     // С какого уровня появляются цепи
    STONES_START_LEVEL: 10,     // С какого уровня появляются камни
}
// =====================================================================
const MAX_GAME_LEVEL = 100;
export const isLoading = ref(true); // 🌟 Добавлен export

const CANDIES = [
    '/food/banana.webp',
    '/food/apple.webp',
    '/food/watermelon.webp',
    '/food/strawberry.webp',
    '/food/grape.webp',
    '/food/pomegranate.webp',
    '/food/orange.webp',
]

export const rainbowImage = '/food/dragonfruit.webp'
export const obstacleImage = '/gamePlay/a_crate_of_fruit.webp'
export const stoneImage = '/gamePlay/ice_cube.webp'
export const kivanoImage = '/food/kivano.webp'

const JELLY_IMAGES = [
    '/food/banana_jam.webp',
    '/food/strawberry_jam.webp'
]

let nextId = 1
let calculatedMoves = 0
export const currentLevel = ref(gameData.match3_level)
export const level = computed(() => currentLevel.value)

// 🌟 Динамический размер сетки: 8х8 если кратно GRID_8X8_INTERVAL и НЕ кратно SHAPE_INTERVAL
export const gridSize = computed(() => {
    return (level.value > 0 && level.value % LEVEL_CONFIG.GRID_8X8_INTERVAL === 0 && level.value % LEVEL_CONFIG.SHAPE_INTERVAL !== 0) ? 8 : 6
})

export const score = ref(0)
export const moves = ref(10)
export const board = ref([])
export const isProcessing = ref(false)
export const isLevelPassed = ref(false)
export const isShuffling = ref(false) // 🌟 Добавлен export
export let isVictoryTriggered = false
export const isGameOver = ref(false)
export const gameState = ref('MENU') // 'MENU' | 'PLAYING' | 'GAMEOVER'

export const levelButtonsRef = [] // 🌟 Добавлен export
export const flyingKivano = ref(null) // 🌟 Добавлен export

export const activeBadgeText = ref('')
export const activeBadgeColor = ref('text-pink-300')
export const activeBadgeShadow = ref('0 4px 15px rgba(236, 72, 153, 0.6)')
export const badgeKey = ref(0)

export function showFloatingBadge(text, colorClass = 'text-pink-300', shadowStyle = '0 4px 15px rgba(236, 72, 153, 0.6)') {
    activeBadgeText.value = text
    activeBadgeColor.value = colorClass
    activeBadgeShadow.value = shadowStyle
    badgeKey.value++
}

export const activeCell = ref(null) // 🌟 Добавлен export
let startX = 0
let startY = 0

export const gridRows = ref(6)
export const gridCols = ref(6)

// ====================== АДАПТИВНЫЙ РАЗМЕР ПОЛЯ ======================
export const boardPixelSize = ref(360)

export const cellStep = computed(() => {
    const usable = boardPixelSize.value - 16
    return Math.floor(usable / gridSize.value)
})

export const cellSize = computed(() => Math.max(28, cellStep.value - 2))

export const gridOffsetX = computed(() => {
    const totalWidth = gridCols.value * cellStep.value
    return Math.max(0, (boardPixelSize.value - 16 - totalWidth) / 2)
})

export const gridOffsetY = computed(() => {
    const totalHeight = gridRows.value * cellStep.value
    return Math.max(0, (boardPixelSize.value - 16 - totalHeight) / 2)
})

export function updateBoardSize() {
    const maxAllowed = Math.min(window.innerWidth - 24, 440)
    const minAllowed = 280
    boardPixelSize.value = Math.max(minAllowed, Math.floor(maxAllowed))
}

// =====================================================================

export const isJellyLevel = computed(() => level.value > 1 && level.value % LEVEL_CONFIG.JELLY_INTERVAL === 0 && level.value % LEVEL_CONFIG.SHAPE_INTERVAL !== 0)

export const remainingTargets = computed(() => {
    let count = 0
    for (let r = 0; r < gridRows.value; r++) {
        for (let c = 0; c < gridCols.value; c++) {
            const cell = board.value[r]?.[c]
            if (cell) {
                if (isJellyLevel.value && cell.jelly > 0) count++
                else if (!isJellyLevel.value && cell.obstacle) count++
            }
        }
    }
    return count
})

export const flatBoard = computed(() => {
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

function createCell(type = null, obstacle = null, isRainbow = false, isKivano = false, unbreakable = false, chained = false, jelly = 0, jellyImage = null) {
    return {
        id: nextId++,
        type: type,
        obstacle: obstacle,
        isRainbow: isRainbow,
        isKivano: isKivano,
        unbreakable: unbreakable,
        chained: chained,
        jelly: jelly,
        jellyImage: jellyImage
    }
}

function getLevelShape(lvl) {
    if (lvl > 0 && lvl % LEVEL_CONFIG.GRID_8X8_INTERVAL === 0 && lvl % LEVEL_CONFIG.SHAPE_INTERVAL !== 0) {
        return {type: 'rect', rows: 8, cols: 8}
    }
    if (lvl % LEVEL_CONFIG.SHAPE_INTERVAL === 0) {
        const shapeId = ((lvl / LEVEL_CONFIG.SHAPE_INTERVAL) - 1) % 6
        switch (shapeId) {
            case 0: return {type: 'romance', rows: 6, cols: 6}
            case 1: return {type: 'pyramid', rows: 6, cols: 6}
            case 2: return {type: 'hourglass', rows: 6, cols: 6}
            case 3: return {type: 'cross', rows: 6, cols: 6}
            case 4: return {type: 'heart', rows: 6, cols: 6}
            case 5: return {type: 'skull', rows: 6, cols: 6}
            default: return {type: 'romance', rows: 6, cols: 6}
        }
    }
    return {type: 'rect', rows: 6, cols: 6}
}

function isInsideShape(r, c, shape) {
    if (shape.type === 'rect') {
        return r < shape.rows && c < shape.cols
    }
    if (shape.type === 'romance') {
        const center = 2.5;
        return Math.abs(r - center) + Math.abs(c - center) <= 3.2;
    }
    if (shape.type === 'pyramid') {
        const mid = 2.5
        const widthAtRow = r * 0.7 + 1.2
        return c >= mid - widthAtRow && c <= mid + widthAtRow
    }
    if (shape.type === 'hourglass') {
        if (r === 0 || r === 5) return c >= 0 && c <= 5
        if (r === 1 || r === 4) return c >= 1 && c <= 4
        return c >= 2 && c <= 3
    }
    if (shape.type === 'cross') {
        return (r >= 1 && r <= 4) || (c >= 1 && c <= 4)
    }
    if (shape.type === 'heart') {
        if (r === 0) return (c === 1 || c === 2 || c === 3 || c === 4)
        if (r === 1) return c >= 0 && c <= 5
        if (r === 2) return c >= 0 && c <= 5
        if (r === 3) return c >= 1 && c <= 4
        if (r === 4) return c >= 2 && c <= 3
        if (r === 5) return c === 2 || c === 3
    }
    if (shape.type === 'skull') {
        if (r === 0) return c >= 1 && c <= 4
        if (r === 1 || r === 2) return c >= 0 && c <= 5
        if (r === 3) return c >= 1 && c <= 4
        if (r === 4 || r === 5) return c >= 1 && c <= 4
    }
    return true
}

const levelTargetScore = computed(() => {
    const thresholds = calculateLevelThresholds(level.value, moves.value || calculatedMoves);
    return thresholds.threeStars;
})

export const levelProgressPercent = computed(() => {
    if (!levelTargetScore.value) return 0;
    const percent = (score.value / levelTargetScore.value) * 100;
    return Math.min(100, Math.max(0, percent));
})

function calculateLevelThresholds(lvl, totalMoves) {
    const baseScorePerMove = 60;
    const effectiveMoves = Math.min(totalMoves, 20) + Math.max(0, (totalMoves - 20) * 0.3);
    const minScore = effectiveMoves * baseScorePerMove;

    return {
        oneStar: Math.round(minScore * 0.25),
        twoStars: Math.round(minScore * 0.55),
        threeStars: Math.round(minScore * 0.85)
    };
}

function calculateStars(lvl, currentScore, totalMoves) {
    const thresholds = calculateLevelThresholds(lvl, totalMoves);
    if (currentScore >= thresholds.threeStars) return 3;
    if (currentScore >= thresholds.twoStars) return 2;
    return 1;
}

export function startGame() {
    gameState.value = 'PLAYING'
    initLevel()
}

export function earned_exp (){
    return Math.max(1, Math.floor(gameData.level + (score.value / 200)))
}
export function earned_coins (){
    return Math.max(1, Math.floor(gameData.level + (score.value / 50)))
}
function triggerVictory() {
    if (isVictoryTriggered) return
    isVictoryTriggered = true
    const leftoverMoves = Math.max(0, moves.value)
    const moveBonusScore = leftoverMoves * 150
    const finalScoreForStars = score.value + moveBonusScore
    addCoin(earned_coins())
    addExp(earned_exp());

    const earnedStars = calculateStars(level.value, finalScoreForStars, moves.value || calculatedMoves)
    if (!gameData.match3_stars) {
        gameData.match3_stars = {}
    }
    const previousStars = gameData.match3_stars[level.value] || 0
    if (earnedStars > previousStars) {
        gameData.match3_stars[level.value] = earnedStars
    }

    if (currentLevel.value < MAX_GAME_LEVEL) {
        if (currentLevel.value >= gameData.match3_level) {
            gameData.match3_level++
        }
        currentLevel.value++
    } else {
        showFloatingBadge("match3.great_job", "text-yellow-300", "0 4px 15px rgba(234, 179, 8, 0.6)")
    }

    setTimeout(() => {
        isLevelPassed.value = true
        isProcessing.value = false
    }, 1000)
}

function triggerGameOver() {
    setTimeout(() => {
        isGameOver.value = true
        gameState.value = 'GAMEOVER'
        isProcessing.value = false
    }, 1000)
}

export function selectLevel(lvl) {
    if (lvl > gameData.match3_level) return
    currentLevel.value = lvl
    gameState.value = 'MENU'
    initLevel()
}

export function scrollToCurrentLevel() {
    nextTick(() => {
        const activeBtn = levelButtonsRef[level.value]
        if (activeBtn) {
            activeBtn.scrollIntoView({
                behavior: 'smooth',
                inline: 'nearest',
                block: 'nearest'
            })
        }
    })
}

watch(level, () => {
    scrollToCurrentLevel()
})

function initLevel() {
    isLevelPassed.value = false
    isVictoryTriggered = false
    isGameOver.value = false
    score.value = 0
    activeCell.value = null
    flyingKivano.value = null

    const shape = getLevelShape(level.value);
    gridRows.value = shape.rows || gridSize.value;
    gridCols.value = shape.cols || gridSize.value;

    let tempBoard = []
    let targetObstaclesCount = 0
    let targetStones = 0
    let targetChains = 0
    let safetyLoopCounter = 0

    do {
        safetyLoopCounter++
        if (safetyLoopCounter > 50) break;

        const currentMaxSize = gridSize.value;
        tempBoard = Array.from({length: currentMaxSize}, (row, r) =>
            Array.from({length: currentMaxSize}, (col, c) => {
                if (r >= gridRows.value || c >= gridCols.value || !isInsideShape(r, c, shape)) {
                    return null;
                }
                return createCell(null, null);
            })
        )

        if (level.value >= LEVEL_CONFIG.STONES_START_LEVEL && level.value % LEVEL_CONFIG.SHAPE_INTERVAL !== 0 && !isJellyLevel.value) {
            let spawnedStones = 0
            const minStones = 2
            const maxStonesLimit = gridSize.value === 8 ? 8 : 6
            targetStones = Math.min(
                maxStonesLimit,
                minStones + Math.floor((level.value - LEVEL_CONFIG.STONES_START_LEVEL) / 3)
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

        if (isJellyLevel.value) {
            const jellyWave = Math.floor(level.value / LEVEL_CONFIG.JELLY_INTERVAL)
            const jellyRowsCount = Math.min(gridRows.value - 2, jellyWave)
            const startRow = gridRows.value - jellyRowsCount

            for (let r = startRow; r < gridRows.value; r++) {
                for (let c = 0; c < gridCols.value; c++) {
                    const cell = tempBoard[r]?.[c]
                    if (cell !== null && cell !== undefined && !cell.unbreakable) {
                        cell.jelly = 1
                        cell.type = null
                        cell.jellyImage = JELLY_IMAGES[Math.floor(Math.random() * JELLY_IMAGES.length)]
                    }
                }
            }
        } else if (level.value >= 2) {
            const minObstacles = 3
            const maxGlobalLimit = gridSize.value === 8 ? 12 : 8
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
                if (cell !== null && cell !== undefined && !cell.obstacle && !cell.unbreakable && cell.jelly === 0 && !cell.type) {
                    cell.type = CANDIES[Math.floor(Math.random() * CANDIES.length)]
                }
            }
        }
        //Цепи
        if (level.value >= LEVEL_CONFIG.CHAINS_START_LEVEL && !isJellyLevel.value && level.value % 10 !== 0) {
            let spawnedChains = 0
            const maxChains = 10
            const minChains = 2
            targetChains = Math.min(
                maxChains,
                minChains + Math.floor((level.value - LEVEL_CONFIG.CHAINS_START_LEVEL) / 2)
            )

            let attempts = 0
            while (spawnedChains < targetChains && attempts < 100) {
                attempts++
                const r = Math.floor(Math.random() * gridRows.value)
                const c = Math.floor(Math.random() * gridCols.value)
                const cell = tempBoard[r] && tempBoard[r][c]
                if (cell !== null && cell !== undefined && !cell.obstacle && !cell.unbreakable && cell.jelly === 0 && !cell.chained && cell.type) {
                    cell.chained = true
                    spawnedChains++
                }
            }
        }

    } while (!hasValidMoves(tempBoard))

    board.value = tempBoard

    if (level.value === 1) {
        moves.value = 10
    } else {
        const activeStones = level.value >= LEVEL_CONFIG.STONES_START_LEVEL ? Math.min(6, 2 + Math.floor((level.value - LEVEL_CONFIG.STONES_START_LEVEL) / 3)) : 0
        const activeChains = level.value >= LEVEL_CONFIG.CHAINS_START_LEVEL ? Math.min(5, 2 + Math.floor((level.value - LEVEL_CONFIG.CHAINS_START_LEVEL) / 2)) : 0

        calculatedMoves = Math.ceil(20 + (targetObstaclesCount * 1.3) + (activeStones * 1.5) + (activeChains * 1.5) + (isJellyLevel.value ? 4 : 0))
        moves.value = calculatedMoves
    }

    shuffleBoardIfDeadlock()
}

export function nextLevelOrRestart() {
    gameState.value = 'PLAYING'
    initLevel()
}

function hasValidMoves(currentBoard) {
    const rows = gridRows.value
    const cols = gridCols.value

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = currentBoard[r]?.[c]
            if (!cell || cell === null || cell.obstacle || cell.jelly > 0 || cell.unbreakable || cell.chained || (!cell.type && !cell.isRainbow && !cell.isKivano)) continue

            const directions = [{dr: 0, dc: 1}, {dr: 1, dc: 0}]
            for (let dir of directions) {
                const nr = r + dir.dr
                const nc = c + dir.dc

                if (nr < rows && nc < cols) {
                    const neighbor = currentBoard[nr]?.[nc]
                    if (!neighbor || neighbor === null || neighbor.obstacle || neighbor.jelly > 0 || neighbor.unbreakable || neighbor.chained || (!neighbor.type && !neighbor.isRainbow && !neighbor.isKivano)) continue

                    const tempType = cell.type
                    const tempRainbow = cell.isRainbow
                    const tempKivano = cell.isKivano

                    cell.type = neighbor.type
                    cell.isRainbow = neighbor.isRainbow
                    cell.isKivano = neighbor.isKivano
                    neighbor.type = tempType
                    neighbor.isRainbow = tempRainbow
                    neighbor.isKivano = tempKivano

                    const matchCheck = findMatchGroups(currentBoard)
                    const hasMatch = matchCheck.matches.length > 0 || matchCheck.fourInRowMatches.length > 0 || matchCheck.squareMatches.length > 0 || neighbor.isKivano || cell.isKivano || neighbor.isRainbow || cell.isRainbow

                    neighbor.type = cell.type
                    neighbor.isRainbow = cell.isRainbow
                    neighbor.isKivano = cell.isKivano
                    cell.type = tempType
                    cell.isRainbow = tempRainbow
                    cell.isKivano = tempKivano

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
        showFloatingBadge("match3.juicing", "text-amber-300", "0 4px 15px rgba(245, 158, 11, 0.6)")
        await sleep(400)
    }

    while (!hasValidMoves(board.value) && safetyCounter < 15) {
        safetyCounter++
        const candyItems = []

        for (let r = 0; r < gridRows.value; r++) {
            for (let c = 0; c < gridCols.value; c++) {
                const cell = board.value[r]?.[c]
                if (cell && cell !== null && !cell.obstacle && cell.jelly === 0 && !cell.unbreakable && !cell.chained && (cell.type || cell.isRainbow || cell.isKivano)) {
                    candyItems.push({type: cell.type, isRainbow: cell.isRainbow, isKivano: cell.isKivano})
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
                if (cell && cell !== null && !cell.obstacle && cell.jelly === 0 && !cell.unbreakable && !cell.chained && (cell.type || cell.isRainbow || cell.isKivano)) {
                    const item = candyItems[index++]
                    board.value[r][c] = {
                        ...cell,
                        id: nextId++,
                        type: item.type,
                        isRainbow: item.isRainbow,
                        isKivano: item.isKivano
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
    const fourInRowMatches = []
    const squareMatches = []
    const rows = gridRows.value
    const cols = gridCols.value

    if (level.value >= 2) {
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const cell1 = currentBoard[r]?.[c]
                const cell2 = currentBoard[r]?.[c + 1]
                const cell3 = currentBoard[r + 1]?.[c]
                const cell4 = currentBoard[r + 1]?.[c + 1]

                if (
                    cell1 && cell2 && cell3 && cell4 &&
                    cell1.type &&
                    cell1.type === cell2.type &&
                    cell1.type === cell3.type &&
                    cell1.type === cell4.type &&
                    !cell1.isRainbow && !cell2.isRainbow && !cell3.isRainbow && !cell4.isRainbow &&
                    !cell1.isKivano && !cell2.isKivano && !cell3.isKivano && !cell4.isKivano &&
                    !cell1.obstacle && !cell2.obstacle && !cell3.obstacle && !cell4.obstacle &&
                    cell1.jelly === 0 && cell2.jelly === 0 && cell3.jelly === 0 && cell4.jelly === 0 &&
                    !cell1.unbreakable && !cell2.unbreakable && !cell3.unbreakable && !cell4.unbreakable &&
                    !cell1.chained && !cell2.chained && !cell3.chained && !cell4.chained
                ) {
                    const coords = [{r, c}, {r, c: c + 1}, {r: r + 1, c}, {r: r + 1, c: c + 1}]
                    squareMatches.push({coords, center: {r, c}})
                    coords.forEach(coord => allMatchedCoords.add(`${coord.r},${coord.c}`))
                }
            }
        }
    }

    for (let r = 0; r < rows; r++) {
        let c = 0
        while (c < cols) {
            const currentCell = currentBoard[r]?.[c]
            if (!currentCell || currentCell === null || currentCell.isRainbow || currentCell.isKivano || currentCell.obstacle || currentCell.jelly > 0 || currentCell.unbreakable || currentCell.chained || !currentCell.type) {
                c++
                continue
            }
            let length = 1
            while (c + length < cols) {
                const nextCell = currentBoard[r]?.[c + length]
                if (!nextCell || nextCell === null || nextCell.type !== currentCell.type || nextCell.isRainbow || nextCell.isKivano || nextCell.obstacle || nextCell.jelly > 0 || nextCell.unbreakable || nextCell.chained) {
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
                if (length >= 4 && level.value >= 2) {
                    fourInRowMatches.push({coords: matchCoords, center: {r, c: c + 1}})
                }
            }
            c += length
        }
    }

    for (let c = 0; c < cols; c++) {
        let r = 0
        while (r < rows) {
            const currentCell = currentBoard[r]?.[c]
            if (!currentCell || currentCell === null || currentCell.isRainbow || currentCell.isKivano || currentCell.obstacle || currentCell.jelly > 0 || currentCell.unbreakable || currentCell.chained || !currentCell.type) {
                r++
                continue
            }
            let length = 1
            while (r + length < rows) {
                const nextCell = currentBoard[r + length]?.[c]
                if (!nextCell || nextCell === null || nextCell.type !== currentCell.type || nextCell.isRainbow || nextCell.isKivano || nextCell.obstacle || nextCell.jelly > 0 || nextCell.unbreakable || nextCell.chained) {
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
                if (length >= 4 && level.value >= 2) {
                    fourInRowMatches.push({coords: matchCoords, center: {r: r + 1, c}})
                }
            }
            r += length
        }
    }

    const matches = Array.from(allMatchedCoords).map(str => {
        const [r, c] = str.split(',').map(Number)
        return {r, c}
    })

    return {matches, fourInRowMatches, squareMatches}
}

export function onTouchStart(e, r, c) {
    if (isProcessing.value || isLevelPassed.value || isShuffling.value || moves.value <= 0) return
    const cell = board.value[r]?.[c]
    if (!cell || cell === null || cell.chained || cell.jelly > 0 || cell.obstacle) return
    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    activeCell.value = {r, c}
}

export function onTouchMove(e) {
    if (!activeCell.value || isProcessing.value || isShuffling.value) return
    e.preventDefault()
}

export async function onTouchEnd(e) {
    if (!activeCell.value || isProcessing.value || isShuffling.value) return
    const touch = e.changedTouches[0]
    await evaluateSwipe(touch.clientX - startX, touch.clientY - startY)
}

export function onMouseDown(e, r, c) {
    if (isProcessing.value || isLevelPassed.value || isShuffling.value || moves.value <= 0) return
    const cell = board.value[r]?.[c]
    if (!cell || cell === null || cell.chained || cell.jelly > 0 || cell.obstacle) return
    startX = e.clientX
    startY = e.clientY
    activeCell.value = {r, c}
    window.addEventListener('mouseup', onMouseUp)
}

export async function onMouseUp(e) {
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
            !cell1.obstacle && cell1.jelly === 0 && !cell1.unbreakable && !cell1.chained &&
            !cell2.obstacle && cell2.jelly === 0 && !cell2.unbreakable && !cell2.chained &&
            (cell1.type || cell1.isRainbow || cell1.isKivano) && (cell2.type || cell2.isRainbow || cell2.isKivano)) {
            await trySwap(r, c, targetR, targetC)
        }
    }
}

async function trySwap(r1, c1, r2, c2) {
    isProcessing.value = true

    const cell1 = board.value[r1][c1]
    const cell2 = board.value[r2][c2]

    let kivanoActivated = false

    if (cell1.isKivano) {
        kivanoActivated = true
    } else if (cell2.isKivano) {
        kivanoActivated = true
    }

    if (kivanoActivated) {
        moves.value--
        swapCellObjects(r1, c1, r2, c2)
        await sleep(150)

        await activateKivano(r2, c2)

        if (level.value > 1 && remainingTargets.value === 0) {
            triggerVictory()
            isProcessing.value = false
            return
        }
        if (moves.value <= 0 && remainingTargets.value > 0) {
            triggerGameOver()
            return
        }
        await processMatchesAndDrop()
        isProcessing.value = false
        return
    }

    let rainbowActivated = false
    let targetFruitType = null

    if (cell1.isRainbow && !cell2.obstacle && cell2.jelly === 0 && !cell2.unbreakable && !cell2.chained && cell2.type) {
        rainbowActivated = true
        targetFruitType = cell2.type
    } else if (cell2.isRainbow && !cell1.obstacle && cell1.jelly === 0 && !cell1.unbreakable && !cell1.chained && cell1.type) {
        rainbowActivated = true
        targetFruitType = cell1.type
    }

    swapCellObjects(r1, c1, r2, c2)
    await sleep(400)

    if (rainbowActivated) {
        moves.value--
        showFloatingBadge("match3.juicy_explosion", "text-[#66FF66]", "0 4px 15px rgba(6, 182, 212, 0.6)")
        await processRainbowActivation(
            targetFruitType,
            cell1.isRainbow ? {r: r2, c: c2} : {r: r1, c: c1}
        )

        if (level.value > 1 && remainingTargets.value === 0) {
            triggerVictory()
            return
        }
        if (level.value > 1 && moves.value <= 0 && remainingTargets.value > 0) {
            triggerGameOver()
            return
        }
        applyGravityAndSpawn()
        await sleep(420)
        await processMatchesAndDrop()
    } else {
        const group = findMatchGroups(board.value)
        if (group.matches.length > 0 || group.fourInRowMatches.length > 0 || group.squareMatches.length > 0) {
            moves.value--
            await sleep(50)
            await processMatchesAndDrop()
        } else {
            swapCellObjects(r1, c1, r2, c2)
            await sleep(300)
        }
    }
    if (level.value > 1 && moves.value <= 0 && remainingTargets.value > 0) {
        triggerGameOver()
        isProcessing.value = false
        return
    }
    isProcessing.value = false
}

async function activateKivano(r, c) {
    const rows = gridRows.value
    const cols = gridCols.value

    const targets = []
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = board.value[row]?.[col]
            if (cell) {
                if (isJellyLevel.value && cell.jelly > 0) targets.push({r: row, c: col})
                else if (!isJellyLevel.value && cell.obstacle) targets.push({r: row, c: col})
            }
        }
    }

    board.value[r][c] = createCell(null, null)

    if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)]

        flyingKivano.value = {
            startX: c,
            startY: r,
            endX: target.c,
            endY: target.r
        }

        showFloatingBadge("match3.kivano_attack", "text-lime-300", "0 4px 15px rgba(132, 204, 22, 0.6)")

        await sleep(500)
        flyingKivano.value = null

        if (board.value[target.r]?.[target.c]) {
            if (isJellyLevel.value) {
                board.value[target.r][target.c].jelly = Math.max(0, board.value[target.r][target.c].jelly - 1)
            } else {
                board.value[target.r][target.c].obstacle = null
            }
            score.value += 500
        }
    } else {
        showFloatingBadge("match3.juicy_explosion", "text-yellow-300", "0 4px 15px rgba(234, 179, 8, 0.6)")
        await sleep(300)
    }

    applyGravityAndSpawn()
    await sleep(400)
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
    matchesToRemove.forEach(m => {
        if (board.value[m.r]?.[m.c]) {
            board.value[m.r][m.c].isBlinking = true
        }
    })

    // 2. Ждём, пока они поморгают (3 мигания ≈ 660ms)
    await sleep(700)
    const targetsToDamage = new Set()
    matchesToRemove.forEach(m => {
        const neighbors = [
            {r: m.r - 1, c: m.c},
            {r: m.r + 1, c: m.c},
            {r: m.r, c: m.c - 1},
            {r: m.r, c: m.c + 1}
        ]
        neighbors.forEach(n => {
            if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols) {
                const neighborCell = board.value[n.r]?.[n.c]
                if (neighborCell) {
                    if (isJellyLevel.value && neighborCell.jelly > 0) targetsToDamage.add(`${n.r},${n.c}`)
                    else if (!isJellyLevel.value && neighborCell.obstacle) targetsToDamage.add(`${n.r},${n.c}`)
                }
            }
        })
    })

    matchesToRemove.forEach(m => {
        if (board.value[m.r][m.c] !== null) {
            board.value[m.r][m.c] = createCell(null, null)
        }
    })

    targetsToDamage.forEach(str => {
        const [r, c] = str.split(',').map(Number)
        if (board.value[r][c] !== null) {
            if (isJellyLevel.value) {
                board.value[r][c].jelly = Math.max(0, board.value[r][c].jelly - 1)
            } else {
                board.value[r][c].obstacle = null
            }
            score.value += 500
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
            if (cell.obstacle || cell.jelly > 0 || cell.unbreakable || cell.chained) {
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
            if (seg.length === 1 && (seg[0]?.obstacle || seg[0]?.jelly > 0 || seg[0]?.unbreakable || seg[0]?.chained)) {
                newColCells.push(seg[0])
            } else {
                let candiesInSeg = seg.filter(cell => cell && (cell.type !== null || cell.isRainbow || cell.isKivano))
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

    while (group.matches.length > 0 || group.fourInRowMatches.length > 0 || group.squareMatches.length > 0) {
        score.value += (group.matches.length * 30 + group.fourInRowMatches.length * 150 + group.squareMatches.length * 150)

        if (group.fourInRowMatches.length > 0) {
            showFloatingBadge("match3.super_fruit", "text-purple-400", "0 4px 15px rgba(168, 85, 247, 0.6)")
        } else if (group.squareMatches.length > 0) {
            showFloatingBadge("match3.kivano", "text-lime-300", "0 4px 15px rgba(132, 204, 22, 0.6)")
        } else if (group.matches.length >= 5) {
            showFloatingBadge("match3.magnificent", "text-emerald-400", "0 4px 15px rgba(16, 185, 129, 0.6)")
        } else if (group.matches.length >= 4) {
            showFloatingBadge("match3.great", "text-amber-400", "0 4px 15px rgba(245, 158, 11, 0.6)")
        }

        const targetsToDamage = new Set()
        const cellsToBreakChain = new Set()
        const rainbowSpawns = []
        const kivanoSpawns = []

        group.squareMatches.forEach(sq => {
            kivanoSpawns.push(sq.center)
        })

        group.fourInRowMatches.forEach(four => {
            rainbowSpawns.push(four.center)
        })

        group.matches.forEach(m => {
            const neighbors = [
                {r: m.r - 1, c: m.c}, {r: m.r + 1, c: m.c},
                {r: m.r, c: m.c - 1}, {r: m.r, c: m.c + 1}
            ]
            neighbors.forEach(n => {
                if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols) {
                    const neighborCell = board.value[n.r]?.[n.c]
                    if (neighborCell) {
                        if (isJellyLevel.value && neighborCell.jelly > 0) targetsToDamage.add(`${n.r},${n.c}`)
                        else if (!isJellyLevel.value && neighborCell.obstacle) targetsToDamage.add(`${n.r},${n.c}`)
                        if (neighborCell.chained) cellsToBreakChain.add(`${n.r},${n.c}`)
                    }
                }
            })
        })

        group.matches.forEach(m => {
            const isSpecialTarget = rainbowSpawns.some(rCell => rCell.r === m.r && rCell.c === m.c) ||
                kivanoSpawns.some(kCell => kCell.r === m.r && kCell.c === m.c)
            if (!isSpecialTarget && board.value[m.r][m.c] !== null) {
                board.value[m.r][m.c] = createCell(null, null)
            }
        })

        rainbowSpawns.forEach(pos => {
            if (board.value[pos.r][pos.c] !== null) {
                board.value[pos.r][pos.c] = createCell(null, null, true, false)
            }
        })

        kivanoSpawns.forEach(pos => {
            if (board.value[pos.r][pos.c] !== null) {
                board.value[pos.r][pos.c] = createCell(null, null, false, true)
            }
        })

        targetsToDamage.forEach(str => {
            const [r, c] = str.split(',').map(Number)
            if (board.value[r][c] !== null) {
                if (isJellyLevel.value) {
                    board.value[r][c].jelly = Math.max(0, board.value[r][c].jelly - 1)
                } else {
                    board.value[r][c].obstacle = null
                }
                score.value += 200
            }
        })

        cellsToBreakChain.forEach(str => {
            const [r, c] = str.split(',').map(Number)
            if (board.value[r]?.[c]) {
                board.value[r][c].chained = false
            }
        })

        if (level.value === 1 && levelProgressPercent.value === 100) {
            triggerVictory()
            break
        } else if (level.value > 1 && remainingTargets.value === 0) {
            triggerVictory()
            break
        }

        applyGravityAndSpawn()

        await sleep(400)
        group = findMatchGroups(board.value)
    }

    if (level.value > 1 && remainingTargets.value === 0) {
        triggerVictory()
    } else if (level.value > 1 && moves.value <= 0 && remainingTargets.value > 0) {
        triggerGameOver()
        return
    }

    shuffleBoardIfDeadlock()
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function restartLevel() {
    if (gameData.coins < 50) {
        return
    }
    gameData.coins -= 50
    initLevel()
}