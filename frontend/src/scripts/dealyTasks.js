import {computed, ref} from 'vue'
import axios from 'axios'
import {API_URL, tgId} from "@/scripts/api.js";
import {gameData} from "@/scripts/useGameStore.js";

export const loadingKey = ref(null)

// Конфиг заданий
export const TASKS_CONFIG = {
    feed: {target: 5, reward: 50, title: 'Покормить питомца '},
    wash: {target: 2, reward: 30, title: 'Искупать питомца '},
    click: {target: 500, reward: 100, title: 'Кликнуть по питомцу '},
    serum: {target: 1, reward: 100, title: 'Создать зелье'}
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
            gameData.coins = data.coins
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