import {watch} from "vue";
import {
    body,
    cloudShow, defaultGameData,
    gameData, isGameOver,
    lowEnergy,
    mouth, PlayCount, resetLocal,
    showHunger,
    sleepTimeRemaining
} from "@/scripts/useGameStore.js";
import {addExp} from "@/scripts/level.js";

import {addCoin, drunkTimer} from "@/scripts/actions.js";
import {batheStatus, isHovered, previousMouth} from "@/scripts/dragAndDrop.js";


setInterval(() => {

    if (gameData.foodLevel > 0) {
        const consumeAmountFood = gameData.sick ? 0.1:0.05
        gameData.foodLevel = Math.max(0, gameData.foodLevel - consumeAmountFood)
    }

    // 2. Уменьшаем энергию (если не спит)
    if (gameData.energy > 0 && !gameData.sleep) {
        const consumeAmountEnergy = gameData.sick ? 0.1:0.05
        gameData.energy = Math.max(0, gameData.energy - consumeAmountEnergy)
    }

    // 3. Проверка штрафов за голод или отсутствие энергии
    const isFoodZero = gameData.foodLevel === 0
    const isEnergyZero = gameData.energy === 0
    const nowSec = Math.floor(Date.now() / 1000)
// Если прошло больше 1 часа (3600 секунд) с последнего употребления
    if (gameData.addictionStreak > 1 && (nowSec - gameData.lastAddictionTime > 1800)) {
        gameData.lastAddictionTime = nowSec // Сдвигаем таймер для следующего уменьшения

        // Если стрик упал ниже порогов, выключаем дебаффы
        gameData.addictionStreak = 0
        // if (gameData.addictionStreak < 1) {
        //     gameData.isDrunk = false
        // }
    }
    // if (gameData.addictionStreak <= 1) {
    //     gameData.isDrunk = false
    // }
    // if (!gameData.isPooped && Math.random() < 1 / 45) {
    //     gameData.isPooped = true
    // }
    // if (!gameData.stinky && Math.random() < 1 / 90) {
    //     gameData.stinky = true
    // }
    if (isFoodZero || isEnergyZero) {
        gameData.badStatsMinutes++


        const targetMinutes =  480

        if (gameData.badStatsMinutes >= targetMinutes) {

            if (gameData.lives > 0) {
                gameData.lives -= 1
            }
            gameData.badStatsMinutes = 0 // Сбрасываем счетчик
        }
    } else {
        // Если хотя бы один параметр восстановился, сбрасываем счетчик
        gameData.badStatsMinutes = 0
    }
    gameData.lastUpdate = Date.now()




}, 60000)

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

        ()=>gameData.foodLevel,

        ()=>gameData.isFat,

    ],
    ([hovered,isBathe,foodLevel,isFat]) => {
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

        if (foodLevel<15){
            body.value = '/character/skinny_body.webp'
        }
        else if (isFat){
            body.value = '/character/fat_body.webp'
        }else {
            body.value = '/character/main_body.webp'
        }

        if (hovered && !isBathe) {
            mouth.value = '/character/open_mouth.webp'
        }
            // Приоритет 2: Если питомец спит (можно поставить спрайт спящего/закрытого рта, если есть)
            // else if (isSleeping) {
            //     mouth.value = '/character/sleep_mouth.webp' // или оставьте привычный
            // }
        // Приоритет 3: Если есть проблемы (голод, усталость, зависимость/дебафф) — грустный
        else if (hasIssues) {
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

let addictionTimer = null

// watch(() => gameData.addictionLevel, (newAddictionLevel) => {
//     // Очищаем предыдущий таймер, если он уже был запущен
//     if (addictionTimer) {
//         clearTimeout(addictionTimer)
//         addictionTimer = null
//     }
//
//     if (newAddictionLevel === 1) {
//         addictionTimer = setTimeout(() => {
//             gameData.addictionLevel = 0
//             addictionTimer = null
//         }, 3000)
//     }
// })


