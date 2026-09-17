import {useDraggable} from "@vueuse/core";
import {computed, ref} from "vue";
import {addCoin, feedPet, otherFeedPet} from "@/scripts/actions.js";
import {
    currentDraggedItem,
    dropZoneRef,
    feedStatus,
    gameData,
    statusFoam,
    statusShower
} from "@/scripts/useGameStore.js";

import {currentFoodItem,} from "@/scripts/basket.js";
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


// Универсальная функция проверки зоны и открытия рта
export function handleMove(event, itemType,foodId,foodCategory) {
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

                        // if (gameData.addictionStreak >= 2) {
                        //     mouth.value = "/character/sad_mouth.webp"
                        //     previousMouth = "/character/sad_mouth.webp"
                        // }
                    }, 3000)
                }
            }
            gameData.sleep = false


            // mouth.value = '/character/open_mouth.webp'
        } else if (itemType === 'shower') {

            batheStatus.value = true
            if (statusFoam.value === true) {
                statusShower.value = true

                if (!actionTimer) {
                    actionTimer = setTimeout(() => {
                        statusShower.value = false
                        statusFoam.value = false
                        showerCount.value += 1
                        gameData.stinky = false
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
        // Возвращаем тот рот, который был надет ДО поднятия предмета

    }
}

// Универсальная функция окончания перетаскивания
export function handleEnd(itemType, foodId, foodCategory) {
    // Если еда уже была съедена конусом через таймер
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
            } else {
                if (!(foodId === 'lifePotion' && gameData.lives >= 3)) {
                    otherFeedPet(foodId)
                }
            }


        } else if (itemType === 'foam') {
            statusFoam.value = true
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

// Настраиваем useDraggable для каждого предмета отдельно
export const foodDrag = useDraggable(foodEl, {
    disabled: computed(() => Object.keys(gameData.cart).length === 0),
    preventDefault: true,
    onStart: (pos, event) => {
        currentDraggedItem.value = 'food'
        foodConsumedByPipe.value = false
        // Жестко фиксируем стартовые координаты с экрана в момент касания
        if (foodEl.value) {
            const rect = foodEl.value.getBoundingClientRect()
            foodDrag.x.value = rect.left
            foodDrag.y.value = rect.top
        }
    },
    onMove: (pos, event) => {
        // Актуальные id и category берем на каждый сдвиг из текущего элемента
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
    onMove: (pos, event) => handleMove(event, 'shower'),
    onEnd: () => handleEnd('shower')
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
    onMove: (pos, event) => handleMove(event, 'foam'),
    onEnd: () => handleEnd('foam')
})