import {ref, reactive, watch, computed} from 'vue'
import {initGameData, isLoading, resetPet, syncToBackend} from "@/scripts/api.js";
import {foodList} from "@/scripts/objectItems.js";
import i18n from "@/scripts/locales/i18n.js";

export const mouth = ref('')
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
export const statusShower = ref(false)
export const currentDraggedItem = ref(null)
export const blink = ref(false)
export const location = ref()
export const activeTab = ref('food')
export const warning = ref(false)
export const isPopping = ref(false)
export const isCoinPopping = ref(false)
export const isExpPopping = ref(false)
export const clickLimit = 200;
export const isGameInitialized = ref(false)
export const fruitStreak = ref(
    Number(localStorage.getItem('pet_fruitStreak')) || 0
)


export const statusFoam = ref(localStorage.getItem('pet_statusFoam') === 'true')
export const colorFoam = ref(localStorage.getItem('pet_colorFoam') || 'bg-white/70')
export const foamOffset = ref(Number(localStorage.getItem('pet_foamOffset')) || 0)

// Автоматически сохраняем при любом изменении
watch(statusFoam, (newValue) => {
    localStorage.setItem('pet_statusFoam', newValue)
})

watch(colorFoam, (newValue) => {
    localStorage.setItem('pet_colorFoam', newValue)
})

watch(foamOffset, (newValue) => {
    localStorage.setItem('pet_foamOffset', newValue)
})


const ADMIN_IDS = [
    '1059422557',
    '2101015196',
    '743865425',
    '7287871980'

]
const userId = computed(() => {
    return String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '')
})

export const isAdmin = computed(() => ADMIN_IDS.includes(userId.value))

export const isTutorialCompleted = computed(() => {
    return localStorage.getItem('tutorial_completed') === 'true' || gameData.tutorialCompleted;
});

// Автоматически сохраняем при любом изменении
watch(fruitStreak, (newValue) => {
    localStorage.setItem('pet_fruitStreak', newValue)
})


export const FatPlayCount = ref(
    Number(localStorage.getItem('pet_FatPlayCount')) || 0
)
export const ZeroPlayCount = ref(
    Number(localStorage.getItem('pet_ZeroPlayCount')) || 0
)
// Автоматически сохраняем при любом изменении
watch(FatPlayCount, (newValue) => {
    localStorage.setItem('pet_FatPlayCount', newValue)
})

// Отслеживаем и сохраняем ZeroPlayCount
watch(ZeroPlayCount, (newValue) => {
    localStorage.setItem('pet_ZeroPlayCount', newValue)
})

// export const body = ref("/character/main_body.webp")
export const bodyType = ref('normal')
const savedMatch3Level = localStorage.getItem('match3_level') ? parseInt(localStorage.getItem('match3_level')) : 1

export const defaultGameData = {
    name: '',
    level: 1,
    match3_level:savedMatch3Level,
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
    old_1_phase:false,
    old_2_phase:false,
    sleepEndTime: 0,
    feedCount: 0,
    equippedHead: null,
    equippedClothes: null,
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
    unlockedClothes: [],
    tutorialCompleted: false,
    referredBy:false,
    season:'summer',
    language: localStorage.getItem('pet_language') || 'en',
    cart: {},
    isGameOver: false,
    daily_tasks: {
        feed: { progress: 0, claimed: false },
        wash: { progress: 0, claimed: false },
        click: { progress: 0, claimed: false }
    }
}

export const maxLives = computed(() => {
    return gameData.level >= 80 ? 2 : 3;
})

// Создаем реактивный объект, используя дефолты
export const gameData = reactive({
    ...defaultGameData,
    lastUpdate: Date.now()
})

watch(() => gameData.match3_level, (newLevel) => {
    localStorage.setItem('match3_level', newLevel)
})

