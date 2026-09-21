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

export const isAnimating = ref(false)
export const isVibrating = ref(false)
export const hearts = ref(false)


export const dropZoneRef = ref()
export const feedStatus = ref(false)
export const lifeStatus = ref(false)
export const statusFoam = ref(false)
export const statusShower = ref(false)
export const currentDraggedItem = ref(null)
export const blink = ref(false)
export const locationUrl = ref()
export const location = ref()
// ==========================================
// 3. АВТОМАТИЧЕСКОЕ СОХРАНЕНИЕ (WATCHERS)
// ==========================================
// Загружаем из localStorage или ставим 0
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
    feedCount: 3,
    equippedHead: null,
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
    return showHunger.value || lowEnergy.value || gameData.addictionStreak >= 2
})


document.addEventListener('contextmenu', e => {
    if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
    }
});


