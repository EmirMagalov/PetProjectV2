import axios from 'axios'
import {gameData} from './useGameStore.js'
import {ref} from "vue";

export const API_URL = import.meta.env.VITE_API_URL || '/api'

// --- 1. СИСТЕМА ЖЕСТКОЙ БЛОКИРОВКИ ДУБЛИКАТОВ ВКЛАДОК ---
const TAB_ID = Math.random().toString(36).substring(2)
let isMaster = true
let isDuplicate = false

const channel = new BroadcastChannel('game_master_channel')

// Слушаем другие вкладки
channel.onmessage = (event) => {
    if (event.data.type === 'WHO_IS_MASTER') {
        if (isMaster && !isDuplicate) {
            channel.postMessage({ type: 'I_AM_MASTER', id: TAB_ID })
        }
    } else if (event.data.type === 'I_AM_MASTER') {
        if (event.data.id !== TAB_ID) {
            isDuplicate = true
            isMaster = false

            // 🛑 БЛОКИРУЕМ НОВУЮ ВКЛАДКУ ПРИНУДИТЕЛЬНО
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #1a1a1a; color: #fff; font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #ff4757;">⚠️ Игра уже открыта в другой вкладке!</h2>
                </div>
            `
        }
    }
}

// При старте спрашиваем, есть ли уже открытая игра
channel.postMessage({ type: 'WHO_IS_MASTER' })

// Функция проверки "мы мастер"
function isMasterTab() {
    return isMaster && !isDuplicate
}

// Функция проверки "мы активная вкладка"
function isCurrentTabActive() {
    return isMasterTab() && document.visibilityState === 'visible'
}

// Периодически пингуем
setInterval(() => {
    if (isMaster && !isDuplicate) {
        channel.postMessage({ type: 'I_AM_MASTER', id: TAB_ID })
    }
}, 2000)

// --- 2. ФЛАГИ СОСТОЯНИЯ ---
export const isLoading = ref(true)
let isDataLoaded = false
let isSyncLocked = false // Блокировщик сохранения при фокусе/возвращении
export const isApiError = ref(false) // 👈 Флаг ошибки бэкенда
export const errorMessage = ref('')  // 👈 Текст ошибки
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
    isDataLoaded = false
    isApiError.value = false // Сбрасываем ошибку перед новой попыткой
    isLoading.value = true

    const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    const maxRetries = 5;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (!isMasterTab()) {
            console.warn("⚠️ Загрузка отменена: вкладка не является ведущей.")
            return
        }

        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 800))
            const [response] = await Promise.all([
                axios.get(`${API_URL}/${tgId}?_t=${Date.now()}`),
                minDelay
            ])

            const serverData = response.data
            // ... (твой существующий маппинг gameData.name, level, coins и т.д.) ...
            gameData.name = serverData.name && serverData.name.trim() ? serverData.name : 'Имя:'
            gameData.level = serverData.level
            gameData.exp = serverData.exp
            gameData.coins = serverData.coins
            gameData.lives = serverData.lives
            gameData.deathsCount = serverData.deaths_count
            gameData.fatCount = serverData.fat_count
            gameData.foodLevel = serverData.food_level
            gameData.energy = serverData.energy
            gameData.stinky = serverData.stinky
            gameData.clickCounter = serverData.click_counter
            gameData.sleep = serverData.sleep
            gameData.sleepEndTime = serverData.sleep_end_time
            gameData.fastfoodStreak = serverData.fastfood_streak
            gameData.isFat = serverData.is_fat
            gameData.sick = serverData.sick
            gameData.isPooped = serverData.is_pooped
            gameData.addictionStreak = serverData.addiction_streak
            gameData.cart = serverData.cart || {}
            gameData.unlockedHeads = serverData.unlocked_heads || []
            gameData.equippedHead = serverData.equipped_head || null
            gameData.unlockedCostumes = serverData.unlocked_costumes || []
            gameData.equippedCostume = serverData.equipped_costume || null
            gameData.lastUpdate = serverData.last_update ? Math.floor(serverData.last_update * 1000) : Date.now()

            isDataLoaded = true

            // Если всё прошло успешно, выключаем экран загрузки
            setTimeout(() => {
                isLoading.value = false;
            }, 500);

            return; // Выходим из функции при успехе

        } catch (e) {
            console.warn(`⚠️ Попытка ${attempt} из ${maxRetries} не удалась...`, e)

            if (attempt === maxRetries) {
                // 🛑 Все попытки исчерпаны: фиксируем ошибку и НЕ выключаем isLoading
                console.error("❌ Не удалось подключиться к бэкенду после всех попыток.")
                isApiError.value = true
                errorMessage.value = "Сервер недоступен. Проверьте интернет-соединение."
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }
    }
}

export async function resetPet() {
    const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        await axios.post(`${API_URL}/reset`, {tg_id: tgId})
        return true
    } catch (e) {
        console.error("❌ Ошибка при сбросе питомца:", e)
        return false
    }
}


function getPayload() {
    const tgId = import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    return {
        tg_id: tgId,
        name: gameData.name,
        level: gameData.level,
        exp: gameData.exp,
        coins: gameData.coins,
        cart: gameData.cart,
        lives: gameData.lives,
        deaths_count: gameData.deathsCount,
        fat_count: gameData.fatCount,
        food_level: gameData.foodLevel,
        energy: gameData.energy,
        stinky: gameData.stinky,
        sleep: gameData.sleep,
        click_counter: gameData.clickCounter,
        sleep_end_time: gameData.sleepEndTime,
        fastfood_streak: gameData.fastfoodStreak,
        is_fat: gameData.isFat,
        sick: gameData.sick,
        is_pooped: gameData.isPooped,
        unlocked_heads: gameData.unlockedHeads,
        equipped_head: gameData.equippedHead,
        equipped_costume: gameData.equippedCostume,
        unlocked_costumes: gameData.unlockedCostumes,
        addiction_streak: gameData.addictionStreak,
        last_update: Math.floor(Date.now() / 1000)
    }
}



export async function syncToBackend() {
    if (!isCurrentTabActive() || !isDataLoaded || isSyncLocked) {
        return
    }



    try {
        await axios.post(`${API_URL}/update`, getPayload())
    } catch (e) {
        console.error("❌ Ошибка сохранения:", e)
    }
}

// Запускаем автосохранение каждые 15 секунд
setInterval(syncToBackend, 15000)

// --- 5. ОБРАБОТЧИК ЖИЗНЕННОГО ЦИКЛА ---
function sendBeaconUpdate() {
    if (!isMasterTab() || !isDataLoaded) return


    const payload = JSON.stringify(getPayload())

    const blob = new Blob([payload], { type: 'application/json' })
    navigator.sendBeacon(`${API_URL}/update`, blob)
}

document.addEventListener('visibilitychange', () => {
    if (!isMasterTab()) return

    if (document.visibilityState === 'hidden' && isDataLoaded) {
        sendBeaconUpdate()
    }

    if (document.visibilityState === 'visible') {
        isSyncLocked = true

        syncToBackend()
            .then(() => initGameData())
            .catch(err => console.error("❌ Ошибка при возврате в игру:", err))
            .finally(() => {
                setTimeout(() => {
                    isSyncLocked = false
                }, 500)
            })
    }
})

// Дополнительная страховка при перезагрузке / закрытии вкладки
window.addEventListener('pagehide', () => {
    sendBeaconUpdate()
})

// Говорим Telegram WebApp, что приложение готово
if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready()
}