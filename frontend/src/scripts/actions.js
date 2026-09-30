import {
    cloudShow,
    energyFull, feedStatus, fruitStreak,
    gameData,
    isAnimating, isBadMood, isLosingLifeStatus,
    isVibrating,
    lastFedItem, lifeStatus, nextTutorialStep, PlayCount, sameFoodCount,
    showHunger, showTongue,

}
    from "@/scripts/useGameStore.js";
import '@/scripts/stats.js'
import {cartItemsList, currentFoodItem, currentIndex, removeFromCart} from "@/scripts/basket.js";
import {foodList} from "@/scripts/objectItems.js";
import {addExp} from "@/scripts/level.js";

import {toggleSleep} from "@/scripts/stats.js";

import {computed, ref, watch} from "vue";

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
    const randomLimit = Math.floor(Math.random() * 3) + 3
    const isSickAndFruit = gameData.sick && foodItem?.subcategory === 'fruits'

    if (!isSickAndFruit && sameFoodCount.value >= randomLimit && gameData.foodLevel >= 50) {
        showTongue.value = true
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

    if (gameData.feedCount >= 10) {
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

// --- НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ КОМБО ---
export const comboClicks = ref(0)     // Счетчик кликов подряд
export const comboMultiplier = ref(1) // Текущий множитель (1, 5, 10, 20)
export const comboAnimKey = ref(0);
export const isComboAnimating = ref(false);
export const coinAnimKey = ref(0)
export const isCoinAnimating = ref(false)
export const sunMoonAnimKey = ref(0)
export const sunAnimating = ref(false)
let comboTimer = null                // Таймер сброса комбо
let comboHideTimer = null
let sunHideTimer = null

export function spawnHeart() {
    nextTutorialStep()
    gameData.sleep = false

    // 1. Увеличиваем клик-счётчик
    gameData.clickCounter++

    // 2. Логика комбо
    comboClicks.value++
    if (comboTimer) clearTimeout(comboTimer)

    if (comboClicks.value >= 100) {
        comboMultiplier.value = 5
    } else if (comboClicks.value >= 50) {
        comboMultiplier.value = 3
    } else if (comboClicks.value >= 20) {
        comboMultiplier.value = 2
    } else {
        comboMultiplier.value = 1
    }

    comboTimer = setTimeout(() => {
        comboClicks.value = 0
        comboMultiplier.value = 1
    }, 1000)

    // 3. АНИМАЦИЯ КОМБО (Запускается на клик, если предыдущая еще не идет)

    isComboAnimating.value = true
    comboAnimKey.value++
    sunAnimating.value = true
    // sunMoonAnimKey.value++

    if (comboHideTimer) {
        clearTimeout(comboHideTimer)
    }
    if (sunHideTimer) {
        clearTimeout(sunHideTimer)
    }

    // 3. Запускаем таймер заново: скроется только через 1000мс ПОСЛЕ ПОСЛЕДНЕГО КЛИКА
    comboHideTimer = setTimeout(() => {
        isComboAnimating.value = false
    }, 800)

    sunHideTimer = setTimeout(() => {
        sunAnimating.value = false
    }, 800)


    // Начисление монет (оставляем как у тебя)
    if (gameData.clickCounter % 2 === 0) {
        addCoin(1 * comboMultiplier.value)
    }


    addExp(1)

    // Тратим энергию / сытость
    const cost = isBadMood.value ? 0.02 : 0.01
    gameData.energy = Math.max(0, gameData.energy - cost)
    gameData.foodLevel = Math.max(0, gameData.foodLevel - cost)

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

    // Увеличиваем ключ для персонажа и сердечка
    animKey.value++
    isVibrating.value = true

    setTimeout(() => {
        isVibrating.value = false
    }, 150)
}

export function addCoin(coins = 1) {
    if (!isCoinAnimating.value) {
        isCoinAnimating.value = true
        coinAnimKey.value++

        setTimeout(() => {
            isCoinAnimating.value = false
        }, 500) // 500мс — длительность coinFly
    }
    gameData.coins += coins

    // 2. Включаем флаги анимации
    isAnimating.value = true

    setTimeout(() => {
        isAnimating.value = false

    }, 5000)
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


// <span class="text-xs font-bold text-amber-900">Сделайте ставку:</span>
