import {
    cloudShow,
    energyFull,
    gameData, hearts,
    isAnimating, isBadMood, isGameOver,
    isVibrating,
    lastFedItem,
    showHunger,

}
    from "@/scripts/useGameStore.js";
import '@/scripts/stats.js'
import {cartItemsList, currentFoodItem, currentIndex, giveCoinToggle, removeFromCart} from "@/scripts/basket.js";
import {foodList} from "@/scripts/foodItems.js";
import {addExp} from "@/scripts/level.js";

import {toggleSleep} from "@/scripts/stats.js";
import {initGameData, resetPet} from "@/scripts/api.js";

let hideTrackerTimer = null
export let drunkTimer = null


export function addCoins(amount) {
    gameData.coins += amount

}

export function otherFeedPet(foodId) {
    const targetId = foodId || cartItemsList.value[currentIndex.value]?.id
    const foodItem = foodList.find(item => item.id === targetId)
    lastFedItem.value = currentFoodItem.value

    if (foodItem && gameData.cart[targetId] > 0) {
        // 👇 Используем общую функцию списания
        removeFromCart(targetId)

        gameData.isDrunk = true
        gameData.addictionStreak = Math.min(4, gameData.addictionStreak + 1)
        gameData.lastAddictionTime = Math.floor(Date.now() / 1000)

        if (gameData.addictionStreak >= 3) {
            gameData.lives = Math.max(0, gameData.lives - 1)
        }

        if (drunkTimer) {
            clearTimeout(drunkTimer)
        }

        // Включаем таймер на 1 минуту (60 000 миллисекунд)
        if (gameData.addictionStreak <= 1) {
            drunkTimer = setTimeout(() => {
                gameData.isDrunk = false
                drunkTimer = null
            }, 60000)
        }
        gameData.coins += 1
        gameData.energy = Math.min(80, gameData.foodLevel + 80)
        animationCoin(1)
        addExp(20)
        currentIndex.value = 0
        if (gameData.feedCount > 6) {
            gameData.stinky = true
        }
    }
}


export function feedPet(foodId) {
    const targetId = foodId || cartItemsList.value[currentIndex.value]?.id
    const foodItem = foodList.find(item => item.id === targetId)
    lastFedItem.value = currentFoodItem.value

    if (foodItem && gameData.cart[targetId] > 0) {
        // 👇 Используем общую функцию списания
        removeFromCart(targetId)

        gameData.foodLevel = Math.min(100, gameData.foodLevel + foodItem.foodGain)
        gameData.coins += 1
        gameData.feedCount += 1
        animationCoin(1)
        addExp(20)
        if (gameData.feedCount > 3) {
            gameData.stinky = true
        }
        if (gameData.foodLevel >= 100) {
            gameData.foodStreak++
            gameData.fastfoodStreak++
        }

        if (gameData.foodStreak >= 2) {
            gameData.isFat = true
            gameData.lives = Math.max(0, gameData.lives - 1)
        }
        // Проверяем категорию еды
        if (foodItem.category === 'fastfood') {
            gameData.fastfoodStreak++
            if (gameData.fastfoodStreak >=4){
                gameData.isFat = true
                gameData.foodStreak = 2
            }
        } else if (foodItem.category === 'fruits') {
            if (gameData.fruitStreak >= 3) {
                gameData.isFat = false
            }
            if (gameData.isDrunk) {
                gameData.isDrunk = false
            }
        }
    }
}

export function energyFullShow() {
    if (hideTrackerTimer) return

    energyFull.value = true
    const prevCloudShow = cloudShow.value
    cloudShow.value = true

    hideTrackerTimer = setTimeout(() => {
        energyFull.value = false
        if (!prevCloudShow) {
            cloudShow.value = false
        }
        hideTrackerTimer = null
    }, 2000)
}

export function goSleep() {
    if (gameData.energy < 80) {
        if (!showHunger.value) {
            // gameData.sleep = !gameData.sleep
            toggleSleep()
        }
    } else {
        energyFullShow()
    }
}


export function spawnHeart() {
    if (isAnimating.value) {
        return
    }

    gameData.sleep = false
    isAnimating.value = true
    isVibrating.value = true

    // Меняем состояние ДО начала анимации, чтобы шаблон сразу понял, что показывать
    giveCoinToggle.value = !giveCoinToggle.value

    if (isBadMood.value) {

        gameData.energy = Math.max(0, gameData.energy - 1.5)
        gameData.foodLevel = Math.max(0, gameData.foodLevel - 1)
    } else {
        gameData.energy = Math.max(0, gameData.energy - 0.5)
        gameData.foodLevel = Math.max(0, gameData.foodLevel - 0.3)
    }
    if (gameData.isFat) {
        gameData.PlayCount++

        // Если поиграли 5 раз — худеем!
        if (gameData.PlayCount >= 10) {
            gameData.isFat = false
            gameData.PlayCount = 0
            gameData.fastfoodStreak = 0 // Сбрасываем и стрик фастфуда на всякий случай
        }
    }
    // Показываем анимацию
    hearts.value = true

    addExp(5)
    // Таймер окончания анимации
    setTimeout(() => {
        isAnimating.value = false
        isVibrating.value = false
        hearts.value = false
        // Начисляем монету, если выпал этот цикл
        if (giveCoinToggle.value) {
            addCoins(1)
        }
    }, 800)
}


export function animationCoin(coins = 1) {
    isAnimating.value = true
    giveCoinToggle.value = true
    setTimeout(() => {
        isAnimating.value = false
        giveCoinToggle.value = true
        gameData.coins += coins


        // Начисляем монету, если выпал этот цикл

    }, 800)
}


export async function startOver() {
    isGameOver.value = false
    await resetPet()
    await initGameData()
}