import axios from 'axios'
import {gameData, lowEnergy, showHunger} from './useGameStore.js'
import {computed, ref} from "vue";

export const API_URL = import.meta.env.VITE_API_URL || '/api'

// Флаг: загружены ли данные с сервера
export const isLoading = ref(true)
let isDataLoaded = false

export async function initGameData() {
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))
    try {
        const [response] = await Promise.all([
            axios.get(`${API_URL}/${tgId}`),
            minDelay // Ждем и ответ сервера, и минимум 800мс
        ])
        const serverData = response.data

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
        gameData.addictionLevel = serverData.addiction_level
        gameData.addictionStreak = serverData.addiction_streak
        gameData.cart = serverData.cart
        gameData.unlockedHeads = serverData.unlocked_heads
        gameData.equippedHead = serverData.equipped_head
        gameData.lastUpdate = serverData.last_update ? Math.floor(serverData.last_update * 1000) : Date.now()


        isDataLoaded = true
        console.log(" Данные успешно синхронизированы с сервером!")
    } catch (e) {
        console.error("Ошибка соединения с бэкендом:", e)

    }finally {
        await minDelay
        isLoading.value = false
    }
}

export async function resetPet() {
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        await axios.post(`${API_URL}/reset`, {tg_id: tgId})
        return true
    } catch (e) {
        console.error("❌ Ошибка при сбросе питомца:", e)
        return false
    }
}

export async function syncToBackend() {
    // 🛑 ЖЕСТКИЙ БЛОКАТОР: если данные с сервера еще не скачались,
    // запрещаем отправлять мусор/дефолт на бэкенд!
    if (!isDataLoaded) {
        console.warn("⚠️ Синхронизация заблокирована: данные с сервера еще не загружены.")
        return
    }

    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        await axios.post(`${API_URL}/update`, {
            tg_id: tgId,
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
            addiction_level: gameData.addictionLevel,
            addiction_streak: gameData.addictionStreak,
            last_update: Math.floor(Date.now() / 1000)
        })
    } catch (e) {
        console.error("❌ Ошибка сохранения:", e)
    }
}

// Запускаем автосохранение каждые 15 секунд
setInterval(syncToBackend, 15000)

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isDataLoaded) {
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
        const payload = JSON.stringify({
            tg_id: tgId,
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
            addiction_level: gameData.addictionLevel,
            addiction_streak: gameData.addictionStreak,
            last_update: Math.floor(Date.now() / 1000)
        })

        const blob = new Blob([payload], {type: 'application/json'})
        navigator.sendBeacon(`${API_URL}/update`, blob)
    }
})