import {ref, reactive, watch, computed} from 'vue'

export const mouth = ref('/character/happy_mouth.webp')
export const sleepTimeRemaining = ref("")

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

export const body = ref("/character/main_body.webp")

export const isGameOver = ref(false)

export const gameData = reactive({
    level: 1,
    exp: 0,
    coins: 50,
    lives: 3,
    foodLevel: 50,
    energy: 50,
    clickCounter:0,
    stinky: false,
    sleep: false,
    sleepEndTime: 0,
    feedCount: 3,
    equippedHead: null,
    lastUpdate: Date.now(),
    foodStreak: 0,
    fastfoodStreak: 0,
    fruitStreak: 0,
    addictionLevel: 0,
    addictionStreak: 0,
    lastAddictionTime:0,
    isFat: false,
    isDrunk: false,
    PlayCount: 0,
    badStatsMinutes: 0,
    unlockedHeads:[],
    cart: {}

})

export const isBadMood = computed(() => {
    return showHunger.value || lowEnergy.value || gameData.addictionStreak >=2
})


document.addEventListener('contextmenu', e => {
    if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
    }
});