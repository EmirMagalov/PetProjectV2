import {ref, reactive, watch, computed} from 'vue'
import {initGameData, isLoading, resetPet} from "@/scripts/api.js";
import {foodList} from "@/scripts/objectItems.js";

export const mouth = ref('/character/happy_mouth.webp')
export const sleepTimeRemaining = ref("")
export const isShopOpen = ref(false)
export const lowEnergy = ref(false)
export const showHunger = ref(false)
export const cloudShow = ref(false)
export const energyFull = ref(false)
export const lastFedItem = ref(null)
export const sameFoodCount = ref(0)
export const isAnimating = ref(false)
export const isVibrating = ref(false)
export const hearts = ref(false)
export const showTongue = ref(false)
export const dropZoneRef = ref()
export const feedStatus = ref(false)
export const statusFoam = ref(false)
export const statusShower = ref(false)
export const currentDraggedItem = ref(null)
export const blink = ref(false)
export const location = ref()
export const activeTab = ref('food')
export const warning = ref(false)
export const isPopping = ref(false)
export const isCoinPopping = ref(false)
export const isExpPopping = ref(false)
export const fruitStreak = ref(
    Number(localStorage.getItem('pet_fruitStreak')) || 0
)

// Автоматически сохраняем при любом изменении
watch(fruitStreak, (newValue) => {
    localStorage.setItem('pet_fruitStreak', newValue)
})


export const PlayCount = ref(
    Number(localStorage.getItem('pet_PlayCount')) || 0
)

// Автоматически сохраняем при любом изменении
watch(PlayCount, (newValue) => {
    localStorage.setItem('pet_PlayCount', newValue)
})


// export const body = ref("/character/main_body.webp")
export const bodyType = ref('normal')

export const isGameOver = ref(false)

export const defaultGameData = {
    name: 'Имя:',
    level: 1,
    exp: 0,
    coins: 50,
    lives: 3,
    deathsCount: 0,
    foodLevel: 50,
    energy: 50,
    clickCounter: 0,
    fatCount: 0,
    stinky: false,
    sleep: false,
    sleepEndTime: 0,
    feedCount: 9,
    equippedHead: null,
    equippedCostume: null,
    foodStreak: 0,
    fastfoodStreak: 0,
    sick: false,
    addictionStreak: 0,
    lastAddictionTime: 0,
    isFat: false,
    // isDrunk: false,
    isPooped: false,
    badStatsMinutes: 0,
    unlockedHeads: [],
    unlockedCostumes: [],
    cart: {}
}

// Создаем реактивный объект, используя дефолты
export const gameData = reactive({
    ...defaultGameData,
    lastUpdate: Date.now()
})


export async function handleRestart() {
    isGameOver.value = false
    currentStatus.value = null
    isLoading.value = true
    fruitStreak.value = 0
    await resetPet()
    await resetLocal()
    // Просто обновляем поля до дефолтных без дублирования портянки кода
    await initGameData()
}

export async function resetLocal() {
    const savedCoins = gameData.coins
    const savedClicks = gameData.clickCounter
    const savedDeathsCount = gameData.deathsCount
    currentStatus.value = null
    // 2. Применяем дефолтные значения ко всем остальным полям
    Object.assign(gameData, defaultGameData, {
        lastUpdate: Date.now()
    })

    // 3. Возвращаем сохраненные значения обратно
    gameData.coins = savedCoins
    gameData.clickCounter = savedClicks
    gameData.deathsCount = savedDeathsCount
}


export const isBadMood = computed(() => {
    return showHunger.value || lowEnergy.value || gameData.sick
})


document.addEventListener('contextmenu', e => {
    if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
    }
});


// Шаг онбординга: 0 — выключен, 1 — кормежка, 2 — мытье, 3 — сон и т.д.
export const tutorialStep = ref(localStorage.getItem('tutorial_completed') ? 0 : 1)

export function nextTutorialStep() {
    if (tutorialStep.value > 0) {
        tutorialStep.value++
        if (tutorialStep.value > 7) { // Всего 3 шага, например
            tutorialStep.value = 0
            localStorage.setItem('tutorial_completed', 'true') // Чтобы больше не показывать
        }
    }
}

