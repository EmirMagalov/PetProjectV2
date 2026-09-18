import axios from 'axios'
import {gameData, lowEnergy, showHunger} from './useGameStore.js'
import {computed, ref} from "vue";

export const API_URL = import.meta.env.VITE_API_URL || '/api'
const TAB_ID = Math.random().toString(36).substring(2)

// Регистрируем эту вкладку как активную в текущей сессии браузера
localStorage.setItem('active_game_tab', TAB_ID)

// Слушаем, если открылась другая вкладка — эта сразу понимает, что она больше не главная
window.addEventListener('storage', (event) => {
    if (event.key === 'active_game_tab' && event.newValue !== TAB_ID) {
        console.warn("⚠️ Обнаружен другой экземпляр игры. Эта вкладка уходит в спячку!")
        isDataLoaded = false // Блокируем любые отправки данных на сервер со старой вкладки
    }
})
let isDataLoaded = false
let isRefreshing = false
let isSyncLocked = false // 🛑 Блокировщик сохранения при фокусе
// Флаг: загружены ли данные с сервера
export const isLoading = ref(true)


export async function initGameData() {
    const tgId =  import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    isLoading.value = true

    // Делаем цикл с попытками на случай холодного старта бэкенда
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 800))
            const [response] = await Promise.all([
                axios.get(`${API_URL}/${tgId}?_t=${Date.now()}`), // <-- добавили метку времени, чтобы кэш не сработал
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
            isLoading.value = false // Успех! Выключаем лоудер
            console.log(" Данные успешно синхронизированы с сервером!")
            return; // Выходим из функции, всё ок

        } catch (e) {
            console.warn(`⚠️ Попытка ${attempt} из ${maxRetries} не удалась (сервер греется)...`, e)

            if (attempt === maxRetries) {
                console.error("❌ Не удалось подключиться к бэкенду после всех попыток.")
                // Здесь можно изменить текст лоудера на "Ошибка подключения, перезагрузите страницу"
                // Но лоудер НЕ выключаем (isLoading.value остается true), чтобы пользователь
                // не мог играть на дефолтах и слать мусор на сервер.
            } else {
                // Ждем 2 секунды перед следующей попыткой пока контейнер поднимается
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
    // 🛑 ЖЕСТКИЙ БЛОКАТОР: если данные с сервера еще не скачались,
    // запрещаем отправлять мусор/дефолт на бэкенд!
    if (!isDataLoaded) {
        console.warn("⚠️ Синхронизация заблокирована: данные с сервера еще не загружены.")
        return
    }

    const tgId =  import.meta.env.VITE_USER_ID || window.Telegram?.WebApp?.initDataUnsafe?.user?.id

    try {
        await axios.post(`${API_URL}/update`, {
            tg_id: tgId,
            name:gameData.name,
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

document.addEventListener('visibilitychange', () => {
    // 1. Когда пользователь уходит из игры (сворачивает или открывает чат)
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

    // 2. Когда пользователь возвращается в игру (нажал кнопку в боте и развернул WebApp)
    if (document.visibilityState === 'visible') {
        console.log("👁️ Приложение снова на экране! Принудительно забираем свежие данные с бэкенда...")

        isRefreshing = false
        isSyncLocked = true // Жестко блокируем исходящие автосохранения на время загрузки

        initGameData().then(() => {
            setTimeout(() => {
                isSyncLocked = false // Снимаем блокировку через 1.5 секунды после обновления
            }, 1500)
        })
    }
})

// Говорим Telegram WebApp, что приложение готово
if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready()
}