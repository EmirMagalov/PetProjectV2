import axios from 'axios'
import {gameData, lowEnergy, showHunger} from './useGameStore.js'
import {computed, ref} from "vue";

export const API_URL = import.meta.env.VITE_API_URL || '/api'

// --- 1. СИСТЕМА КОНТРОЛЯ ЛИДЕРСТВА ВКЛАДОК ---
const TAB_ID = Math.random().toString(36).substring(2)

// Функция проверяет, является ли эта вкладка главной в данный момент
function isCurrentTabActive() {
    try {
        const raw = localStorage.getItem('active_game_master')
        if (!raw) return true
        const master = JSON.parse(raw)
        // Главная та вкладка, чей ID совпадает, либо если мастер не обновлялся дольше 20 секунд
        return master.id === TAB_ID || (Date.now() - master.time > 20000)
    } catch (e) {
        return true
    }
}

// Заявляем права этой вкладки на лидерство
function claimTabActive() {
    localStorage.setItem('active_game_master', JSON.stringify({
        id: TAB_ID,
        time: Date.now()
    }))
}

// Сразу при старте делаем эту вкладку мастером
claimTabActive()

// --- 2. ФЛАГИ СОСТОЯНИЯ ---
export const isLoading = ref(true)
let isDataLoaded = false
let isRefreshing = false
let isSyncLocked = false // Блокировщик сохранения при фокусе/возвращении

// --- 3. ЗАЩИТА ОТ СТАРЫХ СЕССИЙ БОТА ---
const currentSessionKey = window.Telegram?.WebApp?.initData || 'web_debug_mode'
const savedSessionKey = sessionStorage.getItem('tg_session_signature')

if (savedSessionKey && savedSessionKey !== currentSessionKey) {
    console.warn("🔄 Обнаружен новый вход через бота! Принудительно перезагружаем страницу...")
    sessionStorage.setItem('tg_session_signature', currentSessionKey)
    window.location.reload()
} else {
    sessionStorage.setItem('tg_session_signature', currentSessionKey)
}

// --- 4. ЗАГРУЗКА И СИНХРОНИЗАЦИЯ ДАННЫХ ---
export async function initGameData() {
    const tgId =  import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    isLoading.value = true

    // Делаем цикл с попытками на случай холодного старта бэкенда
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Если эта вкладка потеряла лидерство, отменяем загрузку
        if (!isCurrentTabActive()) {
            console.warn("⚠️ Загрузка отменена: вкладка больше не активна.")
            return
        }

        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 800))
            const [response] = await Promise.all([
                axios.get(`${API_URL}/${tgId}?_t=${Date.now()}`), // Защита от кэша
                minDelay
            ])
            const serverData = response.data
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

            isDataLoaded = true
            isLoading.value = false
            console.log("✅ Данные успешно синхронизированы с сервером!")
            return;

        } catch (e) {
            console.warn(`⚠️ Попытка ${attempt} из ${maxRetries} не удалась (сервер греется)...`, e)

            if (attempt === maxRetries) {
                console.error("❌ Не удалось подключиться к бэкенду после всех попыток.")
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }
    }
}

export async function resetPet() {
    const tgId =  import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        await axios.post(`${API_URL}/reset`, {tg_id: tgId})
        return true
    } catch (e) {
        console.error("❌ Ошибка при сбросе питомца:", e)
        return false
    }
}

export async function syncToBackend() {
    // 🛑 ЖЕСТКИЙ БЛОКАТОР: если вкладка не лидер, данные не загружены или идет защита — не шлем ничего
    if (!isCurrentTabActive() || !isDataLoaded || isSyncLocked) {
        return
    }

    const tgId =  import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        await axios.post(`${API_URL}/update`, {
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
            last_update: Math.floor(Date.now() / 1000)
        })
    } catch (e) {
        console.error("❌ Ошибка сохранения:", e)
    }
}

// Запускаем автосохранение каждые 15 секунд
setInterval(syncToBackend, 15000)

// --- 5. ОБРАБОТЧИК ЖИЗНЕННОГО ЦИКЛА ---
document.addEventListener('visibilitychange', () => {
    // Если эта вкладка не является мастером — игнорируем любые события
    if (!isCurrentTabActive()) return

    // 1. Когда пользователь уходит из игры (сворачивает)
    if (document.visibilityState === 'hidden' && isDataLoaded) {
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
            last_update: Math.floor(Date.now() / 1000)
        })

        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon(`${API_URL}/update`, blob)
    }

    // 2. Когда пользователь возвращается в игру (развернул или открыл из бота)
    if (document.visibilityState === 'visible') {
        console.log("👁️ Приложение на экране! Забираем лидерство и свежие данные...")

        // Захватываем статус главного окна
        claimTabActive()

        isRefreshing = false
        isSyncLocked = true // Включаем блок автосохранения на время загрузки

        initGameData()
            .catch(err => console.error("❌ Ошибка при возврате в игру:", err))
            .finally(() => {
                // Гарантированно снимаем блокировку через 500мс после завершения запроса
                setTimeout(() => {
                    isSyncLocked = false
                }, 500)
            })
    }
})

// Говорим Telegram WebApp, что приложение готово
if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready()
}