export const currentStatus = ref(null)

const STATUS_DURATIONS = {
    feed: 800,
    lifeGain: 800,
    losingLife: 800,
    levelUp: 800,
    gameOver: 0 // Не сбрасываем
}
const STATUS_PRIORITIES = {
    feed: 1,
    lifeGain: 2,
    losingLife: 3,
    levelUp: 4,
    gameOver: 5
}
const statusQueue = ref([])
let isProcessingQueue = false



export function showStatus(type, payload = null) {
    if (type === 'gameOver') {
        statusQueue.value = [] // Очищаем очередь при смерти
        currentStatus.value = {type, payload}
        return
    }

    // Добавляем новое событие в очередь
    statusQueue.value.push({
        type,
        payload,
        priority: STATUS_PRIORITIES[type] || 0
    })

    // Сортируем очередь от большего приоритета к меньшему (levelUp встанет раньше feed)
    statusQueue.value.sort((a, b) => b.priority - a.priority)

    // Запускаем обработку очереди
    processStatusQueue()
}

function processStatusQueue() {
    // Если уже показывается статус или очередь пуста — ничего не делаем
    if (isProcessingQueue || statusQueue.value.length === 0) return

    isProcessingQueue = true

    // Достаем самый важный статус из очереди
    const nextStatus = statusQueue.value.shift()
    currentStatus.value = nextStatus

    const duration = STATUS_DURATIONS[nextStatus.type] ?? 800

    if (duration > 0) {
        setTimeout(() => {
            currentStatus.value = null
            isProcessingQueue = false

            // Запускаем следующее событие из очереди (если есть)
            processStatusQueue()
        }, duration)
    }
}

export const activeStatus = computed(() => {
    // Если ничего не происходит и игра не окончена
    if (!currentStatus.value && !isGameOver.value) {
        return {show: false}
    }

    // Приоритет 1: Смерть питомца
    if (isGameOver.value || currentStatus.value?.type === 'gameOver') {
        return {
            show: true,
            text: "Питомец погиб!",
            image: "/gamePlay/grave.webp",
            bgColor: "bg-[#808080]"
        }
    }

    const type = currentStatus.value?.type
    const payload = currentStatus.value?.payload

    // Приоритет 2: Повышение уровня
    if (type === 'levelUp') {
        return {
            show: true,
            text: "Уровень повышен",
            additional: gameData.level,
            image: null
        }
    }

    // Приоритет 3: Потеря жизни (-1)
    if (type === 'losingLife') {
        return {
            show: true,
            text: "- 1 жизнь!",
            image: "/gamePlay/heart_broken.webp",
            bgColor: "bg-[#CC0000]/40"
        }
    }

    // Приоритет 4: Получение жизни (+1)
    if (type === 'lifeGain') {
        return {
            show: true,
            text: "+ 1 жизнь!",
            image: "/gamePlay/heart.webp",
            bgColor: "bg-[#FF0000]/40"
        }
    }

    // Приоритет 5: Кормежка (ням-ням)
    if (type === 'feed') {
        const targetFoodId = payload?.fedItemId || lastFedItem.value
        const fedItemObj = foodList.find(item => item.id === targetFoodId)

        // Прирост сытости
        const rawGain = payload?.actualGain ?? fedItemObj?.foodGain ?? 0
        const actualGain = Math.ceil(rawGain)

        // Прирост энергии (если есть)
        const rawEnergyGain = payload?.actualEnergyGain ?? fedItemObj?.energyGain ?? 0
        const actualEnergyGain = Math.ceil(rawEnergyGain)

        return {
            show: true,
            text: "Ням-ням!",
            image: "/gamePlay/hunger.webp",
            additional: actualGain > 0 ? `+${actualGain}` : 'MAX!',

            // Новые поля для энергии:
            energyImage: actualEnergyGain > 0 ? "/gamePlay/energy.webp" : null,
            energyAdditional: actualEnergyGain > 0 ? `+${actualEnergyGain}` : null,

            bgColor: 'bg-[#FFFF66]/40'
        }
    }

    return {show: false}
})