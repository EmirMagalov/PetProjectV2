import {
    cloudShow,
    energyFull, fruitStreak,
    gameData,
    isAnimating, isBadMood,
    isVibrating,
    lastFedItem, nextTutorialStep, PlayCount, sameFoodCount,
    showHunger, showStatus, showTongue, tutorialStep,

}
    from "@/scripts/useGameStore.js";
import '@/scripts/stats.js'
import {cartItemsList, currentFoodItem, currentIndex, removeFromCart} from "@/scripts/basket.js";
import {foodList} from "@/scripts/objectItems.js";
import {addExp} from "@/scripts/level.js";
import {toggleSleep} from "@/scripts/stats.js";
import {ref} from "vue";

export const comboClicks = ref(0)     // Счетчик кликов подряд
export const comboMultiplier = ref(1) // Текущий множитель (1, 5, 10, 20)
export const comboAnimKey = ref(0);
export const isComboAnimating = ref(false);
export const coinAnimKey = ref(0)
export const isCoinAnimating = ref(false)
export const sunAnimating = ref(false)
export const pupilOffset = ref({x: 0, y: 0})
export const isEditing = ref(false);
export let drunkTimer = null

let hideTrackerTimer = null
let lastFatTime = 0
const FAT_COOLDOWN = 10000 // 10 секунд
let comboTimer = null                // Таймер сброса комбо
let comboHideTimer = null
let sunHideTimer = null
let vibrateTimer = null
let coinHideTimer = null
let lookResetTimer = null;
let lastTouchTime = 0;
const TOUCH_COOLDOWN = 50; // Минимальный интервал 50 мс (не более 20 кликов в секунду)
const MAX_TOUCH_FINGERS = 3; // Не более 3 пальцев за один раз
let zeroStatsClicks = 0;
const recentFedItems = ref([])

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


        if (foodId === "lifePotion") {

            gameData.lives = Math.min(3, gameData.lives + 1)
            showStatus('lifeGain')
        }
        if (foodId === "healthPotion") {
            gameData.sick = false
            fruitStreak.value = 0
        }
        addCoin(1)
        addExp(20)


    }
}


