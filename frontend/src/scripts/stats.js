import {computed, watch} from "vue";
import {
    body, bodyType,
    cloudShow, defaultGameData, feedStatus,
    gameData, isGameOver, isLosingLifeStatus, lastFedItem, lifeStatus,
    lowEnergy,
    mouth, PlayCount, resetLocal,
    showHunger, showTongue,
    sleepTimeRemaining
} from "@/scripts/useGameStore.js";
import {addExp, levelStatus} from "@/scripts/level.js";

import {addCoin, drunkTimer, sunAnimating} from "@/scripts/actions.js";
import {batheStatus, isHovered, previousMouth} from "@/scripts/dragAndDrop.js";
import {foodList} from "@/scripts/objectItems.js";


const FOOD_PER_HOUR_HEALTHY = 15;     // ~6.7 часа
const FOOD_PER_HOUR_SICK = 25;     // ~4 часа

const ENERGY_PER_HOUR_HEALTHY = 15;
const ENERGY_PER_HOUR_SICK = 25;
// ===================================================

setInterval(() => {
    // Переводим часовой расход в минутный (потому что интервал = 1 минута)
    const foodPerMinute = (gameData.sick ? FOOD_PER_HOUR_SICK : FOOD_PER_HOUR_HEALTHY) / 60;
    const energyPerMinute = (gameData.sick ? ENERGY_PER_HOUR_SICK : ENERGY_PER_HOUR_HEALTHY) / 60;
    // 1. Уменьшаем еду
    if (gameData.foodLevel > 0) {
        gameData.foodLevel = Math.max(0, gameData.foodLevel - foodPerMinute);
    }

    // 2. Уменьшаем энергию (если не спит)
    if (gameData.energy > 0 && !gameData.sleep) {
        gameData.energy = Math.max(0, gameData.energy - energyPerMinute);
    }

    // 3. Проверка штрафов за голод или отсутствие энергии
    const isFoodZero = gameData.foodLevel === 0;
    const isEnergyZero = gameData.energy === 0;
    const nowSec = Math.floor(Date.now() / 1000);

    if (gameData.addictionStreak > 1 && (nowSec - gameData.lastAddictionTime > 1800)) {
        gameData.lastAddictionTime = nowSec;
        gameData.addictionStreak = 0;
    }

    if (isFoodZero || isEnergyZero) {
        gameData.badStatsMinutes++;

        const targetMinutes = 480;

        if (gameData.badStatsMinutes >= targetMinutes) {
            if (gameData.lives > 0) {
                gameData.lives -= 1;
            }
            gameData.badStatsMinutes = 0;
        }
    } else {
        gameData.badStatsMinutes = 0;
    }

    gameData.lastUpdate = Date.now();
}, 60000);

// Логика сна
const MS_PER_ENERGY_POINT = 3000

export function toggleSleep() {
    if (!gameData.sleep) {
        // Питомец ложится спать прямо сейчас по воле игрока
        gameData.sleep = true
        const pointsNeeded = 100 - gameData.energy
        const nowSeconds = Math.floor(Date.now() / 1000)
        const secondsPerEnergy = MS_PER_ENERGY_POINT / 1000

        gameData.sleepEndTime = nowSeconds + (pointsNeeded * secondsPerEnergy)
    } else {
        // Если просыпается принудительно
        gameData.sleep = false
        gameData.sleepEndTime = 0
        sleepTimeRemaining.value = ""
    }
}

// Интервал восстановления энергии во сне

setInterval(() => {
    if (!gameData.sleep) return
    if (!gameData.sleepEndTime) return

    // Получаем текущее время в СЕКУНДАХ (а не в миллисекундах!)
    const nowSec = Math.floor(Date.now() / 1000)
    const timeLeftSec = gameData.sleepEndTime - nowSec

    if (timeLeftSec <= 0) {
        gameData.energy = 100
        gameData.sleep = false
        addCoin(5)
        addExp(35)
        sleepTimeRemaining.value = ""
        gameData.sleepEndTime = 0
        return
    }

    // MS_PER_ENERGY_POINT у вас равен 3000 мс (3 секунды) на 1 единицу энергии
    const secondsPerEnergy = MS_PER_ENERGY_POINT / 1000
    const pointsNeeded = Math.ceil(timeLeftSec / secondsPerEnergy)
    gameData.energy = Math.max(0, 100 - pointsNeeded)

    const minutes = Math.floor(timeLeftSec / 60)
    const seconds = Math.floor(timeLeftSec % 60)

    sleepTimeRemaining.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}, 1000)

