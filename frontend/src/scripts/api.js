import axios from 'axios'
import {gameData, lowEnergy, showHunger} from './useGameStore.js'
import {computed, ref} from "vue";

export const API_URL = import.meta.env.VITE_API_URL || '/api'


// --- 1. СИСТЕМА ЖЕСТКОЙ БЛОКИРОВКИ ДУБЛИКАТОВ ВКЛАДОК ---
const TAB_ID = Math.random().toString(36).substring(2)
let isMaster = true
let isDuplicate = false

const channel = new BroadcastChannel('game_master_channel')

// Слушаем другие вкладки
channel.onmessage = (event) => {
    if (event.data.type === 'WHO_IS_MASTER') {
        // Если кто-то спрашивает, а мы живой мастер — отвечаем, что место занято
        if (isMaster && !isDuplicate) {
            channel.postMessage({ type: 'I_AM_MASTER', id: TAB_ID })
        }
    } else if (event.data.type === 'I_AM_MASTER') {
        // Если мы получили ответ от другого мастера, а это не мы
        if (event.data.id !== TAB_ID) {
            isDuplicate = true
            isMaster = false

            // 🛑 БЛОКИРУЕМ НОВУЮ ВКЛАДКУ ПРИНУДИТЕЛЬНО
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #1a1a1a; color: #fff; font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #ff4757;">⚠️ Игра уже открыта в другой вкладке!</h2>
<!--                    <p>Одновременно играть в нескольких вкладках нельзя. Пожалуйста, закрыть эту вкладку.</p>-->
                </div>
            `
        }
    }
}

// При старте спрашиваем, есть ли уже открытая игра
channel.postMessage({ type: 'WHO_IS_MASTER' })

// Функция проверки
function isCurrentTabActive() {
    return isMaster && !isDuplicate && document.visibilityState === 'visible'
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
    isDataLoaded = false

    // Перехватываем лидерство принудительно при любом вызове initGameData (например, при релоаде)
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
            setTimeout(() => {
                isLoading.value = false;
            }, 1000);

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


        // Захватываем статус главного окна


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