export function feedPet(foodId) {
    const targetId = foodId || cartItemsList.value[currentIndex.value]?.id
    const foodItem = foodList.find(item => item.id === targetId)

    if (!foodItem || gameData.cart[targetId] <= 0) return

    // 1. Считаем, сколько раз это блюдо встречалось в последних приемах пищи
    const sameFoodCountInHistory = recentFedItems.value.filter(id => id === targetId).length

    const randomLimit = Math.floor(Math.random() * 2) + 2 // Например, от 2 до 3 раз
    const isSickAndFruit = gameData.sick && foodItem?.subcategory === 'fruits'

    // Если блюдо уже часто встречалось в недавней истории и питомец достаточно сыт
    if (!isSickAndFruit && sameFoodCountInHistory >= randomLimit && gameData.foodLevel >= 50) {
        showTongue.value = true
        setTimeout(() => {
            showTongue.value = false
        }, 800)
        return false
    }

    // 2. Если питомец согласился съесть — добавляем ID в историю и ограничиваем размер (например, помним последние 5 блюд)
    recentFedItems.value.push(targetId)
    if (recentFedItems.value.length > 5) {
        recentFedItems.value.shift() // Удаляем самое старое блюдо
    }

    // 3. Основная логика кормления
    removeFromCart(targetId)

    gameData.foodLevel = Math.min(100, gameData.foodLevel + foodItem.foodGain)
    if (foodItem.energyGain) {
        gameData.energy = Math.min(100, gameData.energy + foodItem.energyGain)
    }

    gameData.coins += 1
    gameData.feedCount += 1
    addCoin(1)
    addExp(20)
    showStatus('feed', {fedItemId: foodId})

    if (gameData.feedCount >= 10) {
        gameData.stinky = true
        gameData.feedCount = 0
    }

    // Флаг, чтобы отследить, стал ли он толстым именно на этом шаге
    let becameFatNow = false

    // 1. Проверка по шкале сытости (100%)
    if (gameData.foodLevel >= 100 ) {
        if (!gameData.isFat) {
            gameData.fatCount = 30
            gameData.isFat = true
            becameFatNow = true
        } else {
            if(foodItem.subcategory !== 'fruits'){
                isLosingLife()
            }else if(foodItem.subcategory === 'fruits'){
                gameData.fatCount = Math.min(100,gameData.fatCount += 30)
            }

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


export function finishEditing() {
    if (!gameData.name || !gameData.name.trim()) {
        gameData.name = 'Имя:';
    }
    isEditing.value = false;
}

export const isUserLooking = ref(false); // Флаг: пользователь держит/ведет палец


// scripts/actions.js

export function updateEyeLook(event) {
    if (!event) return;

    isUserLooking.value = true;

    // Считываем позицию из touch или из mouse/pointer события
    const touch = (event.touches && event.touches.length > 0)
        ? event.touches[0]
        : (event.changedTouches && event.changedTouches.length > 0)
            ? event.changedTouches[0]
            : event;

    if (!touch || touch.clientX === undefined) return;

    // Находим главный контейнер игры по селектору или берем экран
    const gameCanvas = document.querySelector('.w-\\[320px\\]') || document.body;
    const rect = gameCanvas.getBoundingClientRect();

    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = clickX - centerX;
    const deltaY = clickY - centerY;

    const maxOffset = 3; // Амплитуда смещения зрачков

    const pupilX = Math.max(-maxOffset, Math.min(maxOffset, (deltaX / centerX) * maxOffset));
    const pupilY = Math.max(-maxOffset, Math.min(maxOffset, (deltaY / centerY) * maxOffset));

    pupilOffset.value = {x: pupilX, y: pupilY};
}

export function resetEyeLook(delay = 1000) {
    if (lookResetTimer) clearTimeout(lookResetTimer);

    lookResetTimer = setTimeout(() => {
        pupilOffset.value = {x: 0, y: 0};
        isUserLooking.value = false; // Возвращаем возможность рандомного взгляда
    }, delay);
}

export function handleMultiTouch(event) {
    if (isEditing.value) {
        finishEditing();
    }
    if (event.cancelable) {
        event.preventDefault();
    }
    const now = Date.now();
    if (now - lastTouchTime < TOUCH_COOLDOWN) {
        return;
    }
    lastTouchTime = now;
    let touchCount = 1;
    if (event && event.touches && event.touches.length > 0) {
        touchCount = Math.min(event.touches.length, MAX_TOUCH_FINGERS);
    }


    let x = 160;
    let y = 135;

    if (event) {
        const rect = event.currentTarget?.getBoundingClientRect();
        const touch = event.touches && event.touches.length > 0 ? event.touches[0] : event;
        if (rect && touch) {
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        }
    }

    // Обновляем позицию зрачков при нажатии
    updateEyeLook(event);
    resetEyeLook(1200);

    // 💥 3. Вызываем spawnHeart С УЧЕТОМ количества разрешенных пальцев
    for (let i = 0; i < touchCount; i++) {
        // Добавляем небольшое случайное смещение для каждого пальца, чтобы спавн сердечек выглядел естественно
        const offsetX = x + (i > 0 ? (Math.random() - 0.5) * 30 : 0);
        const offsetY = y + (i > 0 ? (Math.random() - 0.5) * 30 : 0);
        spawnHeart(offsetX, offsetY);
    }
}

export function spawnHeart(x = 160, y = 135) {
    if (tutorialStep.value === 3) {
        if (gameData.clickCounter > 10) nextTutorialStep()
    }


    if (tutorialStep.value === 6 || tutorialStep.value === 7) {
        return
    }

    if (comboHideTimer) clearTimeout(comboHideTimer)
    if (sunHideTimer) clearTimeout(sunHideTimer)

    if (!gameData.sleep) {
        sunAnimating.value = true
        sunHideTimer = setTimeout(() => {
            sunAnimating.value = false
        }, 800)
    }

    gameData.sleep = false
    gameData.clickCounter++
    if (vibrateTimer) clearTimeout(vibrateTimer)
    isVibrating.value = true
    vibrateTimer = setTimeout(() => {
        isVibrating.value = false
    }, 150)

    const isFoodZero = gameData.foodLevel <= 0
    const isEnergyZero = gameData.energy <= 0
    if (isFoodZero || isEnergyZero) {
        zeroStatsClicks++

        // Если ВСЕ 2 показателя на нуле — лимит 50, иначе (если только 1) — лимит 100
        const clickLimit = (isFoodZero && isEnergyZero) ? 50 : 100

        // При достижении нужного лилита списываем жизнь
        if (zeroStatsClicks >= clickLimit) {
            isLosingLife()
            zeroStatsClicks = 0 // Сбрасываем счетчик для следующей жизни
        }

        return // Прерываем выполнение (монеты, опыт и комбо не начисляются)
    } else {
        // Если оба показателя выше 0 — обнуляем штрафной счетчик
        zeroStatsClicks = 0
    }
    comboClicks.value++
    if (comboTimer) clearTimeout(comboTimer)

    if (comboClicks.value >= 150) {
        comboMultiplier.value = 5
    } else if (comboClicks.value >= 100) {
        comboMultiplier.value = 3
    } else if (comboClicks.value >= 50) {
        comboMultiplier.value = 2
    } else {
        comboMultiplier.value = 1
    }
    isComboAnimating.value = true
    comboAnimKey.value++


    comboTimer = setTimeout(() => {
        comboClicks.value = 0
        comboMultiplier.value = 1
    }, 900)

    comboHideTimer = setTimeout(() => {
        isComboAnimating.value = false
    }, 800)

    // 3. Передаем координаты в addCoin
    if (gameData.clickCounter % 2 === 0) {
        addCoin(1, x, y)
    }
    const expAmount = comboMultiplier.value > 2 ? 1 * comboMultiplier.value : 1
    addExp(expAmount, x, y)

    const cost = isBadMood.value ? 0.02 : 0.01
    gameData.energy = Math.max(0, gameData.energy - cost)
    gameData.foodLevel = Math.max(0, gameData.foodLevel - cost)

    if (gameData.isFat) {
        PlayCount.value++
        if ( (gameData.fatCount - PlayCount.value) <= 0) {
            gameData.isFat = false
            PlayCount.value = 0
            gameData.fastfoodStreak = 0
            addExp(10)
            addCoin(10, x, y)
        }
    }
}

export function addCoin(coins = 1, x = 160, y = 135) {
    if (coinHideTimer) clearTimeout(coinHideTimer)
    const finalCoins = coins * comboMultiplier.value
    // Передаем фиксированную пачку из 5 визуальных монеток и координаты клика
    triggerCoinAnimation(finalCoins, x, y)

    isCoinAnimating.value = true
    coinAnimKey.value++

    coinHideTimer = setTimeout(() => {
        isCoinAnimating.value = false
    }, 500)

    gameData.coins += finalCoins

    isAnimating.value = true
    setTimeout(() => {
        isAnimating.value = false
    }, 5000)
}

export const Clean = (event) => {
    let x = 160;
    let y = 135;

    if (event) {
        if (typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }

        const gameCanvas = document.querySelector('.w-\\[320px\\]') || document.body;
        const rect = gameCanvas.getBoundingClientRect();

        const touch = (event.touches && event.touches.length > 0)
            ? event.touches[0]
            : (event.changedTouches && event.changedTouches.length > 0)
                ? event.changedTouches[0]
                : event;

        if (touch && touch.clientX !== undefined) {
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        }
    }

    // ❌ УБРАЛИ: gameData.isPooped = false;
    // Теперь Clean только начисляет награду и спавнит монеты в точке клика

    addCoin(10, x, y);
    addExp(20, x, y);
};
export function isLosingLife() {
    gameData.lives = Math.max(0, gameData.lives - 1)
    showStatus('losingLife')
}

export const activeCoins = ref([])
export const activeExp = ref([])

export function triggerCoinAnimation(count = 5, startX = 160, startY = 135) {
    // 🛡️ Ограничиваем визуальное количество монеток до 10 штук за раз
    const visualCount = Math.min(count, 10)
    const id = Date.now() + Math.random()

    const coins = Array.from({length: visualCount}, (_, i) => ({
        id: `${id}-${i}`,
        x: startX + (visualCount > 1 ? (Math.random() - 0.5) * 40 : 0),
        y: startY + (visualCount > 1 ? (Math.random() - 0.5) * 20 : 0),
        delay: i * 0.04
    }))
    if (activeCoins.value.length > 15) {
        // Если на экране висит уже 15 пачек, удаляем самую старую
        activeCoins.value.shift()
    }
    activeCoins.value.push({id, coins})

    setTimeout(() => {
        activeCoins.value = activeCoins.value.filter(c => c.id !== id)
    }, 1000)
}

export function triggerExpAnimation(count = 5, startX = 160, startY = 135) {
    // 🛡️ Ограничиваем визуальное количество опыта до 8 штук за раз
    const visualCount = Math.min(count, 10)
    const id = Date.now() + Math.random()

    const offsetY = 0
    const offsetX = -25

    const exp = Array.from({length: visualCount}, (_, i) => ({
        id: `${id}-${i}`,
        x: (startX + offsetX) + (visualCount > 1 ? (Math.random() - 0.5) * 40 : 0),
        y: (startY + offsetY) + (visualCount > 1 ? (Math.random() - 0.5) * 20 : 0),
        delay: i * 0.04
    }))
    if (activeExp.value.length > 15) {
        activeExp.value.shift()
    }
    activeExp.value.push({id, exp})

    setTimeout(() => {
        activeExp.value = activeExp.value.filter(c => c.id !== id)
    }, 1000)
}