watch(
    [
        isHovered,
        batheStatus,
        showTongue,
        () => gameData.foodLevel,

        () => gameData.isFat,

    ],
    ([hovered, isBathe, isShowTongue, foodLevel, isFat]) => {
        const isLowEnergy = gameData.energy < 20
        const isHungry = gameData.foodLevel < 20
        const isSick = gameData.sick
        const hasIssues = isLowEnergy || isHungry || isSick

        // Приоритет 1: Если предмет перетаскивают над зоной — ВСЕГДА открытый рот

        if (foodLevel <= 85) {
            gameData.foodStreak = 0
            gameData.isFat = false
            PlayCount.value = 0
        }

        if (foodLevel < 15) {
            body.value = '/character/skinny_body.webp?v=1'
            bodyType.value = 'skinny'
        } else if (isFat) {
            body.value = '/character/fat_body.webp?v=1'
            bodyType.value = 'fat'
        } else {
            body.value = '/character/main_body.webp?v=1'
            bodyType.value = 'normal'
        }
        if (isShowTongue) {
            mouth.value = '/character/isPlayed_mouth.webp'
        } else if (hovered && !isBathe) {
            mouth.value = '/character/open_mouth.webp'
        } else if (hasIssues) {
            mouth.value = '/character/sad_mouth.webp'
        }
        // Приоритет 4: Во всех остальных случаях — счастливый / нормальный
        else {
            mouth.value = '/character/happy_mouth.webp'
        }

        // Обновляем остальные флаги для облачков и интерфейса
        lowEnergy.value = isLowEnergy
        showHunger.value = isHungry
        cloudShow.value = isLowEnergy || isHungry
    },
    {immediate: true}
)


// watch(() => gameData.isDrunk, (newVal) => {
//     console.log(`⚡ Энергия изменилась: с ${oldVal} до ${newVal}`);
//     console.trace(); // Покажет полный стек вызовов: какая именно функция изменила энергию!
// })


watch(() => gameData.lives, async (newLives) => {
    // Если жизни кончились, и мы ЕЩЕ не в процессе сброса/перезагрузки
    if (newLives <= 0 && !isGameOver.value) {
        isGameOver.value = true


    }
})


watch(() => gameData.sick, (newSick) => {
    if (newSick === false && gameData.addictionStreak >= 2) {
        gameData.addictionStreak = 1
    }

})


export const activeStatus = computed(() => {
    // Приоритет 1: Смерть питомца
    if (isGameOver.value) {
        return {
            show: true,
            text: "Питомец погиб!",
            image: "/gamePlay/grave.webp",
            bgColor: "bg-[#808080]"
        }
    }

    // Приоритет 2: Повышение уровня
    if (levelStatus.value) {
        return {
            show: true,
            text: "Уровень повышен",
            additional: gameData.level,
            image: null // или дефолтная иконка уровня
        }
    }

    // Приоритет 3: Потеря жизни (-1)
    if (isLosingLifeStatus.value) {
        return {
            show: true,
            text: "- 1 жизнь!",
            image: "/gamePlay/heart_broken.webp"
        }
    }

    // Приоритет 4: Получение жизни (+1)
    if (lifeStatus.value) {
        return {
            show: true,
            text: "+ 1 жизнь!",
            image: "/gamePlay/heart.webp"
        }
    }

    // Приоритет 5: Кормежка (ням-ням)
    if (feedStatus.value) {
        // Находим сам объект еды по ID, который сохранен в lastFedItem
        const fedItemObj = foodList.find(item => item.id === lastFedItem.value)

        return {
            show: true,
            text: "Ням-ням!",
            image: "/gamePlay/hunger.webp",
            additional: `+${fedItemObj?.foodGain || 0}`
        }
    }

    // Если ничего не происходит
    return {show: false}
})

let sunTimer = null

watch(() => gameData.sleep, () => {
    // Выключаем анимацию эмоции, если она уже шла

    sunAnimating.value = false

    if (sunTimer) clearTimeout(sunTimer)

    // Запускаем эмоцию ТОЛЬКО после того, как солнце/луна прилетят на место (например, через 400мс)
    sunTimer = setTimeout(() => {
        sunAnimating.value = true

        // Гасим эмоцию через 800мс
        sunTimer = setTimeout(() => {
            sunAnimating.value = false
        }, 800)
    }, 500)
})