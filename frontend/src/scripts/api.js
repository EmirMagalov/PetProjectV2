import axios from 'axios'
import { gameData } from './useGameStore.js'
import { ref } from "vue";

export const API_URL = import.meta.env.VITE_API_URL || '/api'

export const isLoading = ref(true)
let isDataLoaded = false

// ====================== ЗАГРУЗКА ======================
export async function initGameData() {
    const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    isLoading.value = true

    const maxRetries = 5
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 800))
            const [response] = await Promise.all([
                axios.get(`${API_URL}/${tgId}`),
                minDelay
            ])
            applyServerData(response.data)

            isDataLoaded = true
            isLoading.value = false
            console.log("✅ Данные успешно синхронизированы с сервером!")
            return

        } catch (e) {
            console.warn(`⚠️ Попытка ${attempt} из ${maxRetries} не удалась...`, e)

            if (attempt === maxRetries) {
                console.error("❌ Не удалось подключиться к бэкенду после всех попыток.")
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }
    }
}

function applyServerData(serverData) {
    gameData.name = serverData.name && serverData.name.trim() ? serverData.name : 'Имя:'
    gameData.level = serverData.level
    gameData.exp = serverData.exp
    gameData.coins = serverData.coins
    gameData.lives = serverData.lives
    gameData.foodLevel = serverData.food_level
    gameData.energy = serverData.energy
    gameData.stinky = serverData.stinky
    gameData.clickCounter = serverData.click_counter
    gameData.sleep = serverData.sleep
    gameData.sleepEndTime = serverData.sleep_end_time
    gameData.fastfoodStreak = serverData.fastfood_streak
    gameData.isFat = serverData.is_fat
    gameData.isDrunk = serverData.is_drunk
    gameData.isPooped = serverData.is_pooped
    gameData.addictionLevel = serverData.addiction_level
    gameData.addictionStreak = serverData.addiction_streak
    gameData.cart = serverData.cart
    gameData.unlockedHeads = serverData.unlocked_heads
    gameData.equippedHead = serverData.equipped_head
    gameData.lastUpdate = serverData.last_update ? Math.floor(serverData.last_update * 1000) : Date.now()
}

// Тихая перезагрузка (без лоадера)
async function quietReload() {
    const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    try {
        const response = await axios.get(`${API_URL}/${tgId}`)
        applyServerData(response.data)
        console.log("✅ Данные тихо обновлены")
    } catch (e) {
        console.warn("⚠️ Не удалось тихо обновить данные", e)
    }
}

// ====================== СБРОС ======================
export async function resetPet() {
    const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    try {
        await axios.post(`${API_URL}/reset`, { tg_id: tgId })
        return true
    } catch (e) {
        console.error("❌ Ошибка при сбросе питомца:", e)
        return false
    }
}

// ====================== СИНХРОНИЗАЦИЯ ======================
export async function syncToBackend() {
    if (!isDataLoaded) {
        console.warn("⚠️ Синхронизация заблокирована: данные ещё не загружены.")
        return
    }

    const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    const payload = {
        tg_id: tgId,
        name: gameData.name,
        level: gameData.level,
        exp: gameData.exp,
        coins: gameData.coins,
        cart: gameData.cart,
        unlocked_heads: gameData.unlockedHeads,
        equipped_head: gameData.equippedHead,
        lives: gameData.lives,
        food_level: gameData.foodLevel,
        energy: gameData.energy,
        stinky: gameData.stinky,
        sleep: gameData.sleep,
        click_counter: gameData.clickCounter,
        sleep_end_time: gameData.sleepEndTime,
        fastfood_streak: gameData.fastfoodStreak,
        is_fat: gameData.isFat,
        is_drunk: gameData.isDrunk,
        is_pooped: gameData.isPooped,
        addiction_level: gameData.addictionLevel,
        addiction_streak: gameData.addictionStreak,
        last_update: Math.floor(gameData.lastUpdate / 1000)   // ← ВАЖНО: старый last_update
    }

    try {
        const response = await axios.post(`${API_URL}/update`, payload)

        if (response.data?.status === "outdated") {
            console.warn("⚠️ Данные устарели — загружаем свежие")
            if (response.data.server_data) {
                applyServerData(response.data.server_data)
            } else {
                await quietReload()
            }
            return
        }

        // Успешно сохранили
        if (response.data?.pet?.last_update) {
            gameData.lastUpdate = Math.floor(response.data.pet.last_update * 1000)
        } else {
            gameData.lastUpdate = Date.now()
        }

    } catch (e) {
        console.error("❌ Ошибка сохранения:", e)
    }
}

// Автосохранение каждые 15 секунд
setInterval(syncToBackend, 15000)

// Обработка видимости окна
document.addEventListener('visibilitychange', async () => {
    if (!isDataLoaded) return

    if (document.visibilityState === 'hidden') {
        // Уходим — сохраняем
        const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id

        const payload = JSON.stringify({
            tg_id: tgId,
            name: gameData.name,
            level: gameData.level,
            exp: gameData.exp,
            coins: gameData.coins,
            cart: gameData.cart,
            unlocked_heads: gameData.unlockedHeads,
            equipped_head: gameData.equippedHead,
            lives: gameData.lives,
            food_level: gameData.foodLevel,
            energy: gameData.energy,
            stinky: gameData.stinky,
            sleep: gameData.sleep,
            click_counter: gameData.clickCounter,
            sleep_end_time: gameData.sleepEndTime,
            fastfood_streak: gameData.fastfoodStreak,
            is_fat: gameData.isFat,
            is_drunk: gameData.isDrunk,
            is_pooped: gameData.isPooped,
            addiction_level: gameData.addictionLevel,
            addiction_streak: gameData.addictionStreak,
            last_update: Math.floor(gameData.lastUpdate / 1000)
        })

        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(`${API_URL}/update`, blob)

    } else if (document.visibilityState === 'visible') {
        // Вернулись — тихо обновляем данные
        console.log("🔄 Окно стало видимым — тихо обновляем данные...")
        await quietReload()
    }
})