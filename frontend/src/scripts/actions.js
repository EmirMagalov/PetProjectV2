import {
    cloudShow,
    energyFull, feedStatus,
    gameData, hearts,
    isAnimating, isBadMood,
    isVibrating,
    lastFedItem, lifeStatus,
    showHunger,

}
    from "@/scripts/useGameStore.js";
import '@/scripts/stats.js'
import {cartItemsList, currentFoodItem, currentIndex, removeFromCart} from "@/scripts/basket.js";
import {foodList} from "@/scripts/foodItems.js";
import {addExp} from "@/scripts/level.js";

import {toggleSleep} from "@/scripts/stats.js";

import {ref} from "vue";

let hideTrackerTimer = null
export let drunkTimer = null


export function otherFeedPet(foodId) {
    const targetId = foodId || cartItemsList.value[currentIndex.value]?.id
    const foodItem = foodList.find(item => item.id === targetId)
    lastFedItem.value = currentFoodItem.value

    if (foodItem && gameData.cart[targetId] > 0) {
        // 👇 Используем общую функцию списания
        removeFromCart(targetId)
        console.log(gameData.addictionStreak)
        if (foodId === "pipe") {
            gameData.isDrunk = true
            gameData.addictionStreak = Math.min(4, gameData.addictionStreak + 1)
            gameData.lastAddictionTime = Math.floor(Date.now() / 1000)

            if (gameData.addictionStreak >= 3) {
                gameData.lives = Math.max(0, gameData.lives - 1)
            }

            if (drunkTimer) {
                clearTimeout(drunkTimer)
            }

            gameData.energy = Math.min(80, gameData.foodLevel + 80)
        }


        gameData.coins += 1
        if (foodId === "lifePotion") {
            lifeStatus.value = true
            gameData.lives = Math.min(3, gameData.lives + 1)
            setTimeout(() => lifeStatus.value = false, 800)
        }

        addCoin(1)
        addExp(20)

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
        addCoin(1)
        addExp(20)
        feedStatus.value = true
        setTimeout(() => feedStatus.value = false, 800)
        if (gameData.feedCount > 3) {
            gameData.stinky = true
        }
        if (gameData.foodLevel >= 100) {
            gameData.foodStreak++
            gameData.fastfoodStreak++
        }
        if (gameData.isFat){
            gameData.lives = Math.max(0, gameData.lives - 1)
        }
        if (gameData.foodStreak >= 2) {
            gameData.isFat = true

        }
        // Проверяем категорию еды
        if (foodItem.subcategory === 'fastfood') {
            gameData.fastfoodStreak++
            if (gameData.fastfoodStreak >= 4) {
                gameData.isFat = true
                gameData.foodStreak = 2
            }
        } else if (foodItem.subcategory === 'fruits') {
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
    // 🛡️ Если питомец уже спит, мы ВСЕГДА разрешаем нажать кнопку, чтобы разбудить его
    if (gameData.sleep) {
        toggleSleep()
        return
    }

    // Если не спит, проверяем правила для укладывания
    if (gameData.energy < 80) {
        if (!showHunger.value) {
            toggleSleep()
        }
    } else {
        energyFullShow()
    }
}


// Переменная для хранения ссылки на таймер анимации вне функции
export const animKey = ref(0)

export function spawnHeart() {
    gameData.sleep = false

    if (gameData.clickCounter % 3 === 0) {
        addCoin(1)
    }
    addExp(1)
    gameData.clickCounter ++
    // Тратим энергию / сытость
    if (isBadMood.value) {
        gameData.energy = Math.max(0, gameData.energy - 0.02)
        gameData.foodLevel = Math.max(0, gameData.foodLevel - 0.02)
    } else {
        gameData.energy = Math.max(0, gameData.energy - 0.01)
        gameData.foodLevel = Math.max(0, gameData.foodLevel - 0.01)
    }

    if (gameData.isFat) {
        gameData.PlayCount++
        if (gameData.PlayCount >= 30) {
            gameData.isFat = false
            gameData.PlayCount = 0
            gameData.fastfoodStreak = 0
            addExp(10)
            addCoin(10)
        }
    }

    // Увеличиваем ключ — это мгновенно перезапустит анимации сердечка и монетки с нуля
    animKey.value++
    isVibrating.value = true

    // Короткий сброс вибрации рта
    setTimeout(() => {
        isVibrating.value = false
    }, 150)
}

export function addCoin(coins = 1) {

    gameData.coins += coins

    // 2. Включаем флаги анимации
    isAnimating.value = true

    setTimeout(() => {
        isAnimating.value = false

    }, 150)
}

export const Clean = ()=>{
    gameData.isPooped = false
    addCoin(10)
    addExp(20)
}
