import {
    cloudShow,
    energyFull, feedStatus, fruitStreak,
    gameData, hearts,
    isAnimating, isBadMood, isLosingLifeStatus,
    isVibrating,
    lastFedItem, lifeStatus, PlayCount, sameFoodCount,
    showHunger, showTongue,

}
    from "@/scripts/useGameStore.js";
import '@/scripts/stats.js'
import {cartItemsList, currentFoodItem, currentIndex, removeFromCart} from "@/scripts/basket.js";
import {foodList} from "@/scripts/objectItems.js";
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
            // gameData.isDrunk = true
            gameData.addictionStreak = Math.min(3, gameData.addictionStreak + 1)
            gameData.lastAddictionTime = Math.floor(Date.now() / 1000)
            if (gameData.addictionStreak >= 2) {
                gameData.sick = true
            }
            if (gameData.addictionStreak >= 3) {
                isLosingLife()
            }

            if (drunkTimer) {
                clearTimeout(drunkTimer)
            }

            gameData.energy = Math.min(100, gameData.energy + 80)
        }


        // gameData.coins += 1
        if (foodId === "lifePotion") {
            lifeStatus.value = true
            gameData.lives = Math.min(3, gameData.lives + 1)
            setTimeout(() => lifeStatus.value = false, 800)
        }
        if (foodId === "healthPotion") {
            gameData.sick = false
            fruitStreak.value = 0
        }
        addCoin(1)
        addExp(20)

        // if (gameData.feedCount > 6) {
        //     gameData.stinky = true
        // }
    }
}

let lastFatTime = 0
const FAT_COOLDOWN = 10000 // 10 секунд

export function feedPet(foodId) {
    const targetId = foodId || cartItemsList.value[currentIndex.value]?.id
    const foodItem = foodList.find(item => item.id === targetId)

    if (!foodItem || gameData.cart[targetId] <= 0) return

    // 1. Проверяем, ел ли он это же блюдо до этого
    if (lastFedItem.value === targetId) {
        sameFoodCount.value++
    } else {
        lastFedItem.value = targetId
        sameFoodCount.value = 1
    }

    // 2. Если съел 3 раза подряд — отказываемся
    if (sameFoodCount.value >= 3) {
        showTongue.value = true

        // 👇 Добавь этот таймер сброса, чтобы язык пропадал через 2 секунды
        setTimeout(() => {
            showTongue.value = false
        }, 800)

        return false
    }

    // 3. Основная логика кормления
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

    // Флаг, чтобы отследить, стал ли он толстым именно на этом шаге
    let becameFatNow = false

    // 1. Проверка по шкале сытости (100%)
    if (gameData.foodLevel >= 100 && foodItem.subcategory === 'fastfood') {
        if (!gameData.isFat) {
            gameData.isFat = true
            becameFatNow = true
        } else {
            isLosingLife()
        }
    }

    // 2. Проверяем обычный стрик еды
    if (gameData.foodStreak >= 2 && !gameData.isFat) {
        gameData.isFat = true
        becameFatNow = true
    }

    // 3. Логика фруктов (лечение)
    if (foodItem.subcategory === 'fruits') {
        if (gameData.sick) {
            fruitStreak.value++
            if (fruitStreak.value >= 10) {
                gameData.sick = false
                fruitStreak.value = 0
                addCoin(20)
            }
        }
    }

    // 4. Проверка кулдауна (если стал толстым прямо сейчас)
    if (becameFatNow) {
        const now = Date.now()

        if (lastFatTime > 0 && (now - lastFatTime < FAT_COOLDOWN)) {
            gameData.sick = true
        }

        lastFatTime = now
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
    gameData.clickCounter++
    // Тратим энергию / сытость
    if (isBadMood.value) {
        gameData.energy = Math.max(0, gameData.energy - 0.02)
        gameData.foodLevel = Math.max(0, gameData.foodLevel - 0.02)
    } else {
        gameData.energy = Math.max(0, gameData.energy - 0.01)
        gameData.foodLevel = Math.max(0, gameData.foodLevel - 0.01)
    }

    if (gameData.isFat) {
        PlayCount.value++
        if (PlayCount.value >= 30) {
            gameData.isFat = false
            PlayCount.value = 0
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

export const Clean = () => {
    gameData.isPooped = false
    addCoin(10)
    addExp(20)
}

export function isLosingLife() {
    gameData.lives = Math.max(0, gameData.lives - 1)
    isLosingLifeStatus.value = true
    setTimeout(() => isLosingLifeStatus.value = false, 800)
}
