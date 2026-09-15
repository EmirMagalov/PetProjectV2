import axios from 'axios'
import {gameData, lowEnergy, showHunger} from './useGameStore.js'
import {computed} from "vue";

// export const API_URL = '/api'
export const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function initGameData() {
    // Получаем Telegram ID текущего пользователя (если открыто в Telegram)
    // Fallback на тестовый ID 123456 для разработки в браузере
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        const response = await axios.get(`${API_URL}/${tgId}`)
        const serverData = response.data
        // Заполняем наш reactive объект gameData данными с сервера
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
        // Переводим секунды бэкенда в миллисекунды для JS
        gameData.lastUpdate = serverData.last_update ? Math.floor(serverData.last_update * 1000) : Date.now()


        // checkOfflineTime()
        console.log(" Данные успешно синхронизированы с сервером!")
    } catch (e) {
        console.error("Ошибка соединения с бэкендом:", e)
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
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        const a = await axios.post(`${API_URL}/update`, {
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
            click_counter:gameData.clickCounter,
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
    if (document.visibilityState === 'hidden') {
        // Приложение свернули или закрыли — экстренно отправляем данные на бэк
        // Используем navigator.sendBeacon для гарантированной отправки при закрытии вкладки
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
        const payload = JSON.stringify({
            tg_id: tgId,
            level: gameData.level,
            exp: gameData.exp,
            coins: gameData.coins,
            cart: gameData.cart,
            unlocked_heads:gameData.unlockedHeads,
            equipped_head: gameData.equippedHead,
            lives: gameData.lives,
            food_level: gameData.foodLevel,
            energy: gameData.energy,
            stinky: gameData.stinky,
            sleep: gameData.sleep,
            click_counter:gameData.clickCounter,
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
