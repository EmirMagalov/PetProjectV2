import {useDraggable} from "@vueuse/core";
import {computed, ref} from "vue";
import {addCoin, feedPet, isLosingLife, otherFeedPet, updateEyeLook, resetEyeLook} from "@/scripts/actions.js";
import {
    currentDraggedItem,
    dropZoneRef,
    gameData, nextTutorialStep, showTongue,
    statusFoam,
    statusShower
} from "@/scripts/useGameStore.js";

import {currentBathItem, currentFoodItem, removeFromCart,} from "@/scripts/basket.js";
import {addExp} from "@/scripts/level.js";

export let actionTimer = null
export let previousMouth = ''

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

// Вспомогательная функция для чистки таймера
function clearActionTimer() {
    if (actionTimer) {
        clearTimeout(actionTimer)
        actionTimer = null
    }
}

// Универсальная функция проверки зоны и открытия рта
export function handleMove(event, itemType, foodId = null, Category = null, SubCategory = null) {
    if (itemType === 'food' && foodConsumedByPipe.value) {
        foodDrag.x.value = -9999
        foodDrag.y.value = -9999
        return
    }
    if (!dropZoneRef.value) return
    const dropRect = dropZoneRef.value.getBoundingClientRect()
    const clientX = event.clientX
    const clientY = event.clientY

    const isInside = (
        clientX >= dropRect.left &&
        clientX <= dropRect.right &&
        clientY >= dropRect.top &&
        clientY <= dropRect.bottom
    )

    if (isInside) {
        isHovered.value = true
        if (itemType === 'food') {
            if (gameData.cart['pipe'] && Category ==='shaman' && SubCategory==='pipe') {
                statusSmoke.value = true
                if (!actionTimer) {
                    actionTimer = setTimeout(() => {
                        if (isHovered.value && currentDraggedItem.value === 'food') {
                            statusSmoke.value = false
                            otherFeedPet(foodId)
                            addCoin(2)
                            addExp(5)

                            foodConsumedByPipe.value = true
                            foodDrag.x.value = -9999
                            foodDrag.y.value = -9999

                            isHovered.value = false
                            currentDraggedItem.value = null
                        }
                        clearActionTimer()
                    }, 3000)
                }
            }
            gameData.sleep = false
        } else if (itemType === 'shower') {
            batheStatus.value = true
            if (statusFoam.value === true) {
                statusShower.value = true

                if (!actionTimer) {
                    actionTimer = setTimeout(() => {
                        // Если предмет всё ещё зажат и находится в зоне
                        if (isHovered.value && currentDraggedItem.value === 'shower') {
                            const now = Date.now()
                            if (gameData.sick) {
                                isLosingLife()
                            }
                            if (now - lastBathTime < BATH_COOLDOWN) {
                                gameData.sick = true
                            }
                            lastBathTime = now

                            // Мгновенно убираем пена/душ визуально
                            statusShower.value = false
                            statusFoam.value = false

                            showerCount.value += 1
                            gameData.stinky = false
                            nextTutorialStep()
                            addCoin(2)
                            addExp(25)
                            gameData.feedCount = 0
                        } else {
                            statusShower.value = false
                        }
                        clearActionTimer()
                    }, 2000)
                }
            }
        } else if (itemType === 'foam') {
            batheStatus.value = true
        }
    } else {
        // Если вышли за пределы зоны — СРАЗУ отменяем таймер и сбрасываем эффекты
        isHovered.value = false
        statusShower.value = false
        statusSmoke.value = false
        clearActionTimer()
    }
}

// Универсальная функция окончания перетаскивания
export function handleEnd(itemType, foodId, Category) {
    clearActionTimer()

    if (foodConsumedByPipe.value || foodId === 'pipe') {
        statusSmoke.value = false
        foodConsumedByPipe.value = false
        isHovered.value = false
        currentDraggedItem.value = null
        return
    }

    if (isHovered.value) {
        if (itemType === 'food') {
            if (Category === 'food') {
                feedPet(foodId)
                nextTutorialStep()
            } else {
                const isFullLivesPotion = (foodId === 'lifePotion' && gameData.lives >= 3)
                const isUnneededHealthPotion = (foodId === 'healthPotion' && !gameData.sick)

                if (!isFullLivesPotion && !isUnneededHealthPotion) {
                    otherFeedPet(foodId)
                }else {
                    showTongue.value = true
                    setTimeout(() => {
                        showTongue.value = false
                    }, 800)
                }
            }
        } else if (itemType === 'foam') {
            if (!statusFoam.value) {
                statusFoam.value = true
                nextTutorialStep()
                if (foodId) {
                    removeFromCart(foodId)
                }
            }
        }
    }

    // Мгновенный сброс всех состояний при отпускании
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

        const foodId = currentFoodItem.value?.id
        const Category = currentFoodItem.value?.category
        const SubCategory = currentFoodItem.value?.subcategory
        handleMove(event, 'food', foodId, Category, SubCategory)
    },
    onEnd: () => {
        const foodId = currentFoodItem.value?.id
        const Category = currentFoodItem.value?.category
        handleEnd('food', foodId, Category)
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
        const bathId = currentBathItem.value?.id
        handleMove(event, 'foam', bathId)
    },
    onEnd: () => {
        const bathId = currentBathItem.value?.id
        handleEnd('foam', bathId)
        resetEyeLook(600)
    }
})