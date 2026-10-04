import {ref, reactive, watch, computed} from 'vue'
export const mouth = ref('/character/happy_mouth.webp')
export const sleepTimeRemaining = ref("")
import {initGameData, isLoading, resetPet} from "@/scripts/api.js";


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

