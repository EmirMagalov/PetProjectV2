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
export const lifeStatus = ref(false)
export const isLosingLifeStatus = ref(false)
export const statusFoam = ref(false)
export const statusShower = ref(false)
export const currentDraggedItem = ref(null)
export const blink = ref(false)
export const locationUrl = ref()
export const location = ref()
export const activeTab = ref('food')
export const warning = ref(false)
export const isPopping = ref(false)
export const levelStatus = ref(false);
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


export const body = ref("/character/main_body.webp")
export const bodyType = ref('normal')

export const isGameOver = ref(false)

export const defaultGameData = {
    name: 'Имя:',
    level: 1,
    exp: 0,
    coins: 50,
    lives: 3,
    foodLevel: 50,
    energy: 50,
    clickCounter: 0,
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

    // 2. Применяем дефолтные значения ко всем остальным полям
    Object.assign(gameData, defaultGameData, {
        lastUpdate: Date.now()
    })

    // 3. Возвращаем сохраненные значения обратно
    gameData.coins = savedCoins
    gameData.clickCounter = savedClicks
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

let statusTimer = null

watch(currentStatus, (newStatus) => {
    if (statusTimer) {
        clearTimeout(statusTimer)
        statusTimer = null
    }

    if (!newStatus) return

    const duration = STATUS_DURATIONS[newStatus.type] ?? 800

    if (duration > 0) {
        statusTimer = setTimeout(() => {
            currentStatus.value = null
            statusTimer = null
        }, duration)
    }
})

export function showStatus(type, payload = null) {
    currentStatus.value = { type, payload }
}

export const activeStatus = computed(() => {
    // Если ничего не происходит и игра не окончена
    if (!currentStatus.value && !isGameOver.value) {
        return { show: false }
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
            image: "/gamePlay/heart_broken.webp"
        }
    }

    // Приоритет 4: Получение жизни (+1)
    if (type === 'lifeGain') {
        return {
            show: true,
            text: "+ 1 жизнь!",
            image: "/gamePlay/heart.webp"
        }
    }

    // Приоритет 5: Кормежка (ням-ням)
    if (type === 'feed') {
        // Ищем еду по переданному fedItemId или по lastFedItem
        const targetFoodId = payload?.fedItemId || lastFedItem.value
        const fedItemObj = foodList.find(item => item.id === targetFoodId)

        return {
            show: true,
            text: "Ням-ням!",
            image: "/gamePlay/hunger.webp",
            additional: `+${fedItemObj?.foodGain || 0}`
        }
    }

    return { show: false }
})