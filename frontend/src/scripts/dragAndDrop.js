import {useDraggable} from "@vueuse/core";
import {computed, ref} from "vue";
// 1. Добавляем импорты функций слежения глаз
import {addCoin, feedPet, isLosingLife, otherFeedPet, updateEyeLook, resetEyeLook} from "@/scripts/actions.js";
import {
    currentDraggedItem,
    dropZoneRef,
    gameData, nextTutorialStep,
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
// Время последнего успешного действия (в миллисекундах)
let lastBathTime = 0

// Кулдаун в миллисекундах
const BATH_COOLDOWN = 5000

// Универсальная функция проверки зоны и открытия рта
export function handleMove(event, itemType, foodId, foodCategory) {
    if (itemType === 'food' && foodConsumedByPipe.value) {
        foodDrag.x.value = -9999
        foodDrag.y.value = -9999
        return
    }
    if (!dropZoneRef.value) return
    const dropRect = dropZoneRef.value.getBoundingClientRect()
    const clientX = event.clientX
    const clientY = event.clientY
    if (
        clientX >= dropRect.left &&
        clientX <= dropRect.right &&
        clientY >= dropRect.top &&
        clientY <= dropRect.bottom
    ) {
        isHovered.value = true
        if (itemType === 'food') {
            console.log(foodCategory)
            if (gameData.cart['pipe'] && foodCategory ==='shaman') {
                statusSmoke.value = true
                if (!actionTimer) {
                    actionTimer = setTimeout(() => {
                        statusSmoke.value = false
                        otherFeedPet(foodId)
                        addCoin(2)
                        addExp(5)

                        // Помечаем, что еда уже съедена
                        foodConsumedByPipe.value = true
                        foodDrag.x.value = -9999
                        foodDrag.y.value = -9999

                        isHovered.value = false
                        currentDraggedItem.value = null

                        statusSmoke.value = false
                        actionTimer = null
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
                        const now = Date.now()
                        if(gameData.sick){
                            isLosingLife()
                        }
                        if (now - lastBathTime < BATH_COOLDOWN) {
                            gameData.sick = true
                        }
                        lastBathTime = now
                        statusShower.value = false
                        statusFoam.value = false
                        showerCount.value += 1
                        gameData.stinky = false
                        nextTutorialStep()
                        addCoin(2)
                        addExp(25)
                        gameData.feedCount = 0
                    }, 2000)
                }
            }
        } else if (itemType === 'foam') {
            batheStatus.value = true
        }
    } else {
        isHovered.value = false
        if (actionTimer) {
            clearTimeout(actionTimer)
            statusShower.value = false
            actionTimer = null
        }
        statusSmoke.value = false
    }
}

// Универсальная функция окончания перетаскивания
export function handleEnd(itemType, foodId, foodCategory) {
    if (foodConsumedByPipe.value || foodId === 'pipe') {
        statusSmoke.value = false
        foodConsumedByPipe.value = false
        isHovered.value = false
        currentDraggedItem.value = null
        return
    }

    if (isHovered.value) {
        if (itemType === 'food') {
            if (foodCategory === 'food') {
                feedPet(foodId)
                nextTutorialStep()
            } else {
                if (!(foodId === 'lifePotion' && gameData.lives >= 3)) {
                    otherFeedPet(foodId)
                }
            }
        } else if (itemType === 'foam') {
            if(!statusFoam.value){
                statusFoam.value = true
                nextTutorialStep()
                if (foodId) {
                    removeFromCart(foodId)
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

// Настраиваем useDraggable для каждого предмета
export const foodDrag = useDraggable(foodEl, {
    disabled: computed(() => Object.keys(gameData.cart).length === 0),
    preventDefault: true,
    onStart: (pos, event) => {
        currentDraggedItem.value = 'food'
        foodConsumedByPipe.value = false
        if (foodEl.value) {
            const rect = foodEl.value.getBoundingClientRect()
            foodDrag.x.value = rect.left
            foodDrag.y.value = rect.top
        }
    },
    onMove: (pos, event) => {
        // Передаем событие движения
        updateEyeLook(event)

        const foodId = currentFoodItem.value?.id
        const foodCategory = currentFoodItem.value?.category
        handleMove(event, 'food', foodId, foodCategory)
    },
    onEnd: () => {
        const foodId = currentFoodItem.value?.id
        const foodCategory = currentFoodItem.value?.category
        if (actionTimer) {
            clearTimeout(actionTimer)
            actionTimer = null
        }
        statusSmoke.value = false
        handleEnd('food', foodId, foodCategory)

        resetEyeLook(600)
    }
})

export const showerDrag = useDraggable(showerEl, {
    preventDefault: true,
    onStart: (pos, event) => {
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