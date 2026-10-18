import {computed, ref} from 'vue'
import axios from 'axios'
import {API_URL, syncToBackend, tgId} from "@/scripts/api.js";
import {gameData} from "@/scripts/useGameStore.js";
import {addCoin} from "@/scripts/actions.js";
import {addExp} from "@/scripts/level.js";

export const loadingKey = ref(null)
let saveTimeout = null

export async function incrementTaskProgress(taskKey, amount = 1) {
    if (!gameData.daily_tasks) {
        gameData.daily_tasks = {}
    }

    const currentTask = gameData.daily_tasks[taskKey] || {progress: 0, claimed: false}

    const targets = {
        feed: 5,
        wash: 2,
        click: 500,
        serum: 2
    }

    const target = targets[taskKey] || 1

    if (currentTask.progress < target && !currentTask.claimed) {
        currentTask.progress = Math.min(target, currentTask.progress + amount)
        gameData.daily_tasks[taskKey] = currentTask

        // 🟢 Для кормления и мойки сохраняем сразу (их мало)
        if (taskKey !== 'click') {
            try {
                await syncToBackend()
            } catch (e) {
                console.error('Ошибка сохранения задачи:', e)
            }
            return
        }

        // 🟡 Для КЛИКОВ делаем Debounce (отложенное сохранение)
        // Запрос уйдет только через 2 секунды после того, как игрок перестал кликать
        if (saveTimeout) clearTimeout(saveTimeout)

        saveTimeout = setTimeout(async () => {
            try {
                await syncToBackend()
            } catch (e) {
                console.error('Ошибка сохранения кликов:', e)
            }
        }, 2000)
    }
}

// Конфиг заданий
export const TASKS_CONFIG = {
    feed: { target: 5, reward: 50, exp: 40, title: 'Покормить питомца' },
    wash: { target: 2, reward: 30, exp: 30, title: 'Искупать питомца' },
    click: { target: 500, reward: 100, exp: 50, title: 'Кликнуть по питомцу' },
    serum: { target: 2, reward: 100, exp: 80, title: 'Создать зелье' }
}

// Получить текущий прогресс напрямую из gameData
export const getTaskProgress = (key) => {
    return gameData.daily_tasks?.[key]?.progress || 0
}

// Расчёт процента ширины полосы
export const getTaskPercent = (key, target) => {
    const current = getTaskProgress(key)
    return Math.min(100, Math.floor((current / target) * 100))
}

// Проверка выполнения
export const isTaskCompleted = (key, target) => {
    return getTaskProgress(key) >= target
}

// Проверка получения награды
export const isTaskClaimed = (key) => {
    return !!gameData.daily_tasks?.[key]?.claimed
}

// Функция забора награды
export const claimReward = async (taskKey) => {
    if (loadingKey.value) return
    loadingKey.value = taskKey

    try {
        const response = await axios.post(`${API_URL}/pet/claim-task/${tgId}`, {
            task_key: taskKey
        })

        const data = response.data

        if (data.success) {
            addCoin(data.reward)
            addExp(data.exp)
            gameData.daily_tasks = data.daily_tasks
        }
    } catch (e) {
        console.error('Ошибка при получении награды:', e.response?.data?.detail || e.message)
    } finally {
        loadingKey.value = null
    }
}
export const hasAvailableRewards = computed(() => {
    return Object.keys(TASKS_CONFIG).some(key => {
        const target = TASKS_CONFIG[key].target
        const completed = getTaskProgress(key) >= target
        const claimed = isTaskClaimed(key)

        return completed && !claimed
    })
})