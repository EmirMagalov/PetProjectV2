import {useDraggable} from "@vueuse/core";
import {computed, ref} from "vue";
import {addCoin, feedPet, isLosingLife, otherFeedPet, updateEyeLook, resetEyeLook} from "@/scripts/actions.js";
import {
    colorFoam,
    currentDraggedItem,
    dropZoneRef, energyFull, foamOffset,
    gameData, maxLives, nextTutorialStep, showTongue,
    statusFoam,
    statusShower
} from "@/scripts/useGameStore.js";

import {currentBathItem, currentFoodItem, removeFromCart,} from "@/scripts/basket.js";
import {addExp} from "@/scripts/level.js";
import {incrementTaskProgress} from "@/scripts/dealyTasks.js";

export let actionTimer = null


export const showerCount = ref(0)

export const isHovered = ref(false)
export const foodConsumedByPipe = ref(false)

export const foodEl = ref()
export const showerEl = ref()
export const foamEl = ref()
export const statusSmoke = ref(false)

export const batheStatus = ref(false)
let lastBathTime = 0
const BATH_COOLDOWN = 5000

function clearActionTimer() {
    if (actionTimer) {
        clearTimeout(actionTimer)
        actionTimer = null
    }
}

// Универсальная функция проверки зоны
export function handleMove(event, itemType, Item) {
    if (itemType === 'food' && foodConsumedByPipe.value) {
        foodDrag.x.value = -9999
        foodDrag.y.value = -9999
        return
    }
    if (!dropZoneRef.value) return
    const dropRect = dropZoneRef.value.getBoundingClientRect()
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0

    // Базовая проверка вхождения в общий холст
    let isInside = (
        clientX >= dropRect.left &&
        clientX <= dropRect.right &&
        clientY >= dropRect.top &&
        clientY <= dropRect.bottom
    )

    // 🔥 ДЛЯ ШАМПУНЯ И ДУША: сужаем зону строго до центрального квадрата (где персонаж)
    if (isInside && (itemType === 'shower' || itemType === 'foam')) {
        const centerX = dropRect.left + dropRect.width / 2
        const centerY = dropRect.top + dropRect.height / 2
        const radiusX = 80 // радиус зоны по горизонтали (пиксели)
        const radiusY = 80 // радиус зоны по вертикали (пиксели)

        isInside = (
            clientX >= centerX - radiusX &&
            clientX <= centerX + radiusX &&
            clientY >= centerY - radiusY &&
            clientY <= centerY + radiusY
        )
    }

    if (isInside) {
        isHovered.value = true
        gameData.sleep = false

        if (itemType === 'shower') {
            batheStatus.value = true

            if (statusFoam.value === true) {
                statusShower.value = true

                if (!actionTimer) {
                    // Каждые 50мс немного опускаем пену вниз
                    actionTimer = setInterval(() => {
                        if (isHovered.value && currentDraggedItem.value === 'shower') {
                            foamOffset.value += 1.5 // Пена постепенно сползает вниз

                            // Когда пена сместилась достаточно низко (например, на 60px) — считаем смыв завершенным
                            if (foamOffset.value >= 60) {
                                if (gameData.sick) {
                                    isLosingLife()
                                }
                                const now = Date.now()
                                if (now - lastBathTime < BATH_COOLDOWN) {
                                    gameData.sick = true
                                }
                                lastBathTime = now

                                statusShower.value = false
                                statusFoam.value = false
                                foamOffset.value = 0 // Сбрасываем только когда пена ПОЛНОСТЬЮ смота
                                localStorage.removeItem('pet_statusFoam')
                                localStorage.removeItem('pet_foamOffset')
                                localStorage.removeItem('pet_colorFoam')
                                showerCount.value += 1
                                gameData.stinky = false
                                nextTutorialStep()
                                addCoin(2)
                                addExp(25)
                                incrementTaskProgress('wash', 1)
                                gameData.feedCount = 0
                                clearActionTimer()
                            }
                        } else {
                            statusShower.value = false
                            clearActionTimer()
                        }
                    }, 50)
                }
            } else {
                statusShower.value = false
                clearActionTimer()
            }
        } else if (itemType === 'foam') {
            batheStatus.value = true
        }
    } else {
        isHovered.value = false
        statusShower.value = false
        statusSmoke.value = false
        clearActionTimer()
    }
}