export async function handleRestart() {
    isLoading.value = true
    fruitStreak.value = 0
    foamOffset.value = 0
    // 1. Сбрасываем питомца на бэкенде
    const success = await resetPet()
    if (!success) {
        isLoading.value = false
        return
    }

    // 2. Очищаем локальные данные под дефолт
    await resetLocal()

    // 3. Загружаем свежие чистые данные с сервера
    await initGameData()

    // 4. Гарантированно убираем статус смерти и скрываем плашку в самом конце
    gameData.isGameOver = false
    currentStatus.value = null
    isLoading.value = false
}
export async function resetLocal() {
    const savedCoins = gameData.coins
    const savedClicks = gameData.clickCounter
    const savedDeathsCount = gameData.deathsCount
    const savedSeason = gameData.season

    const savedClothes = gameData.equippedClothes
    const savedHead = gameData.equippedHead
    const savedUnlockedClothes = gameData.unlockedClothes ? [...gameData.unlockedClothes] : []
    const savedUnlockedHeads = gameData.unlockedHeads ? [...gameData.unlockedHeads] : []

    currentStatus.value = null
    // 2. Применяем дефолтные значения ко всем остальным полям
    Object.assign(gameData, defaultGameData, {
        lastUpdate: Date.now()
    })

    // 3. Возвращаем сохраненные значения обратно
    gameData.coins = savedCoins
    gameData.clickCounter = savedClicks
    gameData.deathsCount = savedDeathsCount
    gameData.season =savedSeason
    gameData.equippedClothes = savedClothes
    gameData.equippedHead = savedHead
    gameData.unlockedClothes = savedUnlockedClothes
    gameData.unlockedHeads = savedUnlockedHeads

}


export const isBadMood = computed(() => {
    return showHunger.value || lowEnergy.value || gameData.sick || gameData.lives <=1
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
        if (tutorialStep.value > 8) { // Всего 3 шага, например
            tutorialStep.value = 0
            localStorage.setItem('tutorial_completed', 'true') // Чтобы больше не показывать
            gameData.tutorialCompleted = true
        }
    }
}

export const currentStatus = ref(null)

const STATUS_DURATIONS = {
    feed: 800,
    lifeGain: 800,
    losingLife: 800,
    levelUp: 1500,
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

    if (type === 'levelUp') {
        localStorage.setItem('pending_level_up', JSON.stringify({
            level: gameData.level,
            timestamp: Date.now()
        }));
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
    if (!currentStatus.value && !gameData.isGameOver) {
        return {show: false}
    }

    // Приоритет 1: Смерть питомца
    if (gameData.isGameOver || currentStatus.value?.type === 'gameOver') {
        return {
            show: true,
            text: i18n.global.t('store.pet_died'),
            image: "/gamePlay/grave.webp",
            bgColor: "bg-[#808080]"
        }
    }

    const type = currentStatus.value?.type
    const payload = currentStatus.value?.payload

    // Приоритет 2: Повышение уровня
    if (type === 'levelUp') {
        if (gameData.level ===2){
            return {
                show: true,
                text: i18n.global.t('store.happy_birthday'),
                additional: gameData.level,
                image: null,
                bgColor: "bg-[#FFB266]/60"
            }
        }else if(gameData.level ===10){
            return {
                show: true,
                text: i18n.global.t('store.growth_spurt'),
                additional: gameData.level,
                image: null,
                bgColor: "bg-[#FFB266]/60"
            }
        }else if(gameData.level ===40){
            return {
                show: true,
                text: i18n.global.t('store.growth_spurt'),
                additional: gameData.level,
                image: null,
                bgColor: "bg-[#FFB266]/60"
            }
        }else if(gameData.level ===80){
            return {
                show: true,
                text: i18n.global.t('store.growth_spurt'),
                additional: gameData.level,
                image: null,
                bgColor: "bg-[#FFB266]/60"
            }
        } else{
            return {
                show: true,
                text: i18n.global.t('store.level_up'),
                additional: gameData.level,
                image: null
            }
        }

    }

    // Приоритет 3: Потеря жизни (-1)
    if (type === 'losingLife') {
        return {
            show: true,
            text: i18n.global.t('store.loss_life'),
            image: "/gamePlay/heart_broken.webp",
            bgColor: "bg-[#CC0000]/40"
        }
    }

    // Приоритет 4: Получение жизни (+1)
    if (type === 'lifeGain') {
        return {
            show: true,
            text: i18n.global.t('store.gain_life'),
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
            text: i18n.global.t('store.yummy'),
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

export const isBothStatsZero = computed(()=>{
    return gameData.foodLevel <= 0 && gameData.energy <= 0;
})


export const characterPath = computed(() => {
    return gameData.level >= 10 ? '/character' : '/character/kid'
})
