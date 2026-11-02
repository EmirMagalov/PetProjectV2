import {computed, ref} from 'vue'
import axios from 'axios'
import {API_URL, syncToBackend, tgId} from "@/scripts/api.js";
import {gameData} from "@/scripts/useGameStore.js";
import {addCoin} from "@/scripts/actions.js";
import {addExp} from "@/scripts/level.js";
import i18n from "@/scripts/locales/i18n.js";

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

        if (taskKey !== 'click') {
            try {
                await syncToBackend()
            } catch (e) {
                console.error('Ошибка сохранения задачи:', e)
            }
            return
        }

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

// 🟢 Делаем конфигурацию динамической функцией, которая реагирует на смену языка через i18n.global.locale.value
export const getTasksConfig = () => {
    // Обращаемся к i18n.global.locale.value, чтобы Vue видел зависимость и обновлялся при смене языка
    const currentLocale = i18n.global.locale.value;

    return {
        feed: { target: 5, reward: 50, exp: 40, title: i18n.global.t('feed_the_pet')},
        wash: { target: 2, reward: 30, exp: 30, title: i18n.global.t('bathe_the_pet') },
        click: { target: 500, reward: 100, exp: 50, title: i18n.global.t('click_on_the_pet') },
        serum: { target: 2, reward: 100, exp: 80, title: i18n.global.t('create_a_serum') }
    };
};

// Для обратной совместимости со старым кодом, если где-то еще импортируется TASKS_CONFIG напрямую:
export const TASKS_CONFIG = new Proxy({}, {
    get(_, prop) {
        return getTasksConfig()[prop];
    },
    ownKeys() {
        return Object.keys(getTasksConfig());
    },
    getOwnPropertyDescriptor(_, prop) {
        return {
            enumerable: true,
            configurable: true,
            value: getTasksConfig()[prop]
        };
    }
});

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
    const config = getTasksConfig();
    return Object.keys(config).some(key => {
        const target = config[key].target
        const completed = getTaskProgress(key) >= target
        const claimed = isTaskClaimed(key)

        return completed && !claimed
    })
})