// Универсальная функция окончания перетаскивания
export function handleEnd(itemType, Item) {
    clearActionTimer()
    statusShower.value = false
    if (foodConsumedByPipe.value || Item?.category === 'pipe') {
        statusSmoke.value = false
        foodConsumedByPipe.value = false
        isHovered.value = false
        currentDraggedItem.value = null
        return
    }

    if (isHovered.value) {
        if (itemType === 'food') {
            if (Item?.category === 'food') {
                feedPet(Item.id)
                nextTutorialStep()
            } else if (Item) {
                const isFullLives = (Item.id === 'life_serum' && gameData.lives >= maxLives.value)
                const isUnneededHealth = (Item.id === 'health_serum' && !gameData.sick)
                const isUnneededEnergy = (Item.id === 'energy_serum' && gameData.energy >= 80)

                if (!isFullLives && !isUnneededHealth && !isUnneededEnergy) {
                    otherFeedPet(Item.id)
                } else {
                    showTongue.value = true
                    setTimeout(() => {
                        showTongue.value = false
                    }, 800)
                }
            }
        } else if (itemType === 'foam') {
            // Если пены ЕЩЕ НЕТ — только тогда намыливаем и сохраняем цвет
            if (!statusFoam.value) {
                statusFoam.value = true

                if (Item?.color) {
                    colorFoam.value = Item.color
                    localStorage.setItem('pet_colorFoam', Item.color)
                }

                nextTutorialStep()
                if (Item?.id) {
                    removeFromCart(Item.id)
                }
            }
        }
    }

    batheStatus.value = false
    isHovered.value = false
    statusShower.value = false
    currentDraggedItem.value = null
    statusSmoke.value = false
    foodConsumedByPipe.value = false

    window.getSelection()?.removeAllRanges()
    document.activeElement?.blur()
}

export const foodDrag = useDraggable(foodEl, {
    disabled: computed(() => Object.keys(gameData.cart).length === 0),
    preventDefault: true,
    onStart: (pos, event) => {
        clearActionTimer()
        currentDraggedItem.value = 'food'
        foodConsumedByPipe.value = false
        if (foodEl.value) {
            const rect = foodEl.value.getBoundingClientRect()
            foodDrag.x.value = rect.left
            foodDrag.y.value = rect.top
        }
    },
    onMove: (pos, event) => {
        updateEyeLook(event)
        const foodItem = currentFoodItem.value
        handleMove(event, 'food', foodItem)
    },
    onEnd: () => {
        const foodItem = currentFoodItem.value
        handleEnd('food', foodItem)
        resetEyeLook(600)
    }
})

export const showerDrag = useDraggable(showerEl, {
    preventDefault: true,
    onStart: (pos, event) => {
        clearActionTimer()
        currentDraggedItem.value = 'shower'
        if (showerEl.value) {
            const rect = showerEl.value.getBoundingClientRect()
            showerDrag.x.value = rect.left
            showerDrag.y.value = rect.top
        }
    },
    onMove: (pos, event) => {
        updateEyeLook(event)
        handleMove(event, 'shower')
    },
    onEnd: () => {
        handleEnd('shower')
        resetEyeLook(600)
    }
})

export const foamDrag = useDraggable(foamEl, {
    preventDefault: true,
    onStart: (pos, event) => {
        clearActionTimer()
        currentDraggedItem.value = 'foam'
        if (foamEl.value) {
            const rect = foamEl.value.getBoundingClientRect()
            foamDrag.x.value = rect.left
            foamDrag.y.value = rect.top
        }
    },
    onMove: (pos, event) => {
        updateEyeLook(event)
        const bathItem = currentBathItem.value
        handleMove(event, 'foam', bathItem)
    },
    onEnd: () => {
        const bathItem = currentBathItem.value
        handleEnd('foam', bathItem)
        resetEyeLook(600)
    }
})